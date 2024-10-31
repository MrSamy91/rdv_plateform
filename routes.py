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
        # Correction ici : utilisation du bon nom de route
        return redirect(url_for('main.client_dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            # Correction ici aussi
            return redirect(next_page) if next_page else redirect(url_for('main.client_dashboard'))
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
    # Rendez-vous à venir (après aujourd'hui)
    upcoming_appointments = Booking.query.filter_by(
        client_id=current_user.id
    ).filter(
        Booking.datetime > datetime.now()
    ).order_by(Booking.datetime).all()

    # Comptage des rendez-vous par coiffeur
    hairdresser_counts = {}
    for apt in upcoming_appointments:
        # Correction ici : accéder au username via la relation user
        hairdresser_name = apt.coiffeur.user.username
        hairdresser_counts[hairdresser_name] = hairdresser_counts.get(hairdresser_name, 0) + 1

    return render_template(
        'client/dashboard.html',
        upcoming_appointments=upcoming_appointments,
        hairdresser_counts=hairdresser_counts
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
    return render_template('client/questions.html', title='Questions')


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
    weekday = request.args.get('day')
    
    slots = TimeSlot.query.filter_by(
        coiffeur_id=coiffeur_id,
        weekday=weekday,
    ).all()
    
    available_slots = []
    for slot in slots:
        # Vérifier si le créneau est déjà réservé
        booking = Booking.query.filter_by(
            time_slot_id=slot.id,
            status='confirmed'
        ).first()
        
        available_slots.append({
            'id': slot.id,
            'time': slot.start_time.strftime('%H:%M'),
            'is_available': slot.is_available and not booking
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
    try:
        booking = Booking.query.get_or_404(appointment_id)
        
        # Vérifier que c'est bien le rendez-vous du client connecté
        if booking.client_id != current_user.id:
            return jsonify({'success': False, 'error': 'Non autorisé'}), 403
        
        # Mettre à jour le statut du rendez-vous
        booking.status = 'cancelled'
        
        # Rendre le créneau à nouveau disponible
        time_slot = TimeSlot.query.get(booking.time_slot_id)
        if time_slot:
            time_slot.is_available = True
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

