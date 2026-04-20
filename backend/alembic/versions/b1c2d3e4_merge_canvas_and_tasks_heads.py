"""Merge canvas_user_id and user_tasks heads

Revision ID: b1c2d3e4
Revises: a1b2c3d4, c3d4e5f6
Create Date: 2026-04-20

"""
from typing import Sequence, Union
from alembic import op

revision: str = "b1c2d3e4"
down_revision: Union[str, tuple, None] = ("a1b2c3d4", "c3d4e5f6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
