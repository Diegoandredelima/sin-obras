"""
SIN-Obras — Script de Seed (Dados de Desenvolvimento)
Popula o banco com usuários de teste para cada perfil do sistema.

Uso (dentro do container ou com venv ativo):
    cd backend
    python -m app.seed
"""

import asyncio
import sys
from datetime import date

from sqlalchemy import text, select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.rbac import Role
from app.models import (  # noqa — importa todos para criar as tabelas
    Usuario, Obra, Contrato, Meta, Submeta, Evento,
    AuditLog, ArtRrt, Tarefa, DiarioObra, Medicao, Notificacao,
    Vistoria, ChecklistItem, FotoVistoria,
    OrdemServico, AditivoPrazo, Paralisacao, TermoRecebimento, Portaria,
)
from app.models.obra import StatusObra, SaudeObra
from app.models.acompanhamento import (
    TipoParalisacao, TipoTermoRecebimento, TipoPortaria,
)


# ---------------------------------------------------------------------------
# Usuários de teste — um por perfil
# ---------------------------------------------------------------------------
USUARIOS_SEED = [
    {
        "nome": "Secretário José Alves",
        "email": "secretario@sin.rn.gov.br",
        "matricula_cnpj": "10001",
        "senha": "sin@2026",
        "tipo": Role.SECRETARIO,
        "cargo": "Secretário de Estado da Infraestrutura",
    },
    {
        "nome": "Coord. Maria Costa",
        "email": "coordenador@sin.rn.gov.br",
        "matricula_cnpj": "10002",
        "senha": "sin@2026",
        "tipo": Role.COORDENADOR,
        "cargo": "Coordenadora da COS",
    },
    {
        "nome": "Eng. Carlos Souza",
        "email": "engenheiro@sin.rn.gov.br",
        "matricula_cnpj": "10003",
        "senha": "sin@2026",
        "tipo": Role.ENGENHEIRO,
        "cargo": "Engenheiro Civil de Apoio",
    },
    {
        "nome": "Fiscal Pedro Lima",
        "email": "fiscal@sin.rn.gov.br",
        "matricula_cnpj": "10004",
        "senha": "sin@2026",
        "tipo": Role.FISCAL,
        "cargo": "Fiscal de Obras",
    },
    {
        "nome": "Construtora ABC Ltda",
        "email": "contato@construtoraabc.com.br",
        "matricula_cnpj": "12345678000195",  # CNPJ fictício
        "senha": "empresa@2026",
        "tipo": Role.EMPRESA,
        "cargo": "Empresa Executora",
    },
]


# ---------------------------------------------------------------------------
# Obra de demonstração
# ---------------------------------------------------------------------------
async def criar_obra_demo(db, engenheiro_id, empresa_id, fiscal_id, coordenador_id):
    """Cria uma obra de demonstração com cronograma completo e dados de acompanhamento."""

    # Contrato
    contrato = Contrato(
        numero_processo="001/2026-COS",
        numero_contrato="CT-001/2026",
        valor_global=1_500_000.00,
        data_assinatura=date(2026, 1, 15),
        data_publicacao=date(2026, 1, 20),
        data_vigencia=date(2027, 1, 14),
        prazo_vigencia_dias=365,
        prazo_execucao_dias=330,
        empresa_id=empresa_id,
        gestor_id=coordenador_id,
        orgao="SEEC",
        objeto="Reforma e ampliação da Escola Estadual João Pessoa — Natal/RN",
    )
    db.add(contrato)
    await db.flush()

    # Obra
    obra = Obra(
        titulo="Reforma Escola Estadual João Pessoa",
        descricao="Reforma completa com ampliação de 4 salas de aula e modernização da infraestrutura.",
        endereco="Rua das Flores, 100 — Alecrim",
        municipio="Natal",
        valor_contrato=1_500_000.00,
        data_inicio=date(2026, 2, 1),
        data_fim_prevista=date(2026, 12, 31),
        data_ordem_servico=date(2026, 2, 1),
        status=StatusObra.EM_EXECUCAO,
        saude=SaudeObra.VERDE,
        percentual_executado=35.00,
        raio_geofencing_metros=200,
        contrato_id=contrato.id,
        responsavel_id=engenheiro_id,
        gestor_id=coordenador_id,
        orgao="SEEC",
    )
    db.add(obra)
    await db.flush()

    # Ordem de Serviço
    db.add(OrdemServico(
        obra_id=obra.id,
        numero="001/2026-SIN",
        data_emissao=date(2026, 1, 25),
        data_inicio=date(2026, 2, 1),
        processo_sei="02210140.000001/2026-11",
        observacao="Ordem de serviço emitida após assinatura do contrato.",
    ))

    # Aditivo de Prazo
    db.add(AditivoPrazo(
        obra_id=obra.id,
        numero=1,
        dias_adicionados=30,
        nova_data_vigencia=date(2027, 2, 13),
        nova_data_execucao=date(2027, 1, 30),
        processo_sei="02210140.000150/2026-88",
        data_assinatura=date(2026, 9, 10),
        data_publicacao=date(2026, 9, 15),
        observacao="1º Aditivo de Prazo — acréscimo de 30 dias devido a chuvas atípicas.",
    ))

    # Paralisação
    db.add(Paralisacao(
        obra_id=obra.id,
        tipo=TipoParalisacao.PARALISACAO,
        data_evento=date(2026, 7, 15),
        data_publicacao=date(2026, 7, 18),
        saldo_dias_execucao=45,
        saldo_dias_vigencia=75,
        processo_sei="02210140.000200/2026-55",
        motivo="Paralisação temporária por greve dos trabalhadores da construção civil.",
    ))

    # Reinício
    db.add(Paralisacao(
        obra_id=obra.id,
        tipo=TipoParalisacao.REINICIO,
        data_evento=date(2026, 8, 1),
        data_publicacao=date(2026, 8, 3),
        saldo_dias_execucao=30,
        saldo_dias_vigencia=60,
        processo_sei="02210140.000250/2026-99",
        motivo="Retomada das atividades após fim da greve.",
    ))

    # Portaria — designação do fiscal
    db.add(Portaria(
        obra_id=obra.id,
        usuario_id=fiscal_id,
        tipo=TipoPortaria.FISCAL,
        numero="045/2026-GS/SIN",
        data_emissao=date(2026, 1, 22),
        data_publicacao=date(2026, 1, 28),
        processo_sei="02210140.000010/2026-33",
    ))

    # Portaria — designação do gestor
    db.add(Portaria(
        obra_id=obra.id,
        usuario_id=coordenador_id,
        tipo=TipoPortaria.GESTOR,
        numero="046/2026-GS/SIN",
        data_emissao=date(2026, 1, 22),
        data_publicacao=date(2026, 1, 28),
        processo_sei="02210140.000011/2026-77",
    ))

    # Termo de Recebimento Provisório
    db.add(TermoRecebimento(
        obra_id=obra.id,
        tipo=TipoTermoRecebimento.PROVISORIO,
        numero="005/2027-SIN",
        data_emissao=date(2027, 1, 10),
        data_publicacao=date(2027, 1, 15),
        processo_sei="02210140.000800/2027-22",
        observacao="Termo de aceitação provisória — pendente correções na pintura externa.",
    ))

    # Meta 1
    meta1 = Meta(
        obra_id=obra.id,
        descricao="1 — Serviços Preliminares e Infraestrutura",
        valor=150_000.00,
        ordem=1,
    )
    db.add(meta1)
    await db.flush()

    sub1 = Submeta(
        meta_id=meta1.id,
        descricao="1.1 — Demolições e Limpeza",
        valor=50_000.00,
        percentual_previsto=10.00,
    )
    sub2 = Submeta(
        meta_id=meta1.id,
        descricao="1.2 — Fundações",
        valor=100_000.00,
        percentual_previsto=15.00,
    )
    db.add_all([sub1, sub2])
    await db.flush()

    db.add_all([
        Evento(submeta_id=sub1.id, descricao="Demolição de alvenaria", quantidade=200, unidade="m²", valor_unitario=45.00),
        Evento(submeta_id=sub1.id, descricao="Limpeza e remoção de entulho", quantidade=20, unidade="m³", valor_unitario=120.00),
        Evento(submeta_id=sub2.id, descricao="Escavação manual", quantidade=50, unidade="m³", valor_unitario=90.00),
        Evento(submeta_id=sub2.id, descricao="Concreto para fundação (Fck 25 MPa)", quantidade=30, unidade="m³", valor_unitario=850.00),
    ])

    # Meta 2
    meta2 = Meta(
        obra_id=obra.id,
        descricao="2 — Estrutura e Alvenaria",
        valor=600_000.00,
        ordem=2,
    )
    db.add(meta2)
    await db.flush()

    sub3 = Submeta(
        meta_id=meta2.id,
        descricao="2.1 — Estrutura de Concreto Armado",
        valor=350_000.00,
        percentual_previsto=25.00,
    )
    sub4 = Submeta(
        meta_id=meta2.id,
        descricao="2.2 — Alvenaria de Vedação",
        valor=250_000.00,
        percentual_previsto=20.00,
    )
    db.add_all([sub3, sub4])
    await db.flush()

    db.add_all([
        Evento(submeta_id=sub3.id, descricao="Pilares de concreto armado", quantidade=24, unidade="un", valor_unitario=4_500.00),
        Evento(submeta_id=sub3.id, descricao="Vigas e lajes", quantidade=480, unidade="m²", valor_unitario=320.00),
        Evento(submeta_id=sub4.id, descricao="Alvenaria tijolo cerâmico", quantidade=1_200, unidade="m²", valor_unitario=85.00),
    ])

    # Tarefa de exemplo no Kanban
    db.add(Tarefa(
        titulo="Verificar nota fiscal do concreto — lote #3",
        descricao="Checar validade da NF e conformidade com o contrato antes de liberar pagamento.",
        obra_id=obra.id,
        responsavel_id=engenheiro_id,
    ))

    print(f"  ✅ Obra criada: {obra.titulo}")
    print(f"  ✅ Contrato: {contrato.numero_contrato}")
    return obra


# ---------------------------------------------------------------------------
# Runner principal
# ---------------------------------------------------------------------------
async def seed():
    print("\n🌱 Iniciando seed do banco de dados SIN-Obras...\n")

    # Garantir PostGIS
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        print("  ✅ Extensão PostGIS verificada")

    async with AsyncSessionLocal() as db:
        # Verificar se já existe dados
        result = await db.execute(select(Usuario).limit(1))
        if result.scalar_one_or_none():
            print("  ⚠️  Banco já possui dados. Pulando seed para não duplicar.")
            print("     Para re-seeding: apague o banco e rode novamente.\n")
            return

        print("  📥 Criando usuários de teste...\n")

        usuarios_criados = {}
        for u in USUARIOS_SEED:
            usuario = Usuario(
                nome=u["nome"],
                email=u["email"],
                matricula_cnpj=u["matricula_cnpj"],
                senha_hash=get_password_hash(u["senha"]),
                tipo=u["tipo"],
                cargo=u.get("cargo"),
                ativo=True,
            )
            db.add(usuario)
            await db.flush()
            usuarios_criados[u["tipo"]] = usuario
            print(f"  ✅ {u['tipo'].value}: {u['nome']} (matrícula/CNPJ: {u['matricula_cnpj']})")

        print("\n  🏗️  Criando obra de demonstração...\n")
        await criar_obra_demo(
            db,
            engenheiro_id=usuarios_criados[Role.ENGENHEIRO].id,
            empresa_id=usuarios_criados[Role.EMPRESA].id,
            fiscal_id=usuarios_criados[Role.FISCAL].id,
            coordenador_id=usuarios_criados[Role.COORDENADOR].id,
        )

        await db.commit()

    print("\n" + "=" * 50)
    print("✅ Seed concluído com sucesso!")
    print("=" * 50)
    print("\n📋 Credenciais de acesso (desenvolvimento):\n")
    for u in USUARIOS_SEED:
        print(f"  [{u['tipo'].value:12s}] Matrícula/CNPJ: {u['matricula_cnpj']:15s}  Senha: {u['senha']}")
    print()


if __name__ == "__main__":
    asyncio.run(seed())
