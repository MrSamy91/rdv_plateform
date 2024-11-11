from app import create_app, db
from models import TimeSlot, Coiffeur

def check_slots():
    app = create_app()
    with app.app_context():
        # Afficher tous les coiffeurs
        coiffeurs = Coiffeur.query.all()
        print("\nListe des coiffeurs:")
        for coiffeur in coiffeurs:
            print(f"Coiffeur ID: {coiffeur.id}, User ID: {coiffeur.user_id}")
        
        # Afficher tous les créneaux
        slots = TimeSlot.query.all()
        print("\nListe des créneaux:")
        for slot in slots:
            print(f"Slot ID: {slot.id}, Coiffeur ID: {slot.coiffeur_id}, Jour: {slot.weekday}, Heure: {slot.start_time}-{slot.end_time}")

if __name__ == "__main__":
    check_slots() 