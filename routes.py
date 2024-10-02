from flask import Blueprint, render_template, redirect, url_for, flash
from forms import LoginForm, RegistrationForm  # Ensure you have these forms defined
from app import app, db  # Import db for database operations
from models import User  # Import your User model

main = Blueprint('main', __name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # Logic for user login
        return redirect(url_for('home'))
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        # Assuming you have a User model and a way to create a new user
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)  # Assuming you have a method to set the password
        db.session.add(user)
        db.session.commit()
        
        flash('User created successfully! Redirecting to agenda...', 'success')
        return redirect(url_for('agenda'))  # Ensure 'agenda' is defined elsewhere
    else:
        flash('Registration failed. Please check your inputs.', 'danger')  # Use 'danger' instead of 'error' for consistency

    return render_template('register.html', form=form)
