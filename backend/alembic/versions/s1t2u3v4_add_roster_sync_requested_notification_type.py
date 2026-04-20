"""Add ROSTER_SYNC_REQUESTED to notificationtype enum

Revision ID: s1t2u3v4
Revises: aa1bb2cc3dd4
Create Date: 2026-04-20

"""
from typing import Sequence, Union

from alembic import op


revision: str = "s1t2u3v4"
down_revision: Union[str, None] = "aa1bb2cc3dd4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'ROSTER_SYNC_REQUESTED'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op
    pass
