"""Add user_tasks table for personal calendar tasks (all roles)

Revision ID: c3d4e5f6
Revises: b2c3d4e5
Create Date: 2026-04-19

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6"
down_revision: Union[str, None] = "b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("todo", "in_progress", "done", name="taskstatus"),
            nullable=False,
            server_default="todo",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_tasks_id", "user_tasks", ["id"])
    op.create_index("ix_user_tasks_user_id", "user_tasks", ["user_id"])
    op.create_index("ix_user_tasks_date", "user_tasks", ["date"])


def downgrade() -> None:
    op.drop_index("ix_user_tasks_date", table_name="user_tasks")
    op.drop_index("ix_user_tasks_user_id", table_name="user_tasks")
    op.drop_index("ix_user_tasks_id", table_name="user_tasks")
    op.drop_table("user_tasks")
    op.execute("DROP TYPE IF EXISTS taskstatus")
