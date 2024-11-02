"""Add loyalty_points to User model

Revision ID: ec09d8ee05b7
Revises: c00e836b1109
Create Date: 2024-11-01 12:19:38.619223

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ec09d8ee05b7'
down_revision = 'c00e836b1109'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('loyalty_points', sa.Integer(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('loyalty_points')

    # ### end Alembic commands ###
