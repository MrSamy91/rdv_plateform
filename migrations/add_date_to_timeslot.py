from flask_migrate import Migrate
from app import db

def upgrade():
    # Ajouter la colonne date
    db.engine.execute('ALTER TABLE time_slot ADD COLUMN date DATE')

def downgrade():
    # Supprimer la colonne date
    db.engine.execute('ALTER TABLE time_slot DROP COLUMN date') 