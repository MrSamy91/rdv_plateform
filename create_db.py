from app import app, db  # Import your Flask app and db instance
from models import User  # Import your User model if needed

# Create the database tables
with app.app_context():
    db.create_all()  # This will create all tables defined in your models
    print("Database and tables created successfully.")
