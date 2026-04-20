"""Add rubric templates tables and bonus/template fields to assignments

Revision ID: w5x6y7z8
Revises: v4w5x6y7
Create Date: 2026-04-20

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "w5x6y7z8"
down_revision: Union[str, None] = "v4w5x6y7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(conn, name: str) -> bool:
    return sa.inspect(conn).has_table(name)


def _column_exists(conn, table: str, column: str) -> bool:
    cols = [c["name"] for c in sa.inspect(conn).get_columns(table)]
    return column in cols


def upgrade() -> None:
    conn = op.get_bind()

    # ── Create course_rubric_templates ──────────────────────────────────
    if not _table_exists(conn, "course_rubric_templates"):
        op.create_table(
            "course_rubric_templates",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_course_rubric_templates_id", "course_rubric_templates", ["id"])
        op.create_index("ix_course_rubric_templates_course_id", "course_rubric_templates", ["course_id"])

    # ── Create course_rubric_template_items ─────────────────────────────
    if not _table_exists(conn, "course_rubric_template_items"):
        op.create_table(
            "course_rubric_template_items",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("template_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("min_scale", sa.Float(), nullable=False, server_default="0"),
            sa.Column("max_scale", sa.Float(), nullable=False, server_default="5"),
            sa.Column("weight", sa.Float(), nullable=False, server_default="0"),
            sa.Column("points", sa.Float(), nullable=False, server_default="0"),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["template_id"], ["course_rubric_templates.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_course_rubric_template_items_id", "course_rubric_template_items", ["id"])
        op.create_index("ix_course_rubric_template_items_template_id", "course_rubric_template_items", ["template_id"])

    # ── Create course_rubric_template_level_descriptors ─────────────────
    if not _table_exists(conn, "course_rubric_template_level_descriptors"):
        op.create_table(
            "course_rubric_template_level_descriptors",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("score", sa.Float(), nullable=False),
            sa.Column("comment", sa.Text(), nullable=False, server_default=""),
            sa.ForeignKeyConstraint(["item_id"], ["course_rubric_template_items.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_course_rubric_template_level_descriptors_id", "course_rubric_template_level_descriptors", ["id"])
        op.create_index("ix_course_rubric_template_level_descriptors_item_id", "course_rubric_template_level_descriptors", ["item_id"])

    # ── Alter assignments: add new columns ──────────────────────────────
    if not _column_exists(conn, "assignments", "is_template_rubric"):
        op.add_column("assignments", sa.Column("is_template_rubric", sa.Boolean(), nullable=False, server_default="false"))
    if not _column_exists(conn, "assignments", "rubric_template_id"):
        op.add_column("assignments", sa.Column("rubric_template_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_assignments_rubric_template_id",
            "assignments",
            "course_rubric_templates",
            ["rubric_template_id"],
            ["id"],
            ondelete="SET NULL",
        )
    if not _column_exists(conn, "assignments", "bonus_points"):
        op.add_column("assignments", sa.Column("bonus_points", sa.Float(), nullable=False, server_default="0"))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    fks = [fk["name"] for fk in inspector.get_foreign_keys("assignments")]
    if "fk_assignments_rubric_template_id" in fks:
        op.drop_constraint("fk_assignments_rubric_template_id", "assignments", type_="foreignkey")

    cols = [c["name"] for c in inspector.get_columns("assignments")]
    for col in ("bonus_points", "rubric_template_id", "is_template_rubric"):
        if col in cols:
            op.drop_column("assignments", col)

    for tbl in ("course_rubric_template_level_descriptors", "course_rubric_template_items", "course_rubric_templates"):
        if _table_exists(conn, tbl):
            op.drop_table(tbl)
