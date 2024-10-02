from flask import Blueprint, render_template, redirect, url_for, flash
from forms import LoginForm, RegistrationForm  # Ensure you have these forms defined
from app import app, db  # Import db for database operations
from models import User  # Import your User model
from flask_login import login_user, current_user

main = Blueprint('main', __name__)

@app.route('/')
def home():
    return render_template('home.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            # User authentication successful
            flash('Login successful!', 'success')
            return redirect(url_for('agenda'))
        else:
            flash('Invalid email or password.', 'danger')
    return render_template('login.html', form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)  # Use set_password to hash the password
        db.session.add(user)
        db.session.commit()
        flash('User created successfully! Redirecting to agenda...', 'success')
        return redirect(url_for('agenda'))  # Redirect to your agenda page
    else:
        flash('Registration failed. Please check your inputs.', 'error')
    return render_template('register.html', form=form)

@app.route('/agenda')
def agenda():
    return render_template('agenda.html')  # Ensure this template exists
