from flask import render_template, flash, redirect, url_for, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
from models import User, Coiffeur, Service, Booking, Review, TimeSlot, Reward
from forms import LoginForm, RegistrationForm, RendezvousForm, ReviewForm
from datetime import datetime, timedelta
from utils import send_email_notification, add_to_google_calendar, generate_verification_token, send_verification_email
from flask_mail import Message, Mail
from itsdangerous import URLSafeTimedSerializer
from db import db  # Import db directly from db.py
from flask import Blueprint
from collections import Counter
from sqlalchemy import func
from app import mail  # Assurez-vous que cela correspond à l'endroit où vous avez initialisé mail
from flask_wtf.csrf import validate_csrf
from wtforms.validators import ValidationError

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
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            send_reset_email(user)
            flash('Un e-mail avec les instructions pour réinitialiser votre mot de passe a été envoyé.', 'info')
        else:
            flash('Adresse e-mail non trouvée.', 'error')
        return redirect(url_for('main.login'))
    return render_template('public/reset_password.html')

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
        return jsonify({'success': True})

    except Exception as e:
        print(f"Exception dans book_appointment: {str(e)}")
        print(f"Type de l'exception: {type(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/api/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        
        # Vérifier que c'est bien le rendez-vous du client connecté
        if appointment.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        # Mettre à jour le statut et libérer le créneau
        appointment.status = 'cancelled'
        time_slot = TimeSlot.query.get(appointment.time_slot_id)
        if time_slot:
            time_slot.is_available = True
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Erreur d'annulation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/client/history')
@login_required
def client_history():
    # Remplacer Appointment par Booking
    past_appointments = Booking.query.filter(
        Booking.client_id == current_user.id,
        Booking.datetime <= datetime.now()
    ).order_by(Booking.datetime.desc()).all()
    
    return render_template('client/history.html', past_appointments=past_appointments)

@main.route('/coiffeur/dashboard')
@login_required
def coiffeur_dashboard():
    if current_user.role != 'coiffeur':
        return redirect(url_for('main.index'))
        
    coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
    
    # Récupérer les rendez-vous à venir avec statut 'pending'
    upcoming_appointments = Booking.query.filter(
        Booking.coiffeur_id == coiffeur.id,
        Booking.datetime > datetime.now(),
        Booking.status == 'pending'  # Uniquement les rendez-vous en attente
    ).order_by(Booking.datetime).all()

    # Rendez-vous d'aujourd'hui
    today_appointments = [apt for apt in upcoming_appointments 
                         if apt.datetime.date() == datetime.now().date()]
    
    return render_template('coiffeur/dashboard.html',
                         coiffeur=coiffeur,
                         upcoming_appointments=upcoming_appointments,
                         today_appointments=today_appointments)

@main.route('/api/appointments/<int:appointment_id>/complete', methods=['POST'])
@login_required
def complete_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        abort(403)
        
    appointment = Booking.query.get_or_404(appointment_id)
    if appointment.coiffeur_id != current_user.coiffeur.id:
        abort(403)
        
    appointment.status = 'completed'
    db.session.commit()
    
    return jsonify({'success': True})


@main.route('/save_availability', methods=['POST'])
@login_required
def save_availability():
    try:
        data = request.get_json()
        slots = data.get('slots', [])
        hairdresser_id = data.get('hairdresser_id')

        if not slots or not hairdresser_id:
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400

        for slot in slots:
            day = slot.get('day', '').lower()  # Forcer en minuscules
            start_time = slot.get('start_time')
            end_time = slot.get('end_time')
            
            if not all([day, start_time, end_time]):
                continue
                
            existing_slot = TimeSlot.query.filter(
                TimeSlot.coiffeur_id == hairdresser_id,
                func.lower(TimeSlot.weekday) == day,
                TimeSlot.start_time == start_time,
                TimeSlot.end_time == end_time
            ).first()

            if not existing_slot:
                time_slot = TimeSlot(
                    coiffeur_id=hairdresser_id,
                    weekday=day,
                    start_time=start_time,
                    end_time=end_time,
                    is_available=True
                )
                db.session.add(time_slot)

        db.session.commit()
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
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
def coiffeur_confirm_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403

    try:
        appointment = Booking.query.get_or_404(appointment_id)
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        if appointment.coiffeur_id != coiffeur.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        appointment.status = 'confirmed'
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erreur de confirmation: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Route pour l'annulation côté client
@main.route('/client/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def client_cancel_appointment(appointment_id):
    if current_user.role != 'client':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403

    try:
        appointment = Booking.query.get_or_404(appointment_id)
        if appointment.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        appointment.status = 'cancelled'
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
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
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
    try:
        data = request.get_json()
        weekday = int(data.get('weekday'))
        selected_slots = data.get('slots', [])
        
        print(f"Ajout de disponibilités - Jour: {weekday}, Slots: {selected_slots}")
        
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        print(f"Coiffeur trouvé: ID={coiffeur.id}")

        # Supprimer les anciens créneaux
        deleted = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur.id,
            weekday=weekday  # Stockons le jour comme un nombre
        ).delete()
        print(f"Créneaux supprimés: {deleted}")

        # Ajouter les nouveaux créneaux
        for slot_time in selected_slots:
            try:
                time_slot = TimeSlot(
                    coiffeur_id=coiffeur.id,
                    weekday=weekday,  # Stockons le jour comme un nombre
                    start_time=slot_time,
                    end_time=f"{(int(slot_time.split(':')[0]) + 1):02d}:{slot_time.split(':')[1]}",
                    is_available=True
                )
                db.session.add(time_slot)
                print(f"Créneau ajouté: {time_slot}")
                
            except ValueError as e:
                print(f"Erreur lors de l'ajout du créneau {slot_time}: {str(e)}")
                continue
        
        db.session.commit()
        print("Commit réussi")
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur ajout disponibilités: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/finish_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def finish_appointment(appointment_id):
    if current_user.role != 'coiffeur':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403

    try:
        appointment = Booking.query.get_or_404(appointment_id)
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        
        if appointment.coiffeur_id != coiffeur.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        # Mettre à jour le statut et la date de complétion
        appointment.status = 'completed'
        appointment.completed_at = datetime.now()
        
        # Mettre à jour les points de fidélité du client
        client = User.query.get(appointment.client_id)
        if client:
            client.loyalty_points += 10
            client.completed_bookings += 1
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Erreur de completion: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@main.route('/coiffeur/get_slots/<int:weekday>')
@login_required
def get_slots(weekday):
    if current_user.role != 'coiffeur':
        return jsonify({'error': 'Non autorisé'}), 403

    try:
        coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
        if not coiffeur:
            return jsonify({'error': 'Coiffeur non trouvé'}), 404

        # Récupérer tous les créneaux pour ce jour
        slots = TimeSlot.query.filter_by(
            coiffeur_id=coiffeur.id,
            weekday=str(weekday)  # Convertir en string car c'est comme ça dans la BD
        ).all()

        # Récupérer les réservations associées
        bookings = Booking.query.join(TimeSlot).filter(
            TimeSlot.coiffeur_id == coiffeur.id,
            TimeSlot.weekday == str(weekday)
        ).all()

        slots_data = []
        for slot in slots:
            # Trouver la réservation correspondante s'il y en a une
            booking = next((b for b in bookings if b.time_slot_id == slot.id), None)
            
            slot_data = {
                'id': slot.id,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'is_booked': booking is not None,
                'is_completed': booking.status == 'completed' if booking else False,
                'is_available': slot.is_available
            }
            slots_data.append(slot_data)

        return jsonify({
            'success': True,
            'slots': slots_data
        })

    except Exception as e:
        print(f"Erreur dans get_slots: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        days_map = {
            'lundi': 1,
            'mardi': 2,
            'mercredi': 3,
            'jeudi': 4,
            'vendredi': 5,
            'samedi': 6
        }
        weekday = days_map.get(day.lower())
        print(f"Jour demandé: {day}, weekday: {weekday}")
        
        if weekday is None:
            return jsonify({'error': 'Jour invalide'}), 400

        slots = TimeSlot.query.filter_by(
            coiffeur_id=hairdresser_id,
            weekday=weekday  # Utilisons le nombre
        ).all()
        print(f"Nombre de créneaux trouvés: {len(slots)}")

        # Récupérons les réservations
        booked_slots = Booking.query.join(TimeSlot).filter(
            TimeSlot.coiffeur_id == hairdresser_id,
            TimeSlot.weekday == weekday,
            Booking.status != 'cancelled'
        ).all()
        print(f"Nombre de réservations: {len(booked_slots)}")

        booked_slot_ids = {booking.time_slot_id for booking in booked_slots}

        slots_data = []
        for slot in slots:
            slots_data.append({
                'id': slot.id,
                'time': slot.start_time,
                'is_available': slot.is_available and slot.id not in booked_slot_ids
            })
        print(f"Données des créneaux: {slots_data}")

        return jsonify({
            'success': True,
            'slots': slots_data
        })

    except Exception as e:
        print(f"Erreur dans get_hairdresser_slots: {str(e)}")
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
            'Possibilité d\'avancer votre rendez-vous',
            f'Votre coiffeur est disponible plus tôt que prévu. ' \
            f'Contactez-le pour avancer votre rendez-vous du {appointment.datetime.strftime("%d/%m/%Y à %H:%M")}.'
        )
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erreur proposition avancement: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
