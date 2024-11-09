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
    # Si l'utilisateur est déjà connecté et vérifié
    if current_user.is_authenticated:
        if current_user.is_verified:
            if current_user.role == 'coiffeur':
                return redirect(url_for('main.coiffeur_dashboard'))
            else:
                return redirect(url_for('main.client_dashboard'))
        else:
            return redirect(url_for('main.verify_account'))
        
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            
            if not user.is_verified:
                flash('Veuillez vérifier votre compte avant de continuer.', 'warning')
                return redirect(url_for('main.verify_account'))
                
            if user.role == 'coiffeur':
                return redirect(url_for('main.coiffeur_dashboard'))
            else:
                return redirect(url_for('main.client_dashboard'))
            
        flash('Email ou mot de passe invalide', 'danger')
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

    return render_template(
        'client/dashboard.html',
        upcoming_appointments=upcoming_appointments,
        past_appointments=past_appointments,
        favorite_hairdresser=favorite_hairdresser,
        hairdresser_counts=hairdresser_counts,
        total_appointments=total_appointments,
        loyalty_points=current_user.loyalty_points
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
    hairdressers = User.query.filter_by(role='coiffeur').all()
    return jsonify([{
        'id': h.id,
        'name': h.username
    } for h in hairdressers])

@main.route('/get_availability')
@login_required
def get_availability():
    try:
        coiffeur_id = request.args.get('hairdresser_id')
        day = request.args.get('day')
        
        print(f"Recherche des créneaux pour coiffeur_id={coiffeur_id}, day={day}")
        
        # Récupérer tous les créneaux pour ce jour, qu'ils soient disponibles ou non
        slots = TimeSlot.query.filter(
            TimeSlot.coiffeur_id == coiffeur_id,
            func.lower(TimeSlot.weekday) == func.lower(day)
        ).all()
        
        slots_data = [{
            'id': slot.id,
            'time': slot.start_time,
            'is_available': slot.is_available,
            'booking_info': get_booking_info(slot) if not slot.is_available else None
        } for slot in slots]
        
        return jsonify(slots_data)
        
    except Exception as e:
        print(f"Erreur dans get_availability: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_booking_info(slot):
    booking = Booking.query.filter_by(time_slot_id=slot.id).first()
    if booking:
        return {
            'client_name': booking.client.username,
            'status': booking.status
        }
    return None

@main.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
    try:
        print("=== Début de la réservation ===")
        data = request.get_json()
        
        slot_id = data.get('slot_id')
        hairdresser_id = data.get('hairdresser_id')
        
        # Récupérer le créneau
        time_slot = TimeSlot.query.get(slot_id)
        if not time_slot:
            return jsonify({'success': False, 'error': f'Créneau {slot_id} non trouvé'}), 404

        if not time_slot.is_available:
            return jsonify({'success': False, 'error': 'Ce créneau n\'est plus disponible'}), 400

        # Créer la date complète du rendez-vous en combinant le jour et l'heure
        weekday_map = {
            'lundi': 0, 'mardi': 1, 'mercredi': 2, 
            'jeudi': 3, 'vendredi': 4, 'samedi': 5
        }
        
        today = datetime.now()
        current_weekday = today.weekday()
        target_weekday = weekday_map[time_slot.weekday.lower()]
        
        # Calculer le nombre de jours jusqu'au prochain jour cible
        days_ahead = target_weekday - current_weekday
        if days_ahead <= 0:  # Si le jour est déjà passé cette semaine, aller à la semaine suivante
            days_ahead += 7
            
        target_date = today + timedelta(days=days_ahead)
        
        # Convertir l'heure du créneau (format string) en heures et minutes
        hour, minute = map(int, time_slot.start_time.split(':'))
        
        # Créer le datetime final pour le rendez-vous
        appointment_datetime = target_date.replace(
            hour=hour, 
            minute=minute, 
            second=0, 
            microsecond=0
        )
        
        # Créer la réservation avec la bonne date
        booking = Booking(
            client_id=current_user.id,
            coiffeur_id=time_slot.coiffeur_id,
            time_slot_id=slot_id,
            datetime=appointment_datetime,
            status='confirmed'
        )

        # Marquer le créneau comme non disponible
        time_slot.is_available = False

        db.session.add(booking)
        db.session.commit()

        # Envoyer l'email de confirmation au client
        coiffeur = User.query.get(time_slot.coiffeur_id)
        
        # Email au client
        client_msg = Message(
            'Confirmation de votre rendez-vous - Agendaide',
            recipients=[current_user.email]
        )
        
        client_msg.html = render_template(
            'emails/booking_confirmation.html',
            username=current_user.username,
            date=time_slot.weekday.capitalize(),
            time=time_slot.start_time,
            coiffeur_name=coiffeur.username,
            is_client=True
        )
        
        # Email au coiffeur
        coiffeur_msg = Message(
            'Nouveau rendez-vous - Agendaide',
            recipients=[coiffeur.email]
        )
        
        coiffeur_msg.html = render_template(
            'emails/booking_confirmation.html',
            username=coiffeur.username,
            date=time_slot.weekday.capitalize(),
            time=time_slot.start_time,
            client_name=current_user.username,
            is_client=False
        )
        
        # Envoi des deux emails
        mail.send(client_msg)
        mail.send(coiffeur_msg)

        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Exception complète:", str(e))
        import traceback
        print("Traceback:", traceback.format_exc())
        return jsonify({'success': False, 'error': f"Erreur lors de la réservation: {str(e)}"}), 500

@main.route('/api/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    try:
        appointment = Booking.query.get_or_404(appointment_id)
        
        # Vérifier que le rendez-vous appartient bien au client connecté
        if appointment.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
            
        # Vérifier que le rendez-vous n'est pas déjà annulé
        if appointment.status == 'cancelled':
            return jsonify({'success': False, 'error': 'Ce rendez-vous est déjà annulé'}), 400
            
        # Récupérer les informations nécessaires avant l'annulation
        time_slot = appointment.time_slot
        coiffeur = appointment.coiffeur.user
        
        # Annuler le rendez-vous
        appointment.status = 'cancelled'
        if time_slot:
            time_slot.is_available = True
            
        try:
            # Email au client
            client_msg = Message(
                'Confirmation d\'annulation - Agendaide',
                recipients=[current_user.email]
            )
            client_msg.html = render_template(
                'emails/cancellation_client.html',
                username=current_user.username,
                date=appointment.datetime.strftime('%d/%m/%Y'),
                time=appointment.datetime.strftime('%H:%M'),
                coiffeur_name=coiffeur.username
            )

            # Email au coiffeur
            coiffeur_msg = Message(
                'Annulation d\'un rendez-vous - Agendaide',
                recipients=[coiffeur.email]
            )
            coiffeur_msg.html = render_template(
                'emails/cancellation_coiffeur.html',
                client_name=current_user.username,
                date=appointment.datetime.strftime('%d/%m/%Y'),
                time=appointment.datetime.strftime('%H:%M')
            )

            # Envoi des emails
            mail.send(client_msg)
            mail.send(coiffeur_msg)
            
        except Exception as email_error:
            print(f"Erreur lors de l'envoi des emails: {str(email_error)}")
            # On continue même si les emails échouent
            
        # Sauvegarder les changements
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rendez-vous annulé avec succès'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de l'annulation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        abort(403)
        
    # Récupérer le coiffeur associé à l'utilisateur
    coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
    
    # Calculer la date de début de semaine (lundi)
    today = datetime.now()
    week_start_date = today - timedelta(days=today.weekday())
    
    # Générer les dates de la semaine
    days_with_dates = []
    french_days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    for i in range(7):
        current_date = week_start_date + timedelta(days=i)
        days_with_dates.append((french_days[i], current_date))
    
    # Récupérer les rendez-vous du jour
    today = datetime.now().date()
    today_appointments = Booking.query.filter(
        Booking.coiffeur_id == coiffeur.id,
        func.date(Booking.datetime) == today,
        Booking.status != 'cancelled'
    ).order_by(Booking.datetime).all()
    
    # Récupérer les prochains rendez-vous (après aujourd'hui)
    upcoming_appointments = Booking.query.filter(
        Booking.coiffeur_id == coiffeur.id,
        func.date(Booking.datetime) > today,
        Booking.status != 'cancelled'
    ).order_by(Booking.datetime).all()
    
    return render_template('coiffeur/dashboard.html',
                         week_start_date=week_start_date,
                         days_with_dates=days_with_dates,
                         today_appointments=today_appointments,
                         upcoming_appointments=upcoming_appointments)

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

@main.route('/send-test-email')
def send_test_email():
       from flask_mail import Message
       msg = Message('Test Email',
                     recipients=['shadowytcontactpro@gmail.com'])  # Remplacez par l'adresse email du destinataire
       msg.body = 'Ceci est un email de test.'
       mail.send(msg)
       return 'Email de test envoyé !'

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