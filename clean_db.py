from app import create_app, db
from models import TimeSlot
from datetime import datetime

def clean_timeslots():
    app = create_app()
    
    with app.app_context():
        print("Début du nettoyage des créneaux horaires...")
        
        # Supprimer les créneaux avec même heure de début et fin
        invalid_slots = TimeSlot.query.filter(TimeSlot.start_time == TimeSlot.end_time).all()
        print(f"Trouvé {len(invalid_slots)} créneaux invalides (même heure début/fin)")
        for slot in invalid_slots:
            print(f"Suppression du créneau: {slot}")
            db.session.delete(slot)
        
        # Supprimer les créneaux qui se chevauchent
        all_slots = TimeSlot.query.order_by(TimeSlot.weekday, TimeSlot.start_time).all()
        slots_to_delete = set()
        
        for i in range(len(all_slots)):
            for j in range(i + 1, len(all_slots)):
                slot1 = all_slots[i]
                slot2 = all_slots[j]
                
                if slot1.coiffeur_id == slot2.coiffeur_id and slot1.weekday == slot2.weekday:
                    start1 = datetime.strptime(slot1.start_time, '%H:%M')
                    end1 = datetime.strptime(slot1.end_time, '%H:%M')
                    start2 = datetime.strptime(slot2.start_time, '%H:%M')
                    end2 = datetime.strptime(slot2.end_time, '%H:%M')
                    
                    if start1 < end2 and end1 > start2:
                        print(f"Chevauchement détecté entre {slot1} et {slot2}")
                        slots_to_delete.add(slot2)
        
        print(f"Trouvé {len(slots_to_delete)} créneaux qui se chevauchent")
        for slot in slots_to_delete:
            print(f"Suppression du créneau: {slot}")
            db.session.delete(slot)
        
        db.session.commit()
        print("Nettoyage terminé!")

if __name__ == '__main__':
    clean_timeslots()