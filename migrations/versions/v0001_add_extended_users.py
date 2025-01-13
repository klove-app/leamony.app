"""add extended users table

Revision ID: v0001_add_extended_users
Revises: None
Create Date: 2024-01-13

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'v0001_add_extended_users'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Создание таблицы extended_users
    op.create_table(
        'extended_users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=True),
        sa.Column('auth_type', sa.String(), nullable=False, server_default='telegram'),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('last_password_change', sa.DateTime(), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_locked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notification_preferences', sa.JSON(), nullable=True),
        sa.Column('privacy_settings', sa.JSON(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('language', sa.String(), nullable=False, server_default='ru'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )
    
    # Создание индексов
    op.create_index(op.f('ix_extended_users_email'), 'extended_users', ['email'], unique=True)
    op.create_index(op.f('ix_extended_users_user_id'), 'extended_users', ['user_id'], unique=False)

def downgrade():
    # Удаление индексов
    op.drop_index(op.f('ix_extended_users_user_id'), table_name='extended_users')
    op.drop_index(op.f('ix_extended_users_email'), table_name='extended_users')
    
    # Удаление таблицы
    op.drop_table('extended_users') 