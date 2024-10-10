import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from authlib.integrations.flask_client import OAuth
from flask_login import LoginManager

app = Flask(__name__)

# Define the base directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Configure the SQLite database URI using an absolute path
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'admin'  # Remplacez par une clé secrète forte

# Initialize the database and migration modules
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Initialize OAuth
oauth = OAuth(app)

# Initialize Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Delay the import of User until after the app and db are set up
@login_manager.user_loader
def load_user(user_id):
    from models import User  # Importer User ici pour éviter l'importation circulaire
    return User.query.get(int(user_id))

# Import routes after initializing the app and db
from routes import *

if __name__ == '__main__':
    app.run(debug=True)
