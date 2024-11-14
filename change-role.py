from app import create_app
from db import db
from models import User, Coiffeur

def change_to_coiffeur(email):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user.role = 'coiffeur'
            
            # Vérifier si un profil coiffeur existe déjà
            existing_coiffeur = Coiffeur.query.filter_by(user_id=user.id).first()
            if not existing_coiffeur:
                coiffeur = Coiffeur(
                    user_id=user.id,
                    specialties="Coupe, Couleur",
                    years_of_experience=1,
                    bio="Votre bio"
                )
                db.session.add(coiffeur)
            
            db.session.commit()
            print(f"Utilisateur {user.username} est maintenant un coiffeur")
        else:
            print("Utilisateur non trouvé")

if __name__ == "__main__":
    email = input("Entrez l'email de l'utilisateur : ")
    change_to_coiffeur(email)