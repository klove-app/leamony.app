"""add_running_log_table

Revision ID: 9cdef2fa7c6d
Revises: c61d1cef3ffc
Create Date: 2024-01-13 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9cdef2fa7c6d'
down_revision = 'c61d1cef3ffc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('running_log',
        sa.Column('log_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('km', sa.Float(), nullable=False),
        sa.Column('date_added', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('chat_id', sa.String(), nullable=True),
        sa.Column('chat_type', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('log_id')
    )


def downgrade() -> None:
    op.drop_table('running_log')
