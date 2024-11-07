from app import create_app
from models import User, Coiffeur
from db import db

app = create_app()
with app.app_context():
    # Vérifier l'utilisateur reda
    user = User.query.filter_by(username='reda').first()
    print(f"User reda: {user.username}, role: {user.role}")
    
    # Vérifier si un profil coiffeur existe pour reda
    coiffeur = Coiffeur.query.filter_by(user_id=user.id).first()
    print(f"Profil coiffeur pour reda: {coiffeur}")
    
    if not coiffeur:
        # Créer le profil coiffeur manquant
        coiffeur = Coiffeur(
            user_id=user.id,
            specialties='Coupe, Couleur',
            years_of_experience=5
        )
        db.session.add(coiffeur)
        db.session.commit()
        print("Profil coiffeur créé pour reda")