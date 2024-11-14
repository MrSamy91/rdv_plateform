from app import create_app, db
from sqlalchemy import text
import os

def reset_database():
    app = create_app()
    
    with app.app_context():
        # Supprimer toutes les tables existantes
        db.drop_all()
        
        # Supprimer la table alembic_version si elle existe
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