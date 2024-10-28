from flask import Flask
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth
from flask_login import LoginManager
from flask_mail import Mail
from db import db  # Import db from db.py
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions without app
migrate = Migrate()
oauth = OAuth()
login_manager = LoginManager()
mail = Mail()

def create_app():
    app = Flask(__name__)

    # Configure the app
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your_secret_key'  # Use a strong secret key
    
    # Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.example.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'rdvplateform@gmail.com'
    app.config['MAIL_PASSWORD'] = 'rdvplateform00'

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    oauth.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)


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
