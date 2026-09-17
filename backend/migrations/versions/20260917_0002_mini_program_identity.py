"""add mini program identity fields

Revision ID: 20260917_0002
Revises: 20260914_0001
"""
from alembic import op
import sqlalchemy as sa


revision = "20260917_0002"
down_revision = "20260914_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("mini_program_openid", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("unionid", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.create_index("ix_users_mini_program_openid", "users", ["mini_program_openid"], unique=True)
    op.create_index("ix_users_unionid", "users", ["unionid"], unique=True)


def downgrade():
    op.drop_index("ix_users_unionid", table_name="users")
    op.drop_index("ix_users_mini_program_openid", table_name="users")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "unionid")
    op.drop_column("users", "mini_program_openid")
