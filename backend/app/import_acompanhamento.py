"""
SIN-Obras — Importação da planilha oficial "Acompanhamento de obras.xlsx"

Lê a planilha (aba OBRAS), transforma os dados (datas-serial → DATE,
texto → NUMERIC, situação livre → enum) e popula as tabelas normalizadas:
`orgaos`, `empresas`, `contratos` e `obras`.

Regras de modelagem aplicadas (ver Docs/relatorio_banco):
  * Empresa e Órgão viram entidades próprias (deduplicadas).
  * Campos atômicos (valores, datas de vigência/execução, prazos) vão para
    colunas tipadas.
  * Colunas de texto livre (ordem de serviço, paralisações, processos SEI,
    OBS) são PRESERVADAS num bloco rotulado em `obras.observacoes` — nada é
    descartado, mas também não é parseado de forma frágil.

Idempotente: contratos cujo `numero_contrato` já existe são pulados, então o
script pode ser re-executado com segurança.

Uso (dentro do container backend):
    # Copie a planilha para dentro do container antes:
    #   docker compose cp "dados-oficiais/Acompanhamento de obras.xlsx" \
    #       backend:/app/_import/Acompanhamento.xlsx
    docker compose exec -e PYTHONPATH=/app backend \
        python -m app.import_acompanhamento
"""

import asyncio
import os
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

import openpyxl
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models import Contrato, Empresa, Objeto, Orgao
from app.models.objeto import SaudeObjeto, SituacaoObjeto, StatusObjeto

XLSX_PATH = os.environ.get("IMPORT_XLSX", "/app/_import/Acompanhamento.xlsx")
SHEET = "OBRAS"
HEADER_ROW = 11      # linha do cabeçalho principal
DATA_START_ROW = 13  # primeira linha de dados

# Mapa de colunas (1-based) -> significado
COL = {
    "situacao": 2, "numero_contrato": 3, "processo": 4, "municipio": 5,
    "objeto": 6, "orgao": 7, "empresa": 8, "fiscal": 9, "portaria": 10,
    "gestor": 11, "valor_inicial": 12, "valor_aditivo": 13, "valor_reajustado": 14,
    "valor_final": 15, "valor_medido": 16, "saldo_a_medir": 17, "recurso_fed": 18,
    "recurso_est": 19, "execucao_pct": 20, "ordem_servico": 21, "matricula_cei": 22,
    "prazo_inicial": 23, "historico": 24,
    "paralisacao_lista": 26, "reinicio_lista": 28, "paralisacao": 29,
    "motivo_paralisacao": 33, "reinicio": 34,
    "vig_inicio": 35, "vig_dias": 36, "vig_fim": 37, "vig_situacao": 38,
    "exec_inicio": 39, "exec_dias": 40, "exec_fim": 41, "exec_situacao": 42,
    "importante": 43, "obs": 44, "tipo_licitacao": 45,
    "proc_medicao": 46, "proc_aditivo": 47, "proc_readequacao": 48,
    "proc_apostilamento": 49, "proc_reajuste": 50, "proc_paralisacao": 51,
    "previsao_termino": 52,
}

NA_TOKENS = {"#N/A", "#N/D", "#REF!", "#VALOR!", "#VALUE!", "", "-", "S/N"}


# ---------------------------------------------------------------------------
# Helpers de limpeza / conversão
# ---------------------------------------------------------------------------
def cell(row, key):
    return row[COL[key] - 1]


def clean_str(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.upper() in NA_TOKENS:
        return None
    return s


def parse_money(v) -> Decimal | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        try:
            return Decimal(str(round(float(v), 2)))
        except (InvalidOperation, ValueError):
            return None
    s = str(v).strip()
    if not s or s.upper() in NA_TOKENS:
        return None
    s = s.replace("R$", "").replace(" ", "")
    # formato pt-BR 1.234.567,89
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return Decimal(str(round(float(s), 2)))
    except (InvalidOperation, ValueError):
        return None


def parse_date(v) -> date | None:
    if isinstance(v, datetime):
        v = v.date()
    if isinstance(v, date):
        # 1899-12-29/30 é o "zero" do serial Excel → considerar nulo
        return v if v.year > 1901 else None
    return None  # textos não são datas confiáveis


def parse_dias(v) -> int | None:
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return int(v)
    s = clean_str(v)
    if not s:
        return None
    m = re.search(r"\d+", s.replace(".", ""))
    return int(m.group()) if m else None


def parse_pct(v) -> Decimal | None:
    """Coluna EXECUÇÃO vem como fração (0..1)."""
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return Decimal(str(round(float(v) * 100, 2)))
    return None


def parse_ano(*vals) -> int | None:
    for v in vals:
        s = clean_str(v) if not isinstance(v, (date, datetime)) else None
        if s:
            m = re.search(r"(20\d{2}|19\d{2})", s)
            if m:
                return int(m.group())
        if isinstance(v, (date, datetime)) and getattr(v, "year", 0) > 1901:
            return v.year
    return None


def map_situacao(raw: str | None) -> SituacaoObjeto | None:
    if not raw:
        return None
    s = raw.strip().upper()
    if s.startswith("CONCLU"):
        return SituacaoObjeto.CONCLUIDA
    if s.startswith("RESCI"):  # cobre "RESCISÃO" e o typo "RESCIDIDA"
        return SituacaoObjeto.RESCINDIDA
    if "ARQUIV" in s:
        return SituacaoObjeto.ARQUIVADA
    if "EXTINT" in s:
        return SituacaoObjeto.EXTINTA
    if "CEDID" in s:
        return SituacaoObjeto.CEDIDA
    if s.startswith("INACAB"):
        return SituacaoObjeto.INACABADA
    if s.startswith("AND"):
        return SituacaoObjeto.EM_ANDAMENTO
    if "INIC" in s and "REINIC" not in s:
        return SituacaoObjeto.A_INICIAR
    if s.startswith("PAR"):
        return SituacaoObjeto.PARALISADA
    return None


SITUACAO_TO_STATUS = {
    SituacaoObjeto.A_INICIAR: StatusObjeto.PLANEJADA,
    SituacaoObjeto.EM_ANDAMENTO: StatusObjeto.EM_EXECUCAO,
    SituacaoObjeto.PARALISADA: StatusObjeto.PARALISADA,
    SituacaoObjeto.INACABADA: StatusObjeto.PARALISADA,
    SituacaoObjeto.CONCLUIDA: StatusObjeto.CONCLUIDA,
    SituacaoObjeto.RESCINDIDA: StatusObjeto.PARALISADA,
    SituacaoObjeto.ARQUIVADA: StatusObjeto.PARALISADA,
    SituacaoObjeto.EXTINTA: StatusObjeto.PARALISADA,
    SituacaoObjeto.CEDIDA: StatusObjeto.PARALISADA,
}


def build_observacoes(row) -> str | None:
    """Concatena, com rótulos, todas as colunas de texto livre não-atômicas."""
    parts = []
    labels = [
        ("ORDEM DE SERVIÇO", "ordem_servico"),
        ("PORTARIA", "portaria"),
        ("PARALISAÇÃO", "paralisacao"),
        ("PARALISAÇÕES (lista)", "paralisacao_lista"),
        ("MOTIVO DA PARALISAÇÃO", "motivo_paralisacao"),
        ("REINÍCIO", "reinicio"),
        ("REINÍCIOS (lista)", "reinicio_lista"),
        ("PROCESSO MEDIÇÃO", "proc_medicao"),
        ("PROCESSO ADITIVO DE PRAZO", "proc_aditivo"),
        ("PROCESSO READEQUAÇÃO", "proc_readequacao"),
        ("PROCESSO APOSTILAMENTO", "proc_apostilamento"),
        ("PROCESSO REAJUSTE", "proc_reajuste"),
        ("PROCESSO PARALISAÇÃO", "proc_paralisacao"),
        ("PREVISÃO DE TÉRMINO", "previsao_termino"),
        ("OBS", "obs"),
    ]
    for label, key in labels:
        v = cell(row, key)
        if isinstance(v, (datetime, date)):
            v = v.strftime("%d/%m/%Y") if getattr(v, "year", 0) > 1901 else None
        s = clean_str(v) if v is not None else None
        if s:
            parts.append(f"{label}: {s}")
    return "\n".join(parts) if parts else None


# ---------------------------------------------------------------------------
# Importação
# ---------------------------------------------------------------------------
async def importar():
    print(f"\n📂 Lendo planilha: {XLSX_PATH}")
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True, read_only=True)
    ws = wb[SHEET]
    all_rows = list(ws.iter_rows(min_row=DATA_START_ROW, values_only=True))
    print(f"   {len(all_rows)} linhas de dados na aba '{SHEET}'.")

    async with AsyncSessionLocal() as db:
        # Pré-carrega caches para deduplicação e idempotência
        orgaos = {o.sigla: o for o in (await db.execute(select(Orgao))).scalars()}
        empresas = {e.razao_social: e for e in (await db.execute(select(Empresa))).scalars()}
        existentes = {
            c for c in (
                await db.execute(select(Contrato.numero_contrato))
            ).scalars()
        }

        stats = {"contratos": 0, "objetos": 0, "empresas_novas": 0,
                 "orgaos_novos": 0, "pulados": 0, "sem_numero": 0}
        seen = set()

        for row in all_rows:
            numero = clean_str(cell(row, "numero_contrato"))
            if not numero:
                stats["sem_numero"] += 1
                continue

            # Desambiguar duplicatas dentro da própria planilha
            base = numero[:50]
            numero = base
            n = 1
            while numero in seen:
                n += 1
                numero = f"{base[:44]} ({n})"
            seen.add(numero)

            if numero in existentes:
                stats["pulados"] += 1
                continue

            # --- Órgão ---
            orgao_obj = None
            sigla = clean_str(cell(row, "orgao"))
            if sigla:
                sigla = sigla[:40]
                orgao_obj = orgaos.get(sigla)
                if orgao_obj is None:
                    orgao_obj = Orgao(sigla=sigla)
                    db.add(orgao_obj)
                    await db.flush()
                    orgaos[sigla] = orgao_obj
                    stats["orgaos_novos"] += 1

            # --- Empresa ---
            empresa_obj = None
            razao = clean_str(cell(row, "empresa"))
            if razao:
                razao = razao[:300]
                empresa_obj = empresas.get(razao)
                if empresa_obj is None:
                    empresa_obj = Empresa(razao_social=razao)
                    db.add(empresa_obj)
                    await db.flush()
                    empresas[razao] = empresa_obj
                    stats["empresas_novas"] += 1

            # --- Valores ---
            v_inicial = parse_money(cell(row, "valor_inicial")) or Decimal("0.00")
            v_aditivo = parse_money(cell(row, "valor_aditivo"))
            v_reaj = parse_money(cell(row, "valor_reajustado"))
            v_final = parse_money(cell(row, "valor_final"))
            v_medido = parse_money(cell(row, "valor_medido"))
            v_saldo = parse_money(cell(row, "saldo_a_medir"))

            processo = clean_str(cell(row, "processo")) or "S/N"
            tipo_lic = clean_str(cell(row, "tipo_licitacao"))
            cei = clean_str(cell(row, "matricula_cei"))

            contrato = Contrato(
                numero_processo=processo[:50],
                numero_contrato=numero,
                valor_global=v_inicial,
                empresa_ref_id=empresa_obj.id if empresa_obj else None,
                orgao_id=orgao_obj.id if orgao_obj else None,
                orgao=sigla,
                fiscal_nome=clean_str(cell(row, "fiscal")),
                gestor_nome=clean_str(cell(row, "gestor")),
                objeto=clean_str(cell(row, "objeto")),
                valor_aditivo=v_aditivo,
                valor_reajustado=v_reaj,
                valor_final=v_final,
                recurso_federal=parse_money(cell(row, "recurso_fed")),
                recurso_estadual=parse_money(cell(row, "recurso_est")),
                tipo_licitacao=tipo_lic[:100] if tipo_lic else None,
                matricula_cei=cei[:50] if cei else None,
            )
            db.add(contrato)
            await db.flush()
            stats["contratos"] += 1

            # --- Objeto ---
            sit_raw = clean_str(cell(row, "situacao"))
            situacao = map_situacao(sit_raw)
            status = SITUACAO_TO_STATUS.get(situacao, StatusObjeto.PLANEJADA)
            objeto = clean_str(cell(row, "objeto"))
            titulo = (objeto or f"Objeto {numero}")[:300]
            pct = parse_pct(cell(row, "execucao_pct")) or Decimal("0.00")
            if pct > Decimal("100"):
                pct = Decimal("100.00")

            objeto = Objeto(
                titulo=titulo,
                descricao=objeto,
                municipio=(clean_str(cell(row, "municipio")) or "")[:100] or None,
                valor_contrato=(v_final or v_inicial or Decimal("0.00")),
                status=status,
                situacao=situacao,
                situacao_origem=sit_raw[:100] if sit_raw else None,
                ano_referencia=parse_ano(sit_raw, cell(row, "exec_fim"),
                                         cell(row, "vig_fim")),
                saude=SaudeObjeto.VERDE,
                percentual_executado=pct,
                contrato_id=contrato.id,
                orgao=sigla,
                prazo_inicial_dias=parse_dias(cell(row, "prazo_inicial")),
                vigencia_inicio=parse_date(cell(row, "vig_inicio")),
                vigencia_dias=parse_dias(cell(row, "vig_dias")),
                vigencia_fim=parse_date(cell(row, "vig_fim")),
                execucao_inicio=parse_date(cell(row, "exec_inicio")),
                execucao_dias=parse_dias(cell(row, "exec_dias")),
                execucao_fim=parse_date(cell(row, "exec_fim")),
                valor_medido=v_medido,
                saldo_a_medir=v_saldo,
                matricula_cei=cei[:50] if cei else None,
                historico=clean_str(cell(row, "historico")),
                importante=clean_str(cell(row, "importante")),
                observacoes=build_observacoes(row),
            )
            db.add(objeto)
            stats["objetos"] += 1

            if stats["contratos"] % 100 == 0:
                await db.flush()
                print(f"   ... {stats['contratos']} contratos processados")

        await db.commit()

    print("\n" + "=" * 56)
    print("✅ Importação concluída")
    print("=" * 56)
    for k, v in stats.items():
        print(f"  {k:18s}: {v}")
    print()


if __name__ == "__main__":
    asyncio.run(importar())
