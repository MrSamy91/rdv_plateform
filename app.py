from flask import Flask, render_template, request, redirect, url_for, flash
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.secret_key = 'ton_secret_key_ici'
bcrypt = Bcrypt(app)

# Simulated Database (for demonstration purposes)
users = {}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/connexion', methods=['GET', 'POST'])
def connexion():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = users.get(email)

        if user and bcrypt.check_password_hash(user['password'], password):
            flash('Connexion réussie!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Identifiants incorrects.', 'danger')
            return redirect(url_for('connexion'))
    return render_template('connexion.html')

@app.route('/inscription', methods=['GET', 'POST'])
def inscription():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        if email in users:
            flash('Un compte avec cet email existe déjà.', 'danger')
            return redirect(url_for('inscription'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        users[email] = {'username': username, 'password': hashed_password}
        flash('Inscription réussie! Vous pouvez maintenant vous connecter.', 'success')
        return redirect(url_for('connexion'))
    return render_template('inscription.html')

if __name__ == '__main__':
    app.run(debug=True)
