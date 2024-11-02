from flask import render_template, flash, redirect, url_for, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
from models import User, Coiffeur, Service, Booking, Review, TimeSlot
from forms import LoginForm, RegistrationForm, RendezvousForm, ReviewForm
from datetime import datetime, timedelta
from utils import send_email_notification, add_to_google_calendar
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
from db import db  # Import db directly from db.py
from flask import Blueprint
from collections import Counter
from sqlalchemy import func

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
        user = User(username=form.username.data, email=form.email.data, role='client')
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit() 
        flash('Félicitations, vous êtes maintenant inscrit!')
        return redirect(url_for('main.login'))
    return render_template('public/register.html', title='Inscription', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        if current_user.role == 'coiffeur':
            return redirect(url_for('main.coiffeur_dashboard'))
        return redirect(url_for('main.client_dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            # Redirection selon le rôle
            if user.role == 'coiffeur':
                return redirect(url_for('main.coiffeur_dashboard'))
            return redirect(url_for('main.client_dashboard'))
        else:
            flash('Email ou mot de passe invalide')
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

@main.route('/api/get_availability')
def get_availability():
    coiffeur_id = request.args.get('hairdresser_id')
    service_id = request.args.get('service_id')
    weekday = request.args.get('day')
    
    # Si service_id n'est pas fourni, utiliser une durée par défaut
    if service_id:
        service = Service.query.get_or_404(service_id)
        service_duration = service.duration
    else:
        service_duration = 30  # durée par défaut en minutes
    
    slots = TimeSlot.query.filter_by(
        coiffeur_id=coiffeur_id,
        weekday=weekday,
    ).order_by(TimeSlot.start_time).all()
    
    available_slots = []
    for i, slot in enumerate(slots):
        needed_slots = service_duration // 30
        
        consecutive_slots_available = True
        for j in range(needed_slots):
            if i + j >= len(slots):
                consecutive_slots_available = False
                break
                
            booking = Booking.query.filter_by(
                time_slot_id=slots[i + j].id,
                status='confirmed'
            ).first()
            
            if booking or not slots[i + j].is_available:
                consecutive_slots_available = False
                break
        
        if consecutive_slots_available:
            available_slots.append({
                'id': slot.id,
                'time': slot.start_time.strftime('%H:%M'),
                'is_available': True,
                'duration': service_duration
            })
    
    return jsonify(available_slots)

@main.route('/api/book', methods=['POST'])
@login_required
def book_appointment():
    data = request.get_json()
    
    try:
        # Récupérer le créneau
        slot = TimeSlot.query.get_or_404(data['slot_id'])
        
        if not slot.is_available:
            return jsonify({'success': False, 'error': 'Ce créneau n\'est plus disponible'})
        
        # Créer la réservation
        booking = Booking(
            client_id=current_user.id,
            coiffeur_id=data['hairdresser_id'],
            time_slot_id=slot.id,
            datetime=slot.start_time,
            status="confirmed"
        )
        
        # Marquer le créneau comme non disponible
        slot.is_available = False
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

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
    if current_user.role != 'coiffeur':
        abort(403)
        
    # Récupérer les rendez-vous du jour avec les relations
    today = datetime.now().date()
    today_appointments = Booking.query.filter(
        Booking.coiffeur_id == current_user.id,
        func.date(Booking.datetime) == today
    ).join(User, Booking.client_id == User.id)\
     .join(Service, Booking.service_id == Service.id)\
     .all()
    
    # Récupérer les rendez-vous de la semaine
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    weekly_appointments = Booking.query.filter(
        Booking.coiffeur_id == current_user.id,
        func.date(Booking.datetime).between(week_start, week_end)
    ).join(User, Booking.client_id == User.id)\
     .join(Service, Booking.service_id == Service.id)\
     .all()
    
    # Calculer le taux d'occupation
    total_slots = TimeSlot.query.filter_by(coiffeur_id=current_user.id).count()
    booked_slots = Booking.query.filter_by(coiffeur_id=current_user.id).count()
    occupation_rate = round((booked_slots / total_slots * 100) if total_slots > 0 else 0, 1)
    
    return render_template('coiffeur/dashboard.html',
                         today_appointments=today_appointments,
                         weekly_appointments=weekly_appointments,
                         occupation_rate=occupation_rate)

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

