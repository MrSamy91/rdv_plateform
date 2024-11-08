from app import db, create_app  # Import db and create_app
from models import User

def make_admin(username):
    user = User.query.filter_by(username=username).first()
    if user:
        user.role = 'coiffeur'
        db.session.commit()
        print(f"User {user.username} is now an coiffeur.")
    else:
        print("User not found.")

# Create the app instance
app = create_app()

# Push the application context
with app.app_context():
    # Call the function with the username 'admin'
    make_admin(username='samy')