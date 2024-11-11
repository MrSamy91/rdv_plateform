from app import create_app, db
from models import User, Coiffeur, Service, TimeSlot, Booking, Review, Reward

def reset_database():
    app = create_app()
    with app.app_context():
        # Demander confirmation
        confirm = input("⚠️ ATTENTION: Ceci va effacer toutes les données. Êtes-vous sûr ? (oui/non): ")
        if confirm.lower() != 'oui':
            print("Opération annulée.")
            return

        try:
            # Supprimer toutes les tables
            print("Suppression des tables...")
            db.drop_all()
            
            # Recréer toutes les tables
            print("Recréation des tables...")
            db.create_all()
            
            print("✅ Base de données réinitialisée avec succès!")
            
        except Exception as e:
            print(f"❌ Erreur lors de la réinitialisation: {str(e)}")

if __name__ == "__main__":
    reset_database() 