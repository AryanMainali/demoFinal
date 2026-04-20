"""Add canvas_user_id and cwid to users table

Revision ID: a1b2c3d4
Revises: z9y8x7w6
Create Date: 2026-04-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4"
down_revision: Union[str, None] = "z9y8x7w6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("canvas_user_id", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("cwid", sa.String(50), nullable=True))
    op.create_index("ix_users_canvas_user_id", "users", ["canvas_user_id"])
    op.create_index("ix_users_cwid", "users", ["cwid"])


def downgrade() -> None:
    op.drop_index("ix_users_cwid", table_name="users")
    op.drop_index("ix_users_canvas_user_id", table_name="users")
    op.drop_column("users", "cwid")
    op.drop_column("users", "canvas_user_id")
