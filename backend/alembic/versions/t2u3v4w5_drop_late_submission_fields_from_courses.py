"""Drop allow_late_submissions and default_late_penalty from courses

Revision ID: t2u3v4w5
Revises: s1t2u3v4
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "t2u3v4w5"
down_revision: Union[str, None] = "s1t2u3v4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("courses", "allow_late_submissions")
    op.drop_column("courses", "default_late_penalty")


def downgrade() -> None:
    op.add_column("courses", sa.Column("default_late_penalty", sa.Float(), nullable=True, server_default="10.0"))
    op.add_column("courses", sa.Column("allow_late_submissions", sa.Boolean(), nullable=True, server_default="true"))
