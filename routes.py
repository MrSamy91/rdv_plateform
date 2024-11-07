from flask import render_template, flash, redirect, url_for, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
from models import User, Coiffeur, Service, Booking, Review, TimeSlot
from forms import LoginForm, RegistrationForm, RendezvousForm, ReviewForm
from datetime import datetime, timedelta
from utils import send_email_notification, add_to_google_calendar
from flask_mail import Message, Mail
from itsdangerous import URLSafeTimedSerializer
from db import db  # Import db directly from db.py
from flask import Blueprint
from collections import Counter
from sqlalchemy import func
from app import mail  # Assurez-vous que cela correspond à l'endroit où vous avez initialisé mail

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
        # Créer l'utilisateur
        user = User(username=form.username.data, 
                   email=form.email.data, 
                   role='client')  # Le rôle est maintenant 'client'
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.flush()  # Pour obtenir l'ID de l'utilisateur
        
        db.session.commit()
        flash('Félicitations, vous êtes maintenant inscrit!')
        return redirect(url_for('main.login'))
        
    return render_template('public/register.html', title='Inscription', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    print("Tentative de connexion")  # Debug log
    if current_user.is_authenticated:
        print(f"Utilisateur déjà connecté: {current_user.username} ({current_user.role})")  # Debug log
        if current_user.role == 'coiffeur':
            return redirect(url_for('main.coiffeur_dashboard'))
        else:
            return redirect(url_for('main.client_dashboard'))

    form = LoginForm()
    if form.validate_on_submit():
        print(f"Tentative de connexion avec email: {form.email.data}")  # Debug log
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            print(f"Utilisateur trouvé: {user.username} ({user.role})")  # Debug log
        if user is None or not user.check_password(form.password.data):
            flash('Email ou mot de passe invalide')
            return redirect(url_for('main.login'))
        
        login_user(user)
        flash(f'Bienvenue {user.username}!')
        
        # Redirection basée sur le rôle
        if user.role == 'coiffeur':
            return redirect(url_for('main.coiffeur_dashboard'))
        else:
            return redirect(url_for('main.client_dashboard'))

    return render_template('public/login.html', title='Connexion', form=form)


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
        
        # Utiliser func.lower() pour une comparaison insensible à la casse
        slots = TimeSlot.query.filter(
            TimeSlot.coiffeur_id == coiffeur_id,
            func.lower(TimeSlot.weekday) == func.lower(day),
            TimeSlot.is_available == True
        ).all()
        
        print(f"Créneaux trouvés pour {day}: {len(slots)}")
        
        slots_data = [{
            'id': slot.id,
            'time': slot.start_time,
            'is_available': slot.is_available
        } for slot in slots]
        
        print(f"Données renvoyées pour {day}: {slots_data}")
        
        return jsonify(slots_data)
        
    except Exception as e:
        print(f"Erreur dans get_availability: {str(e)}")
        return jsonify({'error': str(e)}), 500

@main.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
    try:
        print("=== Début de la réservation ===")
        data = request.get_json()
        print("Données JSON parsées:", data)
        
        slot_id = data.get('slot_id')
        hairdresser_id = data.get('hairdresser_id')
        
        print(f"slot_id: {slot_id} (type: {type(slot_id)})")
        print(f"hairdresser_id: {hairdresser_id} (type: {type(hairdresser_id)})")

        # Récupérer le créneau
        time_slot = TimeSlot.query.get(slot_id)
        if not time_slot:
            return jsonify({
                'success': False, 
                'error': f'Créneau {slot_id} non trouvé'
            }), 404

        # Vérifier si le créneau est toujours disponible
        if not time_slot.is_available:
            return jsonify({
                'success': False, 
                'error': 'Ce créneau n\'est plus disponible'
            }), 400

        # Créer la réservation en utilisant l'ID du créneau directement
        booking = Booking(
            client_id=current_user.id,
            coiffeur_id=time_slot.coiffeur_id,  # Utiliser l'ID du coiffeur du créneau
            time_slot_id=slot_id,
            datetime=datetime.now(),
            status='confirmed'
        )

        # Marquer le créneau comme non disponible
        time_slot.is_available = False

        db.session.add(booking)
        db.session.commit()

        print("Réservation créée avec succès")
        return jsonify({'success': True})

    except Exception as e:
        db.session.rollback()
        print(f"Exception complète:", str(e))
        import traceback
        print("Traceback:", traceback.format_exc())
        return jsonify({
            'success': False, 
            'error': f"Erreur lors de la réservation: {str(e)}"
        }), 500

@main.route('/api/cancel_appointment/<int:appointment_id>', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    appointment = Booking.query.get_or_404(appointment_id)
    if appointment.client_id != current_user.id:
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
    
    appointment.status = 'cancelled'  # Assurez-vous que ce statut est bien mis à jour
    db.session.commit()
    
    return jsonify({'success': True})

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
    print(f"User role: {current_user.role}")  # Debug log
    
    if current_user.role != 'coiffeur':
        flash("Accès non autorisé. Cette page est réservée aux coiffeurs.")
        return redirect(url_for('main.index'))

    # Récupérer le coiffeur associé à l'utilisateur
    coiffeur = Coiffeur.query.filter_by(user_id=current_user.id).first()
    if not coiffeur:
        # Au lieu de rediriger, créer le profil manquant
        coiffeur = Coiffeur(
            user_id=current_user.id,
            specialties='À définir',
            years_of_experience=0
        )
        db.session.add(coiffeur)
        db.session.commit()

    # Calculer les dates pour chaque jour
    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())
    days_with_dates = [
        ('Lundi', monday),
        ('Mardi', monday + timedelta(days=1)),
        ('Mercredi', monday + timedelta(days=2)),
        ('Jeudi', monday + timedelta(days=3)),
        ('Vendredi', monday + timedelta(days=4)),
        ('Samedi', monday + timedelta(days=5))
    ]

    return render_template('coiffeur/dashboard.html',
                         days_with_dates=days_with_dates,
                         week_start_date=monday)

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