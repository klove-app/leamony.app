"""add auth code fields

Revision ID: add_auth_code_fields
Revises: v0001_add_extended_users
Create Date: 2025-01-13 19:25:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_auth_code_fields'
down_revision = 'v0001_add_extended_users'
branch_labels = None
depends_on = None

def upgrade():
    # SQLite не поддерживает ALTER COLUMN, поэтому используем batch_alter_table
    with op.batch_alter_table('extended_users') as batch_op:
        batch_op.add_column(sa.Column('auth_code', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('auth_code_expires', sa.DateTime(), nullable=True))

def downgrade():
    with op.batch_alter_table('extended_users') as batch_op:
        batch_op.drop_column('auth_code_expires')
        batch_op.drop_column('auth_code') 