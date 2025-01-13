"""initial schema

Revision ID: initial_schema
Revises: 
Create Date: 2025-01-13 19:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Создаем таблицу users
    op.create_table(
        'users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('chat_type', sa.String(), nullable=True),
        sa.Column('yearly_goal', sa.Float(), nullable=True),
        sa.Column('yearly_progress', sa.Float(), nullable=True),
        sa.Column('goal_km', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index('ix_users_user_id', 'users', ['user_id'])

    # Создаем таблицу extended_users
    op.create_table(
        'extended_users',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('password_hash', sa.String(), nullable=True),
        sa.Column('auth_type', sa.String(), nullable=True),
        sa.Column('auth_code', sa.String(), nullable=True),
        sa.Column('auth_code_expires', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('last_password_change', sa.DateTime(), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=True),
        sa.Column('is_locked', sa.Boolean(), nullable=True),
        sa.Column('notification_preferences', sa.JSON(), nullable=True),
        sa.Column('privacy_settings', sa.JSON(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index('ix_extended_users_email', 'extended_users', ['email'], unique=True)
    op.create_index('ix_extended_users_user_id', 'extended_users', ['user_id'])

    # Создаем таблицу running_log
    op.create_table(
        'running_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('km', sa.Float(), nullable=False),
        sa.Column('date_added', sa.DateTime(), nullable=False),
        sa.Column('chat_type', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('running_log')
    op.drop_index('ix_extended_users_email', 'extended_users')
    op.drop_index('ix_extended_users_user_id', 'extended_users')
    op.drop_table('extended_users')
    op.drop_index('ix_users_user_id', 'users')
    op.drop_table('users') 