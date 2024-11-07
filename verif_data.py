from app import create_app, db
from models import TimeSlot

app = create_app()
with app.app_context():
    # Vérifier tous les créneaux
    all_slots = TimeSlot.query.all()
    print("\nTous les créneaux en base de données:")
    for slot in all_slots:
        print(f"ID: {slot.id}, Coiffeur: {slot.coiffeur_id}, Jour: '{slot.weekday}', "
              f"Heure: {slot.start_time}, Disponible: {slot.is_available}")