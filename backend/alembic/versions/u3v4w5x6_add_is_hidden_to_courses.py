"""Add is_hidden to courses for soft delete

Revision ID: u3v4w5x6
Revises: t2u3v4w5
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "u3v4w5x6"
down_revision: Union[str, None] = "t2u3v4w5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("courses", "is_hidden")
