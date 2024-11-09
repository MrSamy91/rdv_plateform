"""add rewards system

Revision ID: 588f6e1a56f2
Revises: af2e7d917c10
Create Date: 2024-11-09 00:18:37.718663

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '588f6e1a56f2'
down_revision = 'af2e7d917c10'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('reward',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.Integer(), nullable=False),
    sa.Column('type', sa.String(length=50), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('expiration_date', sa.DateTime(), nullable=False),
    sa.Column('used_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['client_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('reward')
    # ### end Alembic commands ###
