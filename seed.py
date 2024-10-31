from app import create_app, db
from models import User, Coiffeur, Service, TimeSlot, Booking
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

app = create_app()

def seed_database():
    with app.app_context():
        # Nettoyer la base de données
        db.drop_all()
        db.create_all()

        # Créer quelques services
        services = [
            Service(name="Coupe Homme", duration=30, price=25),
            Service(name="Coupe Femme", duration=60, price=45),
            Service(name="Coloration", duration=120, price=80),
            Service(name="Brushing", duration=45, price=35),
        ]
        for service in services:
            db.session.add(service)

        # Créer quelques coiffeurs
        # D'abord créer les utilisateurs pour les coiffeurs
        coiffeur_users = [
            User(
                username="sophie_coiff",
                email="sophie@salon.com",
                role="coiffeur",
                password_hash=generate_password_hash("password123")
            ),
            User(
                username="marc_style",
                email="marc@salon.com",
                role="coiffeur",
                password_hash=generate_password_hash("password123")
            ),
        ]
        for user in coiffeur_users:
            db.session.add(user)
        db.session.commit()

        # Ensuite créer les profils coiffeurs
        coiffeurs = [
            Coiffeur(
                user_id=coiffeur_users[0].id,
                specialties="Coupe femme, Coloration",
                years_of_experience=10,
                bio="10 ans d'expérience"
            ),
            Coiffeur(
                user_id=coiffeur_users[1].id,
                specialties="Coupe homme, Barbe",
                years_of_experience=5,
                bio="5 ans d'expérience"
            ),
        ]
        for coiffeur in coiffeurs:
            db.session.add(coiffeur)

        # Créer quelques clients
        clients = [
            User(
                username="client1",
                email="client1@test.com",
                role="client",
                password_hash=generate_password_hash("password123")
            ),
            User(
                username="client2",
                email="client2@test.com",
                role="client",
                password_hash=generate_password_hash("password123")
            ),
        ]
        for client in clients:
            db.session.add(client)

        db.session.commit()

        # Créer des créneaux horaires pour les 7 prochains jours
        start_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        weekdays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
        
        for coiffeur in coiffeurs:
            for day in range(7):
                current_date = start_date + timedelta(days=day)
                weekday = weekdays[current_date.weekday()] if current_date.weekday() < 6 else None
                
                # Ne créer des créneaux que pour les jours ouvrables
                if weekday:
                    # Créer des créneaux de 9h à 17h
                    for hour in range(9, 17):
                        timeslot = TimeSlot(
                            coiffeur_id=coiffeur.id,
                            weekday=weekday,  # Ajout du jour de la semaine
                            start_time=current_date.replace(hour=hour),
                            end_time=current_date.replace(hour=hour + 1),
                            is_available=True
                        )
                        db.session.add(timeslot)

        # Créer quelques réservations
        # Prendre quelques créneaux au hasard et les marquer comme réservés
        available_slots = TimeSlot.query.filter_by(is_available=True).all()
        for _ in range(5):
            slot = random.choice(available_slots)
            booking = Booking(
                client_id=random.choice(clients).id,
                coiffeur_id=slot.coiffeur_id,
                time_slot_id=slot.id,
                datetime=slot.start_time,
                status="confirmed"
            )
            slot.is_available = False
            db.session.add(booking)

        db.session.commit()

if __name__ == "__main__":
    seed_database()
    print("Base de données remplie avec succès!")