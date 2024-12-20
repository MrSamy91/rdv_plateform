from flask import render_template, flash, redirect, url_for, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
from models import User, Coiffeur, Service, Booking, Review, TimeSlot, Reward
from forms import LoginForm, RegistrationForm, RendezvousForm, ReviewForm
from utils import send_email_notification, add_to_google_calendar, generate_verification_token, send_verification_email
from flask_mail import Message, Mail
from itsdangerous import URLSafeTimedSerializer
from db import db
from flask import Blueprint
from collections import Counter
from sqlalchemy import func, desc
from app import mail
from flask_wtf.csrf import validate_csrf
from wtforms.validators import ValidationError
from flask_wtf.csrf import CSRFProtect

main = Blueprint('main', __name__)

# Début des pages

@main.route('/')
def index():
    return render_template('public/home.html', title='Accueil')

@main.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        try:
            # Vérifier si l'utilisateur existe déjà
            if User.query.filter_by(username=form.username.data).first():
                flash('Ce nom d\'utilisateur est déjà pris.', 'danger')
                return render_template('public/register.html', form=form)
            
            if User.query.filter_by(email=form.email.data).first():
                flash('Cette adresse email est déjà utilisée.', 'danger')
                return render_template('public/register.html', form=form)
            
            # Générer le token
            verification_token = generate_verification_token()
            
            # Créer l'utilisateur
            user = User(
                username=form.username.data,
                email=form.email.data,
                phone_number=form.phone_number.data,
                role='client',
                is_verified=False,
                verification_token=verification_token,
                token_expiration=datetime.now() + timedelta(hours=24)
            )
            user.set_password(form.password.data)
            
            # Sauvegarder l'utilisateur
            db.session.add(user)
            db.session.commit()
            
            # Envoyer l'email de vérification
            if send_verification_email(user, verification_token):
                flash('Un email de vérification a été envoyé à votre adresse email.', 'success')
            else:
                flash('Erreur lors de l\'envoi de l\'email de vérification.', 'danger')
            
            # Connecter l'utilisateur
            login_user(user)
            
            # Rediriger vers la page de vérification
            return redirect(url_for('main.verify_account'))
            
        except Exception as e:
            db.session.rollback()
            print(f"Erreur d'inscription: {str(e)}")
            flash('Une erreur est survenue lors de l\'inscription.', 'danger')
            
    return render_template('public/register.html', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        try:
            user = User.query.filter_by(email=form.email.data).first()
            if user and user.check_password(form.password.data):
                login_user(user, remember=form.remember.data)
                next_page = request.args.get('next')
                if not next_page or url_parse(next_page).netloc != '':
                    if user.role == 'client':
                        next_page = url_for('main.client_dashboard')
                    elif user.role == 'coiffeur':
                        next_page = url_for('main.coiffeur_dashboard')
                return redirect(next_page)
            flash('Email ou mot de passe incorrect.', 'error')
        except Exception as e:
            print(f"Erreur de connexion: {str(e)}")
            flash('Une erreur est survenue lors de la connexion.', 'error')
    return render_template('public/login.html', form=form)


@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@main.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            try:
                # Générer un token de réinitialisation
                reset_token = generate_verification_token()
                user.reset_token = reset_token
                user.reset_token_expiration = datetime.now() + timedelta(hours=1)
                db.session.commit()
                
                # Envoyer l'email avec le lien de réinitialisation
                send_email_notification(
                    user.email,
                    'Réinitialisation de votre mot de passe',
                    'emails/reset_password.html',
                    username=user.username,
                    reset_link=url_for('main.reset_password_confirm', token=reset_token, _external=True)
                )
                
                flash('Un email de réinitialisation vous a été envoyé.', 'success')
                return redirect(url_for('main.login'))
            except Exception as e:
                print(f"Erreur envoi email reset: {str(e)}")
                flash('Une erreur est survenue lors de l\'envoi de l\'email.', 'error')
        else:
            # Pour la sécurité, ne pas indiquer si l'email existe ou non
            flash('Si cette adresse email existe, vous recevrez un lien de réinitialisation.', 'info')
            
    return render_template('public/reset_password.html')

@main.route('/reset_password_confirm/<token>', methods=['GET', 'POST'])
def reset_password_confirm(token):
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expiration < datetime.now():
        flash('Le lien de réinitialisation est invalide ou a expiré.', 'error')
        return redirect(url_for('main.reset_password'))
        
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Les mots de passe ne correspondent pas.', 'error')
        else:
            try:
                user.set_password(password)
                user.reset_token = None
                user.reset_token_expiration = None
                db.session.commit()
                
                flash('Votre mot de passe a été réinitialisé avec succès.', 'success')
                return redirect(url_for('main.login'))
            except Exception as e:
                print(f"Erreur reset password: {str(e)}")
                flash('Une erreur est survenue lors de la réinitialisation.', 'error')
    
    return render_template('public/reset_password_confirm.html')

# Fin des pages

@main.route('/client/dashboard')
@login_required
def client_dashboard():
    # Récupérer tous les rendez-vous
    all_appointments = Booking.query.filter_by(client_id=current_user.id).all()
    upcoming_appointments = Booking.query.filter(
        Booking.client_id == current_user.id,
        Booking.datetime > datetime.now(),
        Booking.status != 'cancelled'
    ).order_by(Booking.datetime).all()
    
    past_appointments = Booking.query.filter(
        Booking.client_id == current_user.id,
        Booking.datetime <= datetime.now()
    ).order_by(Booking.datetime.desc()).all()

    # Calculer le coiffeur favori
    favorite_hairdresser = None
    hairdresser_counts = {}
    total_appointments = len(all_appointments)

    if all_appointments:
        # Compter le nombre de rendez-vous par coiffeur
        hairdresser_counts = Counter(appointment.coiffeur.user.username for appointment in all_appointments)
        
        # Trouver le coiffeur avec le plus de rendez-vous
        most_common_hairdresser, count = hairdresser_counts.most_common(1)[0]
        
        # Vérifier si le coiffeur représente 70% ou plus des rendez-vous
        if (count / total_appointments) >= 0.7:  # 70% ou plus
            favorite_hairdresser = most_common_hairdresser

    selected_coiffeur_id = request.args.get('coiffeur_id')  # Récupérer depuis l'URL
    return render_template(
        'client/dashboard.html',
        upcoming_appointments=upcoming_appointments,
        past_appointments=past_appointments,
        favorite_hairdresser=favorite_hairdresser,
        hairdresser_counts=hairdresser_counts,
        total_appointments=total_appointments,
        loyalty_points=current_user.loyalty_points,
        selected_coiffeur_id=selected_coiffeur_id
    )

@main.route('/administration/admin')
@login_required
def admin_panel():
    if not current_user.is_admin:
        abort(403)  # Forbidden access
        
    users = User.query.all()
    return render_template('administration/admin.html', users=users)

@main.route('/assign_role', methods=['POST'])
@login_required
def assign_role():
    if not current_user.is_admin:
        abort(403)
        
    user_id = request.form.get('user_id')
    new_role = request.form.get('new_role')
    
    user = User.query.get_or_404(user_id)
    user.role = new_role
    db.session.commit()
    
    flash(f'Role updated for {user.name}')
    return redirect(url_for('admin_panel'))

@main.route('/public/login', methods=['GET', 'POST'])
def public_login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
        
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.index'))
        else:
            flash('Email ou mot de passe invalide')
            
    return render_template('public/login.html', form=form)







@main.route('/client/questions')
@login_required
def questions():
    services = Service.query.all()
    return render_template('client/questions.html', services=services)


@main.route('/client/search')
@login_required
def client_search():
    # Récupérer tous les coiffeurs
    coiffeurs = Coiffeur.query.all()
    # Récupérer tous les services disponibles
    services = Service.query.all()
    
    return render_template('client/prise.html', 
                         title='Recherche',
                         coiffeurs=coiffeurs,
                         services=services)



@main.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        abort(403)  # Forbidden
    users = User.query.all()
    return render_template('admin.html', users=users)

# Ajout de la route pour prendre rendez-vous
@main.route('/rendez-vous/nouveau', methods=['GET', 'POST'])
@login_required
def prendre_rendez_vous():
    return render_template('rendez_vous/nouveau.html')

# Ajout de la route pour le profil
@main.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@main.route('/api/hairdressers')
@login_required
def get_hairdressers():
    try:
        coiffeurs = Coiffeur.query.all()
        coiffeurs_data = [{
            'id': coiffeur.id,  # Utiliser l'ID de la table Coiffeur
            'name': coiffeur.user.username,
            'specialties': coiffeur.specialties or 'Non spécifié',
            'experience': coiffeur.years_of_experience or 0
        } for coiffeur in coiffeurs]
        
        return jsonify(coiffeurs_data)
    except Exception as e:
        print(f"Erreur récupération coiffeurs: {str(e)}")
        return jsonify([])

@main.route('/get_availability')
@login_required
def get_availability():
    try:
        coiffeur_id = int(request.args.get('hairdresser_id'))
        day = request.args.get('day')
        
        print(f"Recherche des créneaux pour coiffeur_id={coiffeur_id}, day={day}")
        
        # Récupérer tous les créneaux pour ce jour
        slots = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur_id,
            weekday=day.lower()
        ).all()
        
        print(f"Créneaux trouvés: {slots}")
        
        slots_data = [{
            'id': slot.id,
            'time': f"{slot.start_time}-{slot.end_time}",
            'is_available': slot.is_available
        } for slot in slots]
        
        return jsonify(slots_data)
        
    except Exception as e:
        print(f"Erreur dans get_availability: {str(e)}")
        return jsonify([])

@main.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
    try:
        print("=== Début de la réservation ===")
        data = request.get_json()
        slot_id = data.get('slot_id')
        hairdresser_id = data.get('hairdresser_id')

        print(f"Réservation pour slot_id={slot_id}, hairdresser_id={hairdresser_id}")

        # Récupérer le coiffeur
        coiffeur = Coiffeur.query.get_or_404(hairdresser_id)
        time_slot = TimeSlot.query.get(slot_id)
        
        if not time_slot:
            return jsonify({'success': False, 'error': 'Créneau non trouvé'}), 404
        
        if not time_slot.is_available:
            return jsonify({'success': False, 'error': 'Ce créneau n\'est plus disponible'}), 400

        print(f"Créneau trouvé: jour={time_slot.weekday}, heure={time_slot.start_time}")

        # Convertir le weekday en entier
        weekday_map = {
            '1': 0,  # Lundi -> 0 (pour timedelta)
            '2': 1,  # Mardi -> 1
            '3': 2,  # Mercredi -> 2
            '4': 3,  # Jeudi -> 3
            '5': 4,  # Vendredi -> 4
            '6': 5,  # Samedi -> 5
            1: 0,    # Gérer aussi les entiers
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5
        }
        
        weekday = weekday_map.get(time_slot.weekday)
        if weekday is None:
            print(f"Jour invalide: {time_slot.weekday}")
            return jsonify({'success': False, 'error': 'Jour invalide'}), 400

        # Obtenir la date du prochain jour correspondant
        today = datetime.now()
        days_ahead = weekday - today.weekday()
        if days_ahead <= 0:  # Si le jour est déjà passé cette semaine
            days_ahead += 7
        
        appointment_date = today + timedelta(days=days_ahead)
        appointment_time = datetime.strptime(time_slot.start_time, '%H:%M').time()
        appointment_datetime = datetime.combine(appointment_date.date(), appointment_time)

        print(f"Date du rendez-vous calculée: {appointment_datetime}")

        # Créer la réservation
        booking = Booking(
            client_id=current_user.id,
            coiffeur_id=hairdresser_id,
            time_slot_id=slot_id,
            status='pending',
            datetime=appointment_datetime
        )

        # Marquer le créneau comme non disponible
        time_slot.is_available = False

        db.session.add(booking)
        db.session.commit()

        print("Réservation créée avec succès")
        
        # Envoyer email au client
        send_email_notification(
            current_user.email,
            'Confirmation de votre rendez-vous',
            'emails/booking_confirmation.html',
            is_client=True,
            username=current_user.username,
            coiffeur_name=coiffeur.user.username,
            date=booking.datetime.strftime('%d/%m/%Y'),
            time=booking.datetime.strftime('%H:%M')
        )
        
        # Envoyer email au coiffeur
        send_email_notification(
            coiffeur.user.email,
            'Nouveau rendez-vous',
            'emails/booking_confirmation.html',
            is_client=False,
            username=coiffeur.user.username,
            client_name=current_user.username,
            date=booking.datetime.strftime('%d/%m/%Y'),
            time=booking.datetime.strftime('%H:%M')
        )
        
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Erreur de réservation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/api/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        coiffeur = User.query.get(appointment.coiffeur.user_id)  # Récupérer l'utilisateur coiffeur
        
        if appointment.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        # Mettre à jour le statut et libérer le créneau
        appointment.status = 'cancelled'
        time_slot = TimeSlot.query.get(appointment.time_slot_id)
        if time_slot:
            time_slot.is_available = True
        
        db.session.commit()
        
        # Email au client
        send_email_notification(
            current_user.email,
            'Confirmation d\'annulation de votre rendez-vous',
            'emails/cancellation_client.html',
            username=current_user.username,
            coiffeur_name=coiffeur.username,
            date=appointment.datetime.strftime('%d/%m/%Y'),
            time=appointment.datetime.strftime('%H:%M')
        )
        
        # Email au coiffeur
        send_email_notification(
            coiffeur.email,
            'Annulation d\'un rendez-vous',
            'emails/cancellation_coiffeur.html',
            client_name=current_user.username,
            date=appointment.datetime.strftime('%d/%m/%Y'),
            time=appointment.datetime.strftime('%H:%M')
        )
        
        return jsonify({
            'success': True,
            'message': 'Rendez-vous annulé avec succès'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur d'annulation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/client/history')
@login_required
def client_history():
    now = datetime.now()
    past_appointments = Booking.query.filter(
        Booking.client_id == current_user.id,
        db.or_(
            # Soit le rendez-vous est passé
            Booking.datetime <= datetime.now(),
            # Soit le rendez-vous est confirmé (même futur)
            Booking.status == 'confirmed'
        ),
        # Exclure les rendez-vous annulés et en attente
        Booking.status != 'cancelled',
        Booking.status != 'pending'
    ).order_by(Booking.datetime.desc()).all()
    
    return render_template('client/history.html', 
                         past_appointments=past_appointments,
                         now=now)

@main.route('/coiffeur/dashboard')
@login_required
def coiffeur_dashboard():
    if current_user.role != 'coiffeur':
        return redirect(url_for('main.index'))
        
    coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)
    month_ago = today - timedelta(days=30)

    # Initialisation du dictionnaire stats AVANT de l'utiliser
    stats = {
        'clients_per_week': Booking.query.filter(
            Booking.coiffeur_id == coiffeur.id,
            Booking.datetime >= week_ago
        ).count(),
        'weekly_trend': Booking.query.filter(
            Booking.coiffeur_id == coiffeur.id,
            Booking.datetime >= week_ago
        ).count() - Booking.query.filter(
            Booking.coiffeur_id == coiffeur.id,
            Booking.datetime >= two_weeks_ago,
            Booking.datetime < week_ago
        ).count(),
        'clients_per_month': Booking.query.filter(
            Booking.coiffeur_id == coiffeur.id,
            Booking.datetime >= month_ago
        ).count(),
        'completed_appointments': Booking.query.filter(
            Booking.coiffeur_id == coiffeur.id,
            Booking.status == 'completed'
        ).count()
    }

    # Calcul des revenus
    current_revenue = db.session.query(func.sum(Service.price)).join(
        Booking, Service.id == Booking.service_id
    ).filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.datetime >= week_ago,
        Booking.status == 'completed'
    ).scalar() or 0

    previous_revenue = db.session.query(func.sum(Service.price)).join(
        Booking, Service.id == Booking.service_id
    ).filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.datetime >= two_weeks_ago,
        Booking.datetime < week_ago,
        Booking.status == 'completed'
    ).scalar() or 0

    # Mise à jour des stats avec les revenus
    stats.update({
        'total_revenue': current_revenue,
        'revenue_trend': current_revenue - previous_revenue
    })

    # Calcul du taux d'occupation
    total_slots = TimeSlot.query.filter(
        TimeSlot.coiffeur_id == coiffeur.id,
        TimeSlot.date >= today,
        TimeSlot.date <= today + timedelta(days=7)
    ).count()
    
    booked_slots = TimeSlot.query.filter(
        TimeSlot.coiffeur_id == coiffeur.id,
        TimeSlot.date >= today,
        TimeSlot.date <= today + timedelta(days=7),
        TimeSlot.is_available == False
    ).count()
    
    occupation_rate = (booked_slots / total_slots * 100) if total_slots > 0 else 0

    # Calcul du jour le plus demandé
    bookings_by_day = db.session.query(
        func.strftime('%w', Booking.datetime).label('weekday'),
        func.count(Booking.id).label('count')
    ).filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.status != 'cancelled'
    ).group_by('weekday').all()
    
    days_map = {
        '0': 'Dimanche', '1': 'Lundi', '2': 'Mardi',
        '3': 'Mercredi', '4': 'Jeudi', '5': 'Vendredi', '6': 'Samedi'
    }
    
    most_booked_day = None
    most_booked_count = 0
    total_bookings = 0
    
    for day in bookings_by_day:
        total_bookings += day.count
        if day.count > most_booked_count:
            most_booked_count = day.count
            most_booked_day = days_map.get(day.weekday)
    
    most_booked_day_percentage = round((most_booked_count / total_bookings * 100) if total_bookings > 0 else 0)

    # Mise à jour des stats avec les nouvelles informations
    stats.update({
        'occupation_rate': round(occupation_rate, 1),
        'most_booked_day': most_booked_day or 'N/A',
        'most_booked_day_percentage': most_booked_day_percentage
    })

    # Rendez-vous du jour avec datetime exact et tri
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_appointments = Booking.query.filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.datetime >= today_start,
        Booking.datetime <= today_end,
        Booking.status.in_(['pending', 'confirmed', 'completed'])
    ).join(
        User, User.id == Booking.client_id  # Pour avoir les infos client
    ).join(
        Service, Service.id == Booking.service_id  # Pour avoir le service
    ).order_by(
        Booking.datetime
    ).all()
    
    # Rendez-vous à venir (seulement les pending)
    upcoming_appointments = Booking.query.filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.datetime > today_end,
        Booking.status == 'pending'  # Uniquement les rendez-vous en attente
    ).order_by(Booking.datetime).all()  # Tri par date

    # Préparation des événements du calendrier
    calendar_events = []
    all_appointments = today_appointments + upcoming_appointments
    
    for apt in all_appointments:
        event_class = 'event-completed' if apt.status == 'completed' else 'event-pending'
        calendar_events.append({
            'id': apt.id,
            'title': f"{apt.client.username}",
            'start': apt.datetime.strftime('%Y-%m-%dT%H:%M:00'),
            'end': (apt.datetime + timedelta(minutes=60)).strftime('%Y-%m-%dT%H:%M:00'),
            'className': event_class,
            'extendedProps': {
                'status': apt.status,
                'client_phone': apt.client.phone_number
            }
        })

    return render_template('coiffeur/dashboard.html',
                         coiffeur=coiffeur,
                         stats=stats,
                         today_appointments=today_appointments,
                         upcoming_appointments=upcoming_appointments,
                         calendar_events=calendar_events)

@main.route('/coiffeur/manage-availability')
@login_required
def manage_availability():
    if current_user.role != 'coiffeur':
        return redirect(url_for('main.index'))
    
    coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
    
    # Initialiser le dictionnaire des créneaux par jour
    slots_by_day = {
        'lundi': {},
        'mardi': {},
        'mercredi': {},
        'jeudi': {},
        'vendredi': {},
        'samedi': {}
    }
    
    # Récupérer les créneaux existants
    today = datetime.now().date()
    existing_slots = TimeSlot.query.filter(
        TimeSlot.coiffeur_id == coiffeur.id,
        TimeSlot.date >= today,
        TimeSlot.date <= today + timedelta(days=6)
    ).all()

    # Remplir le dictionnaire avec les créneaux existants
    weekdays = {
        '1': 'lundi',
        '2': 'mardi',
        '3': 'mercredi',
        '4': 'jeudi',
        '5': 'vendredi',
        '6': 'samedi'
    }
    
    for slot in existing_slots:
        day_name = weekdays.get(str(slot.weekday))
        if day_name:
            slots_by_day[day_name][slot.start_time] = {
                'is_available': slot.is_available,
                'is_booked': not slot.is_available
            }

    print("Slots by day:", slots_by_day)  # Debug

    return render_template('coiffeur/manage_availability.html', 
                         coiffeur=coiffeur,
                         slots_by_day=slots_by_day)

@main.route('/coiffeur/finish_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def finish_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
        
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        client = User.query.get(appointment.client_id)
        
        # Mettre à jour le statut
        appointment.status = 'completed'
        
        # Ajouter les points de fidélité (10 points par rendez-vous)
        points_earned = 10
        client.loyalty_points = client.loyalty_points + points_earned if client.loyalty_points else points_earned
        
        # Libérer le créneau horaire
        time_slot = TimeSlot.query.get(appointment.time_slot_id)
        if time_slot:
            time_slot.is_available = True
        
        db.session.commit()
        
        # Envoyer l'email de confirmation au client
        send_email_notification(
            client.email,
            'Merci pour votre visite - Points de fidélité gagnés',
            'emails/appointment_completed.html',
            username=client.username,
            coiffeur_name=current_user.username,
            date=appointment.datetime.strftime('%d/%m/%Y'),
            time=appointment.datetime.strftime('%H:%M'),
            points_earned=points_earned,
            total_points=client.loyalty_points
        )
        
        return jsonify({
            'success': True, 
            'message': 'Rendez-vous terminé avec succès',
            'points_earned': points_earned,
            'total_points': client.loyalty_points
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur confirmation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/save_availability', methods=['POST'])
@login_required
def save_availability():
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
        
    try:
        data = request.get_json()
        slots = data.get('slots', [])
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        
        if not slots:
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400

        # Supprimer les anciens créneaux non réservés
        existing_slots = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur.id,
            weekday=data.get('weekday')
        ).all()
        
        for slot in existing_slots:
            # Vérifier si le créneau a des réservations
            has_booking = Booking.query.filter_by(
                time_slot_id=slot.id,
                status='confirmed'
            ).first() is not None
            
            if not has_booking:
                db.session.delete(slot)

        # Ajouter les nouveaux créneaux
        for slot in slots:
            time_slot = TimeSlot(
                coiffeur_id=coiffeur.id,
                weekday=slot['day'],
                start_time=slot['start_time'],
                end_time=slot['end_time'],
                is_available=True
            )
            db.session.add(time_slot)

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Erreur sauvegarde disponibilités: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/verify-account', methods=['GET', 'POST'])
def verify_account():
    if request.method == 'POST':
        token = request.form.get('token')
        user = User.query.filter_by(verification_token=token).first()
        
        if user and user.token_expiration > datetime.now():
            user.is_verified = True
            user.verification_token = None
            user.token_expiration = None
            db.session.commit()
            
            # Connecter l'utilisateur
            login_user(user)
            
            flash('Votre compte a été vérifié avec succès!', 'success')
            # Rediriger vers le dashboard approprié selon le rôle
            if user.role == 'coiffeur':
                return redirect(url_for('main.coiffeur_dashboard'))
            else:
                return redirect(url_for('main.client_dashboard'))
        else:
            flash('Code de vérification invalide ou expiré.', 'danger')
            
    return render_template('public/verify_account.html')

@main.route('/resend-verification')
def resend_verification():
    if not current_user.is_authenticated:
        flash('Veuillez vous connecter d\'abord.', 'warning')
        return redirect(url_for('main.login'))
        
    if current_user.is_verified:
        flash('Votre compte est déjà vérifié.', 'info')
        return redirect(url_for('main.index'))
        
    # Générer un nouveau token
    verification_token = generate_verification_token()
    current_user.verification_token = verification_token
    current_user.token_expiration = datetime.now() + timedelta(hours=24)
    
    try:
        db.session.commit()
        # Envoyer l'email
        msg = Message(
            'Nouveau code de vérification - Agendaide',
            recipients=[current_user.email]
        )
        msg.html = render_template(
            'emails/verify_account.html',
            username=current_user.username,
            token=verification_token
        )
        mail.send(msg)
        
        flash('Un nouveau code de vérification vous a été envoyé par email.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Une erreur est survenue lors de l\'envoi du code.', 'danger')
        
    return redirect(url_for('main.verify_account'))

@main.route('/rewards')
@login_required
def rewards():
    available_rewards = Reward.query.filter_by(
        client_id=current_user.id,
        status='available'
    ).all()
    
    return render_template(
        'client/rewards.html',
        rewards=available_rewards,
        points=current_user.loyalty_points
    )

@main.route('/use-reward/<int:reward_id>', methods=['POST'])
@login_required
def use_reward(reward_id):
    reward = Reward.query.get_or_404(reward_id)
    
    if reward.client_id != current_user.id:
        abort(403)
    
    if reward.status != 'available':
        flash('Cette récompense n\'est plus disponible.', 'error')
        return redirect(url_for('main.rewards'))
    
    reward.status = 'used'
    reward.used_at = datetime.now()
    db.session.commit()
    
    flash('Votre récompense a été marquée comme utilisée.', 'success')
    return redirect(url_for('main.rewards'))

@main.route('/coiffeur/confirm_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def confirm_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
        
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        client = User.query.get(appointment.client_id)
        
        # Mettre à jour le statut
        appointment.status = 'confirmed'
        
        # Ajouter les points de fidélité (par exemple 10 points)
        points_earned = 10
        client.loyalty_points += points_earned
        
        db.session.commit()
        
        # Envoyer l'email de confirmation au client
        send_email_notification(
            client.email,
            'Rendez-vous confirmé - Points de fidélité gagnés',
            'emails/appointment_confirmed.html',
            username=client.username,
            coiffeur_name=current_user.username,
            date=appointment.datetime.strftime('%d/%m/%Y'),
            time=appointment.datetime.strftime('%H:%M'),
            service_name=appointment.service.name if appointment.service else "Non spécifié",
            points_earned=points_earned,
            total_points=client.loyalty_points
        )
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Erreur confirmation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Route pour l'annulation côté client
@main.route('/client/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def client_cancel_appointment(appointment_id):
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        
        # Vérifier que le client est bien le propriétaire du rendez-vous
        if appointment.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        # Vérifier que le rendez-vous n'est pas déjà annulé
        if appointment.status == 'cancelled':
            return jsonify({'success': False, 'error': 'Ce rendez-vous est déjà annulé'}), 400
            
        # Annuler le rendez-vous
        appointment.status = 'cancelled'
        
        # Libérer le créneau horaire
        time_slot = TimeSlot.query.get(appointment.time_slot_id)
        if time_slot:
            time_slot.is_available = True
        
        db.session.commit()
        
        # Envoyer les emails de notification
        try:
            # Email au client
            send_email_notification(
                current_user.email,
                'Confirmation d\'annulation de votre rendez-vous',
                'emails/cancellation_client.html',
                username=current_user.username,
                coiffeur_name=appointment.coiffeur.user.username,
                date=appointment.datetime.strftime('%d/%m/%Y'),
                time=appointment.datetime.strftime('%H:%M')
            )
            
            # Email au coiffeur
            send_email_notification(
                appointment.coiffeur.user.email,
                'Annulation d\'un rendez-vous',
                'emails/cancellation_coiffeur.html',
                client_name=current_user.username,
                date=appointment.datetime.strftime('%d/%m/%Y'),
                time=appointment.datetime.strftime('%H:%M')
            )
        except Exception as e:
            print(f"Erreur envoi email: {str(e)}")
            # On continue même si l'email échoue
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur d'annulation client: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Route pour l'annulation côté coiffeur
@main.route('/coiffeur/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def coiffeur_cancel_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403

    try:
        appointment = Booking.query.get_or_404(appointment_id)
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        if appointment.coiffeur_id != coiffeur.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        appointment.status = 'cancelled'
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erreur d'annulation coiffeur: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/add_availability', methods=['POST'])
@login_required
def add_availability():
    try:
        data = request.get_json()
        weekday = data.get('weekday')
        slots = data.get('slots')
        date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()

        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        if not coiffeur:
            return jsonify({'success': False, 'error': 'Coiffeur non trouvé'})

        # Supprimer les anciens créneaux pour cette date
        TimeSlot.query.filter_by(
            coiffeur_id=coiffeur.id,
            date=date
        ).delete()

        # Ajouter les nouveaux créneaux
        for start_time in slots:
            end_time = (datetime.strptime(start_time, '%H:%M') + timedelta(hours=1)).strftime('%H:%M')
            slot = TimeSlot(
                coiffeur_id=coiffeur.id,
                weekday=str(weekday),
                date=date,
                start_time=start_time,
                end_time=end_time,
                is_available=True
            )
            db.session.add(slot)

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Erreur sauvegarde disponibilités: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/get_slots/<int:day>')
@login_required
def get_slots(day):
    try:
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        if not coiffeur:
            return jsonify({'success': False, 'error': 'Coiffeur non trouvé'})

        # Récupérer la date spécifique depuis le paramètre de requête
        date_str = request.args.get('date')
        if not date_str:
            return jsonify({'success': False, 'error': 'Date non spécifiée'})
        
        specific_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # Récupérer les créneaux pour ce jour et cette date spécifique
        slots = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur.id,
            weekday=str(day),
            date=specific_date
        ).all()

        slots_data = []
        for slot in slots:
            booking = Booking.query.filter_by(time_slot_id=slot.id).first()
            slot_info = {
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'is_available': slot.is_available and not booking
            }
            slots_data.append(slot_info)

        return jsonify({
            'success': True,
            'slots': slots_data
        })

    except Exception as e:
        print(f"Erreur récupération slots: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/api/available_slots/<int:coiffeur_id>/<string:date>')
@login_required
def get_available_slots(coiffeur_id, date):
    try:
        # Convertir la date string en objet datetime
        selected_date = datetime.strptime(date, '%Y-%m-%d')
        weekday = selected_date.isoweekday()  # 1 = Lundi, ..., 6 = Samedi

        # Récupérer les créneaux disponibles pour ce jour
        slots = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur_id,
            weekday=weekday,
            is_available=True
        ).all()

        # Vérifier si la date est déjà passée
        if selected_date.date() < datetime.now().date():
            return jsonify({'slots': []})

        slots_data = [{
            'id': slot.id,
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'is_booked': not slot.is_available
        } for slot in slots]

        return jsonify({'success': True, 'slots': slots_data})

    except Exception as e:
        print(f"Erreur récupération créneaux: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/api/hairdresser_slots/<int:hairdresser_id>/<string:day>')
@login_required
def get_hairdresser_slots(hairdresser_id, day):
    try:
        print(f"Requête reçue pour le coiffeur {hairdresser_id} le jour {day}")
        weekday = get_weekday_number(day)
        
        if not weekday:
            return jsonify({
                'success': False,
                'error': 'Jour invalide'
            }), 400

        slots = TimeSlot.query.filter_by(
            coiffeur_id=hairdresser_id,
            weekday=weekday,
            is_available=True
        ).all()
        
        slots_data = [{
            'id': slot.id,
            'time': slot.start_time,
            'is_available': slot.is_available
        } for slot in slots]
        
        print(f"Créneaux trouvés pour {day}: {slots_data}")
        
        return jsonify({
            'success': True,
            'slots': slots_data
        })
        
    except Exception as e:
        print(f"Erreur récupération créneaux: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main.route('/api/setup_notification', methods=['POST'])
@login_required
def setup_notification():
    try:
        data = request.get_json()
        hairdresser_id = data.get('hairdresser_id')
        email = data.get('email')
        days = data.get('days')

        if not all([hairdresser_id, email, days]):
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400

        # Enregistrer la notification dans la base de données
        # TODO: Créer un modèle Notification si nécessaire
        
        # Envoyer un email de confirmation
        send_email_notification(
            email,
            'Notification de disponibilité',
            f'Vous serez notifié lorsqu\'un créneau sera disponible pour les jours: {", ".join(days)}'
        )

        return jsonify({'success': True})

    except Exception as e:
        print(f"Erreur setup notification: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/propose_earlier_time/<int:appointment_id>', methods=['POST'])
@login_required
def propose_earlier_time(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403

    try:
        appointment = Booking.query.get_or_404(appointment_id)
        client = User.query.get(appointment.client_id)
        
        # Envoyer l'email au client
        send_email_notification(
            client.email,
            'Possibilité de venir plus tôt',
            'emails/earlier_appointment.html',
            username=client.username,
            coiffeur_name=current_user.username,
            original_date=appointment.datetime.strftime('%d/%m/%Y'),
            original_time=appointment.datetime.strftime('%H:%M')
        )
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erreur proposition avancement: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/save_slots', methods=['POST'])
@login_required
def save_slots():
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
        
    try:
        data = request.get_json()
        slots = data.get('slots', [])
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        
        if not slots:
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400

        # Pour chaque créneau à sauvegarder
        for slot in slots:
            date = datetime.strptime(slot['date'], '%Y-%m-%d').date()
            
            # Supprimer les anciens créneaux non réservés pour cette date et ce créneau horaire
            TimeSlot.query.filter_by(
                coiffeur_id=coiffeur.id,
                date=date,
                start_time=slot['start_time'],
                is_available=True
            ).delete()

            # Créer le nouveau créneau
            time_slot = TimeSlot(
                coiffeur_id=coiffeur.id,
                date=date,
                weekday=str(date.weekday() + 1),  # 1 = Lundi, 2 = Mardi, etc.
                start_time=slot['start_time'],
                end_time=slot['end_time'],
                is_available=True
            )
            db.session.add(time_slot)

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Erreur sauvegarde créneaux: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def get_weekday_number(day_name):
    weekdays = {
        'lundi': '1',
        'mardi': '2',
        'mercredi': '3',
        'jeudi': '4',
        'vendredi': '5',
        'samedi': '6',
        'dimanche': '7'
    }
    return weekdays.get(day_name.lower())
