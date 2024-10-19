from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime  # Importez datetime si vous utilisez des valeurs par défaut
from app import db

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    def set_password(self, password):
        """Hash le mot de passe et le stocke."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Vérifie si le mot de passe correspond au hash."""
        return check_password_hash(self.password_hash, password)

class Rendezvous(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Référence au client
    prestataire_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Référence au prestataire
    date_heure_rdv = db.Column(db.DateTime, nullable=False)  # Date et heure du rendez-vous
    statut = db.Column(db.String(50), default='Confirmé')  # Statut du rendez-vous (confirmé, annulé, etc.)

    # Relations pour accéder facilement aux objets User associés
    client = db.relationship('User', foreign_keys=[client_id], backref='rendezvous_clients')
    prestataire = db.relationship('User', foreign_keys=[prestataire_id], backref='rendezvous_prestataires')

    def __repr__(self):
        return f'<Rendezvous {self.id} - Client: {self.client_id}, Prestataire: {self.prestataire_id}, Date: {self.date_heure_rdv}, Statut: {self.statut}>'
