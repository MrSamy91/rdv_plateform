from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False, default='client')
    phone_number = db.Column(db.String(20))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

class Coiffeur(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    specialties = db.Column(db.String(200))
    years_of_experience = db.Column(db.Integer)
    bio = db.Column(db.Text)
    user = db.relationship('User', backref=db.backref('coiffeur', uselist=False))

class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)  # durée en minutes
    price = db.Column(db.Float, nullable=False)

class TimeSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id'), nullable=False)
    weekday = db.Column(db.String(10))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    
    # Relations
    coiffeur = db.relationship('Coiffeur', backref='time_slots')

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id'), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('time_slot.id'), nullable=False)
    status = db.Column(db.String(20), default='confirmed')  # confirmed, cancelled, completed
    datetime = db.Column(db.DateTime, nullable=False)  # Le vrai nom de votre colonne
    
    # Relations
    client = db.relationship('User', foreign_keys=[client_id], backref='bookings')
    coiffeur = db.relationship('Coiffeur', foreign_keys=[coiffeur_id], backref='bookings')
    time_slot = db.relationship('TimeSlot', backref='bookings')

    def __repr__(self):
        return f'<Booking {self.id}: {self.client.username} with {self.coiffeur.user.username}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('User', foreign_keys=[client_id])
    coiffeur = db.relationship('Coiffeur', foreign_keys=[coiffeur_id])
