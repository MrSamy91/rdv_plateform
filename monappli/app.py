from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database_name.db'  # Remplace par le nom de ta base de données
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Importer les routes après avoir créé l'instance de l'application
from routes import *

if __name__ == '__main__':
    app.run(debug=True)
