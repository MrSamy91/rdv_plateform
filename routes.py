from flask import render_template, flash, redirect, url_for, request, jsonify, abort
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
from models import User, Coiffeur, Service, Rendezvous, Review, Availability
from forms import LoginForm, RegistrationForm, RendezvousForm, ReviewForm
from datetime import datetime, timedelta
from utils import send_email_notification, add_to_google_calendar
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
from db import db  # Import db directly from db.py
from flask import Blueprint

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('home.html', title='Accueil')

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
    return render_template('register.html', title='Inscription', form=form)

@main.route('/coiffeurs')
def coiffeurs():
    coiffeurs = Coiffeur.query.all()
    return render_template('coiffeurs.html', title='Nos Coiffeurs', coiffeurs=coiffeurs)

@main.route('/services')
def services():
    services = Service.query.all()
    return render_template('services.html', title='Nos Services', services=services)

@main.route('/prendre_rendez_vous', methods=['GET', 'POST'])
@login_required
def prendre_rendez_vous():
    form = RendezvousForm()
    if form.validate_on_submit():
        rendezvous = Rendezvous(
            client_id=current_user.id,
            coiffeur_id=form.coiffeur.data,
            service_id=form.service.data,
            date_heure=form.date_heure.data
        )
        db.session.add(rendezvous)
        db.session.commit()
        
        send_email_notification(current_user.email, 'Confirmation de rendez-vous', 
                                f'Votre rendez-vous est confirmé pour le {rendezvous.date_heure}')
        
        if current_user.google_token:
            add_to_google_calendar(rendezvous, current_user.google_token)
        
        flash('Votre rendez-vous a été pris avec succès!')
        return redirect(url_for('main.mes_rendez_vous'))
    return render_template('prendre_rendez_vous.html', title='Prendre un rendez-vous', form=form)

@main.route('/mes_rendez_vous')
@login_required
def mes_rendez_vous():
    rendez_vous = Rendezvous.query.filter_by(client_id=current_user.id).all()
    return render_template('mes_rendez_vous.html', title='Mes Rendez-vous', rendez_vous=rendez_vous)

@main.route('/annuler_rendez_vous/<int:id>')
@login_required
def annuler_rendez_vous(id):
    rendez_vous = Rendezvous.query.get_or_404(id)
    if rendez_vous.client_id != current_user.id:
        flash('Vous n\'êtes pas autorisé à annuler ce rendez-vous.')
        return redirect(url_for('main.mes_rendez_vous'))
    if rendez_vous.can_reschedule():
        rendez_vous.status = 'annulé'
        db.session.commit()
        flash('Votre rendez-vous a été annulé avec succès.')
    else:
        flash('Désolé, vous ne pouvez plus annuler ce rendez-vous.')
    return redirect(url_for('main.mes_rendez_vous'))

@main.route('/laisser_avis/<int:coiffeur_id>', methods=['GET', 'POST'])
@login_required
def laisser_avis(coiffeur_id):
    form = ReviewForm()
    if form.validate_on_submit():
        review = Review(
            client_id=current_user.id,
            coiffeur_id=coiffeur_id,
            rating=form.rating.data,
            comment=form.comment.data
        )
        db.session.add(review)
        db.session.commit()
        flash('Merci pour votre avis!')
        return redirect(url_for('main.coiffeurs'))
    return render_template('laisser_avis.html', title='Laisser un avis', form=form)

@main.route('/agenda')
@login_required
def agenda():
    return render_template('agenda.html', title='Agenda')

@main.route('/dashboard')
@login_required
def dashboard():
    rendez_vous = Rendezvous.query.filter_by(client_id=current_user.id).all()
    return render_template('dashboard.html', rendez_vous=rendez_vous)

@main.route('/login', methods=['GET', 'POST'])
def login():
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
    return render_template('login.html', title='Connexion', form=form)

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
    return render_template('reset_password.html')

@main.route('/search', methods=['GET'])
def search():
    return render_template('search.html')

@main.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        abort(403)  # Forbidden
    users = User.query.all()
    return render_template('admin.html', users=users)

@main.route('/add_availability', methods=['GET', 'POST'])
@login_required
def add_availability():
    if request.method == 'POST':
        start_time_str = request.form['start_time']
        end_time_str = request.form['end_time']
        coiffeur_id = request.form.get('coiffeur_id')  # Peut être None si non sélectionné
        
        start_time = datetime.strptime(start_time_str, '%Y-%m-%dT%H:%M')
        end_time = datetime.strptime(end_time_str, '%Y-%m-%dT%H:%M')
        
        new_availability = Availability(
            start_time=start_time,
            end_time=end_time,
            coiffeur_id=coiffeur_id if coiffeur_id else None
        )
        db.session.add(new_availability)
        db.session.commit()
        
        flash('Nouvelle disponibilité ajoutée avec succès!', 'success')
        return redirect(url_for('main.add_availability'))
    
    coiffeurs = User.query.filter_by(role='coiffeur').all()  # Assurez-vous d'importer User
    return render_template('rajouter.html', coiffeurs=coiffeurs)

@main.route('/create_admin', methods=['GET', 'POST'])
def create_admin():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        user = User(username=username, email=email, role='admin')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Admin user created successfully!')
        return redirect(url_for('main.login'))
    
    return render_template('create_admin.html')

@main.route('/navtest')
def navtest():
    return render_template('nav_test.html')

@main.route('/rajouter', methods=['GET', 'POST'])
def rajouter():
    if request.method == 'POST':
        start_time = request.form['start_time']
        end_time = request.form['end_time']
        
        # Créez une nouvelle disponibilité
        new_availability = Availability(start_time=start_time, end_time=end_time)
        
        # Ajoutez-la à la base de données
        db.session.add(new_availability)
        db.session.commit()
        
        flash('Nouvelle disponibilité ajoutée avec succès!', 'success')
        return redirect(url_for('rajouter'))
    
    return render_template('rajouter.html')
