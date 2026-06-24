"""
SIN-Obras — Serviço de Curva S Preditiva (EVM)

Calcula a Curva S com três séries: Planejado, Realizado e Preditivo.
Usa earned value management para projetar tendência de conclusão.
"""
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Evento, Meta, Objeto, Submeta
from app.models.portal import Medicao, StatusMedicao


async def compute_curva_s(db: AsyncSession, objeto_id: UUID) -> dict:
    objeto = (await db.execute(select(Objeto).where(Objeto.id == objeto_id))).scalar_one_or_none()
    if not objeto:
        return {"error": "Objeto não encontrada"}

    # Buscar cronograma planejado
    metas_stmt = select(Meta).where(Meta.objeto_id == objeto_id)
    metas_result = await db.execute(metas_stmt)
    metas = metas_result.scalars().all()

    valor_total_planejado = Decimal("0")
    for meta in metas:
        sub_stmt = select(Submeta).where(Submeta.meta_id == meta.id)
        sub_result = await db.execute(sub_stmt)
        for sub in sub_result.scalars().all():
            evt_stmt = select(Evento).where(Evento.submeta_id == sub.id)
            evt_result = await db.execute(evt_stmt)
            for evt in evt_result.scalars().all():
                valor_total_planejado += evt.valor_total

    # Buscar medições aprovadas
    med_stmt = (
        select(Medicao)
        .where(Medicao.objeto_id == objeto_id, Medicao.status == StatusMedicao.APROVADA)
        .order_by(Medicao.criado_em.asc())
    )
    med_result = await db.execute(med_stmt)
    medicoes = med_result.scalars().all()

    # Determinar período
    data_inicio = objeto.data_inicio or objeto.criado_em.date() if objeto.criado_em else date.today()
    data_fim = objeto.data_fim_prevista or data_inicio + timedelta(days=365)

    total_dias = max((data_fim - data_inicio).days, 1)
    meses = max(total_dias // 30, 1)

    # Distribuição planejada uniforme ao longo dos meses
    datas = []
    planejado = []
    realizado = []
    valor_planejado_acum = Decimal("0")
    valor_realizado_acum = Decimal("0")

    valor_por_mes = valor_total_planejado / meses

    for i in range(meses + 1):
        mes_data = data_inicio.replace(day=1) + timedelta(days=i * 30)
        if i == meses:
            mes_data = data_fim
        datas.append(mes_data.isoformat())

        if i == 0:
            planejado.append(0)
            realizado.append(0)
            continue

        valor_planejado_acum += valor_por_mes
        planejado.append(round(float(valor_planejado_acum), 2))

        # Valor realizado: somar medições até esta data
        acc = Decimal("0")
        for m in medicoes:
            m_data = m.criado_em.date() if m.criado_em else date.today()
            if m_data <= mes_data and m.valor_medido:
                acc += m.valor_medido
        valor_realizado_acum = acc
        realizado.append(round(float(valor_realizado_acum), 2))

    # Garantir que o último ponto de planejado atinge 100%
    if planejado and valor_total_planejado > 0:
        planejado[-1] = round(float(valor_total_planejado), 2)

    # Preditivo: projetar tendência linear a partir dos dados realizados
    preditivo = list(realizado)
    if len(datas) > 2 and valor_total_planejado > 0 and valor_realizado_acum > 0:
        # Encontrar pontos não-zero para a regressão
        pts = [(i, realizado[i]) for i in range(len(realizado)) if realizado[i] > 0]
        if len(pts) >= 2:
            n = len(pts)
            sum_x = sum(p[0] for p in pts)
            sum_y = sum(p[1] for p in pts)
            sum_xy = sum(p[0] * p[1] for p in pts)
            sum_x2 = sum(p[0] * p[0] for p in pts)
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
            intercept = (sum_y - slope * sum_x) / n

            target = float(valor_total_planejado)
            target_idx = int((target - intercept) / slope) if slope > 0 else len(datas)

            preditivo = []
            for i in range(len(datas)):
                preditivo.append(round(max(0, min(intercept + slope * i, target)), 2))

            # Estender preditivo até atingir o alvo
            if target_idx > len(datas) - 1:
                steps_to_add = target_idx - len(datas) + 1
                for j in range(1, steps_to_add + 1):
                    data_futura = (data_fim + timedelta(days=j * 30)).isoformat()
                    datas.append(data_futura)
                    planejado.append(planejado[-1])  # platô no planejado
                    preditivo.append(round(max(0, min(intercept + slope * (len(datas) - 1), target)), 2))

    # Calcular prazo predito
    prazo_predito = None
    if preditivo and valor_total_planejado > 0 and len(preditivo) > 0:
        target = float(valor_total_planejado)
        idx_atinge = next((i for i, v in enumerate(preditivo) if v >= target), len(preditivo) - 1)
        if idx_atinge < len(datas):
            prazo_predito = datas[idx_atinge]
        else:
            extra_dias = (idx_atinge - len(datas) + 1) * 30
            prazo_predito = (data_fim + timedelta(days=extra_dias)).isoformat()

    return {
        "datas": datas,
        "planejado": planejado,
        "realizado": realizado,
        "preditivo": preditivo,
        "valor_total_planejado": float(valor_total_planejado),
        "valor_total_realizado": round(float(valor_realizado_acum), 2),
        "prazo_contratual": data_fim.isoformat(),
        "prazo_predito": prazo_predito,
    }
