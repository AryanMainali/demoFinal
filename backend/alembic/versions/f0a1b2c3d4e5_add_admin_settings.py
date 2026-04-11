"""Add admin settings table

Revision ID: f0a1b2c3d4e5
Revises: e5f6a7b8c9d0
Create Date: 2026-04-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('password_min_length', sa.Integer(), nullable=True),
        sa.Column('password_require_uppercase', sa.Boolean(), nullable=True),
        sa.Column('password_require_lowercase', sa.Boolean(), nullable=True),
        sa.Column('password_require_number', sa.Boolean(), nullable=True),
        sa.Column('password_require_special', sa.Boolean(), nullable=True),
        sa.Column('session_timeout', sa.Integer(), nullable=True),
        sa.Column('max_login_attempts', sa.Integer(), nullable=True),
        sa.Column('lockout_duration', sa.Integer(), nullable=True),
        sa.Column('smtp_host', sa.String(length=255), nullable=True),
        sa.Column('smtp_port', sa.Integer(), nullable=True),
        sa.Column('smtp_user', sa.String(length=255), nullable=True),
        sa.Column('smtp_password', sa.String(length=255), nullable=True),
        sa.Column('email_from', sa.String(length=255), nullable=True),
        sa.Column('email_from_name', sa.String(length=255), nullable=True),
        sa.Column('email_on_submission', sa.Boolean(), nullable=True),
        sa.Column('email_on_grading', sa.Boolean(), nullable=True),
        sa.Column('email_on_new_assignment', sa.Boolean(), nullable=True),
        sa.Column('email_on_due_reminder', sa.Boolean(), nullable=True),
        sa.Column('reminder_days', sa.Integer(), nullable=True),
        sa.Column('default_timeout', sa.Integer(), nullable=True),
        sa.Column('default_memory_limit', sa.Integer(), nullable=True),
        sa.Column('max_concurrent_jobs', sa.Integer(), nullable=True),
        sa.Column('sandbox_enabled', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('admin_settings')