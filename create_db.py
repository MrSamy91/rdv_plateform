from app import create_app
from db import db
from models import User  # Import your User model if needed

app = create_app()

# Create the database tables
with app.app_context():
    db.create_all()  # This will create all tables defined in your models
    print("Database and tables created successfully.")
