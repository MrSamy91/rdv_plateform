from app import app, db  # Assure-toi d'importer aussi l'instance de l'application

# Créer un contexte d'application
with app.app_context():
    db.create_all()  # Crée la base de données et les tables
    print("Base de données initialisée !")
