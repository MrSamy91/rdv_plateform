from flask import Blueprint, render_template, redirect, url_for, flash
from .forms import LoginForm
from app import app  # Si app est utilisé, assurez-vous qu'il est bien importé

main = Blueprint('main', __name__)

@app.route('/')
def home():
    return render_template('home.html')  # Assurez-vous que ce fichier existe dans le dossier templates

@main.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # logique de connexion ici
        return redirect(url_for('main.index'))  # Assurez-vous que 'main.index' est défini
    return render_template('login.html', form=form)  # Correction de la variable ici

@app.route('/register')
def register():
    return render_template('register.html')  # Vérifiez que ce fichier existe
