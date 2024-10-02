import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Define the base directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Configure the SQLite database URI using an absolute path
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'admin'  # Replace with a strong secret key


db = SQLAlchemy(app)

# Import routes after initializing the app and db
from routes import *

if __name__ == '__main__':
    app.run(debug=True)
