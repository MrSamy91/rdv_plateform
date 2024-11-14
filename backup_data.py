from app import create_app
from models import TimeSlot, db
import json
from datetime import datetime

def backup_data():
    app = create_app()
    with app.app_context():
        # Récupérer tous les créneaux
        slots = TimeSlot.query.all()
        backup = []
        
        for slot in slots:
            backup.append({
                'coiffeur_id': slot.coiffeur_id,
                'weekday': slot.weekday,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'is_available': slot.is_available,
                'date': datetime.now().date().isoformat() if not slot.date else slot.date.isoformat()
            })
            
        # Sauvegarder dans un fichier
        with open('timeslots_backup.json', 'w') as f:
            json.dump(backup, f)

def restore_data():
    app = create_app()
    with app.app_context():
        # Charger les données
        with open('timeslots_backup.json', 'r') as f:
            backup = json.load(f)
            
        for slot_data in backup:
            slot = TimeSlot(
                coiffeur_id=slot_data['coiffeur_id'],
                weekday=slot_data['weekday'],
                date=datetime.strptime(slot_data['date'], '%Y-%m-%d').date(),
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time'],
                is_available=slot_data['is_available']
            )
            db.session.add(slot)
        
        db.session.commit()

if __name__ == '__main__':
    backup_data() 
from models import TimeSlot, db
import json
from datetime import datetime

def backup_data():
    app = create_app()
    with app.app_context():
        # Récupérer tous les créneaux
        slots = TimeSlot.query.all()
        backup = []
        
        for slot in slots:
            backup.append({
                'coiffeur_id': slot.coiffeur_id,
                'weekday': slot.weekday,
                'start_time': slot.start_time,
                'end_time': slot.end_time,
                'is_available': slot.is_available,
                'date': datetime.now().date().isoformat() if not slot.date else slot.date.isoformat()
            })
            
        # Sauvegarder dans un fichier
        with open('timeslots_backup.json', 'w') as f:
            json.dump(backup, f)

def restore_data():
    app = create_app()
    with app.app_context():
        # Charger les données
        with open('timeslots_backup.json', 'r') as f:
            backup = json.load(f)
            
        for slot_data in backup:
            slot = TimeSlot(
                coiffeur_id=slot_data['coiffeur_id'],
                weekday=slot_data['weekday'],
                date=datetime.strptime(slot_data['date'], '%Y-%m-%d').date(),
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time'],
                is_available=slot_data['is_available']
            )
            db.session.add(slot)
        
        db.session.commit()

if __name__ == '__main__':
    backup_data() 