"""Add is_weighted to assignments

Revision ID: v4w5x6y7
Revises: u3v4w5x6
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "v4w5x6y7"
down_revision: Union[str, None] = "u3v4w5x6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "assignments",
        sa.Column("is_weighted", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_column("assignments", "is_weighted")
