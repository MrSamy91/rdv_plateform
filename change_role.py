from app import db, create_app
from models import User, Coiffeur
import sys

def change_role(username, new_role):
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"Utilisateur '{username}' non trouvé.")
        return

    old_role = user.role
    user.role = new_role

    # Si le nouveau rôle est coiffeur, créer une entrée dans la table Coiffeur
    if new_role == 'coiffeur':
        # Vérifier si une entrée existe déjà
        existing_coiffeur = Coiffeur.query.filter_by(user_id=user.id).first()
        if not existing_coiffeur:
            coiffeur = Coiffeur(
                user_id=user.id,
                specialties="Non spécifié",
                years_of_experience=0,
                bio="Nouvelle inscription"
            )
            db.session.add(coiffeur)
    
    # Si l'ancien rôle était coiffeur et le nouveau ne l'est pas
    elif old_role == 'coiffeur' and new_role != 'coiffeur':
        Coiffeur.query.filter_by(user_id=user.id).delete()

    try:
        db.session.commit()
        print(f"Le rôle de l'utilisateur {user.username} a été changé de '{old_role}' à '{new_role}'.")
        if new_role == 'coiffeur':
            print("Une entrée coiffeur a été créée avec des valeurs par défaut.")
            print("N'oubliez pas de mettre à jour les informations du profil !")
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors du changement de rôle: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python change_role.py <username> <new_role>")
        print("Rôles disponibles: 'client', 'coiffeur', 'admin'")
        sys.exit(1)

    username = sys.argv[1]
    new_role = sys.argv[2]

    valid_roles = ['client', 'coiffeur', 'admin']
    if new_role not in valid_roles:
        print(f"Erreur: Le rôle doit être l'un des suivants: {', '.join(valid_roles)}")
        sys.exit(1)

    app = create_app()
    with app.app_context():
        change_role(username, new_role)