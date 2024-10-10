from flask import Blueprint, render_template, redirect, url_for, flash, session, request  # Ajout de request pour next parameter
from forms import LoginForm, RegistrationForm
from app import app, db
from models import User
from flask_login import login_user, logout_user, login_required, current_user  # Ajout de login_required, current_user
from authlib.integrations.flask_client import OAuth
import os

main = Blueprint('main', __name__)

# Initialisation d'Authlib OAuth
oauth = OAuth(app)

# Configuration de Google OAuth
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid profile email'},
)

# Configuration d'Apple OAuth
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
        return redirect(url_for('agenda'))  # Si l'utilisateur est déjà connecté, rediriger vers l'agenda

    form = LoginForm()
    if form.validate_on_submit():
        print("Form submitted successfully")  # Ajout d'un log
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            print(f"User found: {user.username}")  # Ajout d'un log
        if user and user.check_password(form.password.data):
            print("Password check passed")  # Ajout d'un log
            login_user(user)
            flash('Login successful!', 'success')

            # Redirection vers la page originale si "next" est dans l'URL
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('agenda'))
        else:
            print("Password check failed or user not found")  # Ajout d'un log
            flash('Invalid email or password.', 'danger')
    else:
        print("Form validation failed")  # Ajout d'un log
    return render_template('login.html', form=form)


@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    return render_template('reset_password.html')


@app.route('/login/google')
def login_google():
    redirect_uri = url_for('authorize_google', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/authorize/google')
def authorize_google():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.parse_id_token(token)
    email = user_info['email']

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        db.session.add(user)
        db.session.commit()

    login_user(user)
    flash('Google login successful!', 'success')
    return redirect(url_for('agenda'))


@app.route('/login/apple')
def login_apple():
    redirect_uri = url_for('authorize_apple', _external=True)
    return oauth.apple.authorize_redirect(redirect_uri)

@app.route('/authorize/apple')
def authorize_apple():
    token = oauth.apple.authorize_access_token()
    user_info = oauth.apple.parse_id_token(token)
    email = user_info.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        db.session.add(user)
        db.session.commit()

    login_user(user)
    flash('Apple login successful!', 'success')
    return redirect(url_for('agenda'))


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

@app.route('/agenda')
@login_required  # Protéger cette page pour que seuls les utilisateurs connectés puissent y accéder
def agenda():
    return render_template('agenda.html')

@app.route('/logout')
def logout():
    logout_user()
    flash('Vous vous êtes déconnecté.', 'info')
    return redirect(url_for('home'))
