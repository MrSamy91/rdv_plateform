from flask import Flask, request, jsonify, render_template
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth
from flask_login import LoginManager
from flask_mail import Mail
from db import db  # Import db from db.py
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect  # Ajoutez cet import
from models import User, TimeSlot, Booking  # Assurez-vous d'importer tous les modèles
import logging
from commands import add_hairdresser_email

# Initialize extensions without app
migrate = Migrate()
oauth = OAuth()
login_manager = LoginManager()
mail = Mail()
csrf = CSRFProtect()  # Ajoutez cette ligne

def create_app():
    app = Flask(__name__)

    # Configuration du logger
    if app.debug:
        logging.basicConfig(level=logging.DEBUG)
        app.logger.setLevel(logging.DEBUG)
        
    # Ajouter un handler pour les logs
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    app.logger.addHandler(handler)

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

    # Configuration
    app.config['DEBUG'] = True
    app.config['JSON_AS_ASCII'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    
    # Gestionnaire d'erreur personnalisé pour les erreurs 500
    @app.errorhandler(500)
    def handle_500_error(e):
        if request.is_json:
            return jsonify({
                'success': False,
                'error': 'Erreur serveur interne'
            }), 500
        return render_template('errors/500.html'), 500

    @login_manager.user_loader
    def load_user(user_id):
        from models import User
        return User.query.get(int(user_id))

    from routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    @app.template_filter('datetime_format')
    def datetime_format(value, format='%Y-%m-%d'):
        return value.strftime(format)

    # Configuration de Flask-Login
    login_manager.login_view = 'main.login'
    login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
    login_manager.login_message_category = 'info'

    app.cli.add_command(add_hairdresser_email)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
