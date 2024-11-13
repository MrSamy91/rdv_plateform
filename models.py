from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False, default='client')
    phone_number = db.Column(db.String(20))
    loyalty_points = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, nullable=True, default=False)
    verification_token = db.Column(db.String(100), nullable=True)
    token_expiration = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_bookings = db.Column(db.Integer, default=0)

    __table_args__ = (
        db.UniqueConstraint('verification_token', name='uq_user_verification_token'),
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def past_bookings_count(self):
        return Booking.query.filter_by(
            client_id=self.id,
            status='completed'
        ).count()

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
    __tablename__ = 'time_slot'
    
    id = db.Column(db.Integer, primary_key=True)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id'), nullable=False)
    weekday = db.Column(db.String(20), nullable=False)
    date = db.Column(db.Date, nullable=True)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    
    # Relation avec Coiffeur
    coiffeur = db.relationship('Coiffeur', backref='time_slots', lazy=True)
    
    # Ne définissez pas la relation bookings ici
    
    def __repr__(self):
        return f'<TimeSlot id={self.id} coiffeur_id={self.coiffeur_id} {self.weekday} {self.start_time}-{self.end_time}>'

class Booking(db.Model):
    __tablename__ = 'booking'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id', name='fk_booking_client'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id', name='fk_booking_coiffeur'), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('time_slot.id', name='fk_booking_timeslot'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id', name='fk_booking_service'), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled
    datetime = db.Column(db.DateTime, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relations
    client = db.relationship('User', foreign_keys=[client_id], backref='client_bookings')
    coiffeur = db.relationship('Coiffeur', foreign_keys=[coiffeur_id], backref='coiffeur_bookings')
    time_slot = db.relationship('TimeSlot', backref='bookings')
    service = db.relationship('Service', backref='bookings')

    def __repr__(self):
        return f'<Booking {self.id}: {self.client.username} with {self.coiffeur.user.username}>'

    def complete_booking(self):
        """Marque le RDV comme terminé et attribue les points"""
        if self.status != 'completed':
            self.status = 'completed'
            # Attribuer 10 points par RDV
            self.client.loyalty_points += 10
            db.session.commit()
            
            # Vérifier si le client peut avoir une récompense
            self.check_rewards()
    
    def check_rewards(self):
        """Vérifie si le client peut avoir une récompense"""
        if self.client.loyalty_points >= 100:
            # Créer une nouvelle récompense
            reward = Reward(
                client_id=self.client_id,
                type='free_haircut',
                status='available',
                expiration_date=datetime.now() + timedelta(days=90)  # Valable 3 mois
            )
            # Déduire les points
            self.client.loyalty_points -= 100
            db.session.add(reward)
            db.session.commit()

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    coiffeur_id = db.Column(db.Integer, db.ForeignKey('coiffeur.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    client = db.relationship('User', foreign_keys=[client_id])
    coiffeur = db.relationship('Coiffeur', foreign_keys=[coiffeur_id])

class Reward(db.Model):
    """Modèle pour gérer les récompenses"""
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # ex: 'free_haircut'
    status = db.Column(db.String(20), default='available')  # available, used, expired
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expiration_date = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime)
    
    client = db.relationship('User', backref='rewards')
