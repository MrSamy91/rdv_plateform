"""empty message

Revision ID: 873dfc8de13e
Revises: 5a756598c34d
Create Date: 2024-10-19 19:38:08.314940

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '873dfc8de13e'
down_revision = '5a756598c34d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('rendezvous',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.Integer(), nullable=False),
    sa.Column('prestataire_id', sa.Integer(), nullable=False),
    sa.Column('date_heure_rdv', sa.DateTime(), nullable=False),
    sa.Column('statut', sa.String(length=50), nullable=True),
    sa.ForeignKeyConstraint(['client_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['prestataire_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('rendezvous')
    # ### end Alembic commands ###
