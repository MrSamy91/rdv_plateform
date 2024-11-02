"""Add service_id to Booking model

Revision ID: 54c185d1b339
Revises: ec09d8ee05b7
Create Date: 2024-11-01 16:12:41.550250

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '54c185d1b339'
down_revision = 'ec09d8ee05b7'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('booking', schema=None) as batch_op:
        batch_op.add_column(sa.Column('service_id', sa.Integer(), nullable=False))
        batch_op.create_foreign_key(None, 'service', ['service_id'], ['id'])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('booking', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('service_id')

    # ### end Alembic commands ###
