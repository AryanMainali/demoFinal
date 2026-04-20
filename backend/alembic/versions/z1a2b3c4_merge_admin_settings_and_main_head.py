"""Merge admin_settings head with main head

Revision ID: z1a2b3c4
Revises: f0a1b2c3d4e5, x6y7z8a9
Create Date: 2026-04-20

"""
from typing import Sequence, Union

revision: str = "z1a2b3c4"
down_revision: Union[str, tuple, None] = ("f0a1b2c3d4e5", "x6y7z8a9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
