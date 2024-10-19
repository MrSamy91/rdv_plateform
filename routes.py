from flask import Blueprint, render_template, redirect, url_for, flash, session, request
from forms import LoginForm, RegistrationForm
from app import app, db
from models import User, Rendezvous  # Importation du modèle Rendezvous
from flask_login import login_user, logout_user, login_required, current_user
from authlib.integrations.flask_client import OAuth
import os
from datetime import datetime  # Import pour gérer la date et l'heure

main = Blueprint('main', __name__)

# Initialisation d'Authlib OAuth
oauth = OAuth(app)

# Configuration OAuth (Google et Apple)
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid profile email'},
)

oauth.register(
    name='apple',
    client_id=os.getenv('APPLE_CLIENT_ID'),
    client_secret=os.getenv('APPLE_CLIENT_SECRET'),
    access_token_url='https://appleid.apple.com/auth/token',
    authorize_url='https://appleid.apple.com/auth/authorize',
    client_kwargs={'scope': 'name email'},
)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('agenda'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            flash('Login successful!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('agenda'))
        else:
            flash('Invalid email or password.', 'danger')
    return render_template('login.html', form=form)

@app.route('/agenda')
@login_required
def agenda():
    if current_user:  # Vérifie si un utilisateur est connecté
        # Récupérer les rendez-vous du prestataire connecté
        prochains_rdv = Rendezvous.query.filter_by(prestataire_id=current_user.id).filter(Rendezvous.date_heure_rdv >= datetime.now()).order_by(Rendezvous.date_heure_rdv.asc()).all()
        
        return render_template('agenda.html', prochains_rdv=prochains_rdv)
    else:
        flash("Vous devez être connecté pour voir vos rendez-vous.", "danger")
        return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        existing_user = User.query.filter_by(username=form.username.data).first()
        existing_email = User.query.filter_by(email=form.email.data).first()

        if existing_user:
            flash('Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.', 'danger')
        elif existing_email:
            flash('Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre.', 'danger')
        else:
            user = User(username=form.username.data, email=form.email.data)
            user.set_password(form.password.data)
            db.session.add(user)
            db.session.commit()
            flash('Utilisateur créé avec succès ! Redirection vers l\'agenda...', 'success')
            return redirect(url_for('agenda'))
    return render_template('register.html', form=form)

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            # Logique pour envoyer l'email de réinitialisation du mot de passe
            flash('Un email pour réinitialiser le mot de passe a été envoyé.', 'info')
        else:
            flash('Aucun utilisateur trouvé avec cet email.', 'danger')
    return render_template('reset_password.html')

@app.route('/logout')
def logout():
    logout_user()
    flash('Vous vous êtes déconnecté.', 'info')
    return redirect(url_for('home'))

# Route OAuth pour Google
@app.route('/login/google')
def login_google():
    redirect_uri = url_for('authorize_google', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/authorize/google')
def authorize_google():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.userinfo()
    user = User.query.filter_by(email=user_info['email']).first()
    
    if user:
        login_user(user)
    else:
        user = User(email=user_info['email'], username=user_info['name'])
        db.session.add(user)
        db.session.commit()
        login_user(user)

    return redirect(url_for('agenda'))

# Route OAuth pour Apple
@app.route('/login/apple')
def login_apple():
    redirect_uri = url_for('authorize_apple', _external=True)
    return oauth.apple.authorize_redirect(redirect_uri)

@app.route('/authorize/apple')
def authorize_apple():
    token = oauth.apple.authorize_access_token()
    user_info = oauth.apple.userinfo()
    user = User.query.filter_by(email=user_info['email']).first()
    
    if user:
        login_user(user)
    else:
        user = User(email=user_info['email'], username=user_info['name'])
        db.session.add(user)
        db.session.commit()
        login_user(user)

    return redirect(url_for('agenda'))
