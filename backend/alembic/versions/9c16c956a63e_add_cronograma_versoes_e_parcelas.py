"""add_cronograma_versoes_e_parcelas

Revision ID: 9c16c956a63e
Revises: f7a8b9c0d1e2
Create Date: 2026-06-26 20:44:44.394618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9c16c956a63e'
down_revision: Union[str, None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())

def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()

def upgrade() -> None:
    if not _has_table('cronograma_versoes'):
        op.create_table('cronograma_versoes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('objeto_id', sa.UUID(), nullable=False),
        sa.Column('numero_versao', sa.Integer(), nullable=False),
        sa.Column('ativa', sa.Boolean(), nullable=False),
        sa.Column('linha_de_base', sa.Boolean(), nullable=False),
        sa.Column('justificativa', sa.Text(), nullable=True),
        sa.Column('total_periodos', sa.Integer(), nullable=False),
        sa.Column('criado_por_id', sa.UUID(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['criado_por_id'], ['usuarios.id'], name='cronograma_versoes_criado_por_id_fkey'),
        sa.ForeignKeyConstraint(['objeto_id'], ['objetos.id'], name='cronograma_versoes_objeto_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='cronograma_versoes_pkey'),
        sa.UniqueConstraint('objeto_id', 'numero_versao', name='uq_cronograma_versao_numero')
        )
        
    if not _has_table('cronograma_parcelas'):
        op.create_table('cronograma_parcelas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('versao_id', sa.UUID(), nullable=False),
        sa.Column('evento_id', sa.UUID(), nullable=False),
        sa.Column('periodo_numero', sa.Integer(), nullable=False),
        sa.Column('quantidade_prevista', sa.Numeric(precision=12, scale=4), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['evento_id'], ['eventos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['versao_id'], ['cronograma_versoes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='cronograma_parcelas_pkey'),
        sa.UniqueConstraint('versao_id', 'evento_id', 'periodo_numero', name='uq_cronograma_parcela')
        )


def downgrade() -> None:
    op.drop_table('cronograma_parcelas')
    op.drop_table('cronograma_versoes')
