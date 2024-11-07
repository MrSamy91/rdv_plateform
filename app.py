from flask import Flask
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth
from flask_login import LoginManager
from flask_mail import Mail
from db import db  # Import db from db.py
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect  # Ajoutez cet import
from models import User, TimeSlot, Booking  # Assurez-vous d'importer tous les modèles

# Initialize extensions without app
migrate = Migrate()
oauth = OAuth()
login_manager = LoginManager()
mail = Mail()
csrf = CSRFProtect()  # Ajoutez cette ligne

def create_app():
    app = Flask(__name__)

    # Configure the app
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'admin'  # Use a strong secret key
    
    # Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Serveur SMTP pour Gmail
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'rdvplateform@gmail.com'  # Remplacez par votre adresse e-mail
    app.config['MAIL_PASSWORD'] = 'omdt leke zdgu ghwm'  # Remplacez par votre mot de passe d'application
    app.config['MAIL_DEFAULT_SENDER'] = 'your_email@gmail.com'  # Adresse d'envoi par défaut

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    oauth.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    csrf.init_app(app)  # Ajoutez cette ligne

    @login_manager.user_loader
    def load_user(user_id):
        from models import User
        return User.query.get(int(user_id))

    from routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
