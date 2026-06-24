"""
SIN-Obras — Serviço de Diário de Obras e Medições
Implementa RN01 (Bloqueio por ART) e assinatura eletrônica com SHA-256
"""

import hashlib
import json
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.art_rrt import ArtRrt
from app.models.objeto import Contrato, Evento, Objeto
from app.models.portal import (
    DiarioObra,
    FotoMedicao,
    Medicao,
    MedicaoItem,
    MedicaoItemMemoria,
    OrigemMedicao,
    StatusMedicao,
)
from app.schemas.portal import (
    DiarioCreate,
    DiarioUpdate,
    MedicaoCreate,
    MedicaoItemCreate,
    MedicaoItemUpdate,
    MedicaoUpdate,
)
from app.services import storage

CENTS = Decimal("0.01")


def _money(value: Decimal) -> Decimal:
    """Arredonda para 2 casas (regra de meio para cima, como em faturamento)."""
    return Decimal(value).quantize(CENTS, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
async def get_diario_by_objeto(db: AsyncSession, objeto_id: UUID):
    result = await db.execute(
        select(DiarioObra)
        .where(DiarioObra.objeto_id == objeto_id)
        .order_by(DiarioObra.data_registro.desc())
    )
    return result.scalars().all()


async def create_diario(db: AsyncSession, objeto_id: UUID, usuario_id: UUID, obj_in: DiarioCreate) -> DiarioObra:
    db_obj = DiarioObra(**obj_in.model_dump(), objeto_id=objeto_id, usuario_id=usuario_id)
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_diario(db: AsyncSession, diario_id: UUID, usuario_id: UUID, obj_in: DiarioUpdate) -> DiarioObra:
    result = await db.execute(select(DiarioObra).where(DiarioObra.id == diario_id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de diário não encontrado.")
    if db_obj.usuario_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para editar este registro.")

    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Medições
# ---------------------------------------------------------------------------
async def get_medicoes_by_objeto(db: AsyncSession, objeto_id: UUID):
    result = await db.execute(
        select(Medicao)
        .where(Medicao.objeto_id == objeto_id)
        .order_by(Medicao.numero_medicao.desc())
    )
    return result.scalars().all()


async def get_medicao_by_id(db: AsyncSession, medicao_id: UUID) -> Medicao:
    result = await db.execute(select(Medicao).where(Medicao.id == medicao_id))
    medicao = result.scalar_one_or_none()
    if not medicao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medição não encontrada.")
    return medicao


async def _proximo_numero_medicao(db: AsyncSession, objeto_id: UUID) -> int:
    result = await db.execute(
        select(func.coalesce(func.max(Medicao.numero_medicao), 0))
        .where(Medicao.objeto_id == objeto_id)
    )
    return result.scalar_one() + 1


async def _resolver_retencao(db: AsyncSession, contrato_id: UUID | None, informado: Decimal | None) -> Decimal:
    """Percentual de retenção: usa o informado ou herda o padrão do contrato."""
    if informado is not None:
        return Decimal(informado)
    if contrato_id is not None:
        result = await db.execute(select(Contrato.percentual_retencao).where(Contrato.id == contrato_id))
        padrao = result.scalar_one_or_none()
        if padrao is not None:
            return Decimal(padrao)
    return Decimal("0.00")


def _linhas_memoria(item_in: MedicaoItemCreate | MedicaoItemUpdate) -> list[MedicaoItemMemoria]:
    """Converte as linhas de memória de cálculo do schema em modelos ORM."""
    linhas = getattr(item_in, "memoria", None) or []
    return [
        MedicaoItemMemoria(
            ordem=linha.ordem if linha.ordem is not None else idx,
            descricao=linha.descricao,
            comprimento=linha.comprimento,
            largura=linha.largura,
            altura=linha.altura,
            percentual=linha.percentual,
            n_repeticoes=linha.n_repeticoes,
            quantidade=linha.quantidade,
        )
        for idx, linha in enumerate(linhas)
    ]


async def _novo_item(db: AsyncSession, item_in: MedicaoItemCreate) -> MedicaoItem:
    """Cria um item de boletim, congelando o preço unitário do evento."""
    ev_result = await db.execute(select(Evento).where(Evento.id == item_in.evento_id))
    evento = ev_result.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    valor_unitario = item_in.valor_unitario if item_in.valor_unitario is not None else evento.valor_unitario
    return MedicaoItem(
        evento_id=item_in.evento_id,
        quantidade_periodo=item_in.quantidade_periodo,
        valor_unitario=valor_unitario,
        desconto_vaos=item_in.desconto_vaos,
        observacao=item_in.observacao,
        memoria=_linhas_memoria(item_in),
    )


async def create_medicao(
    db: AsyncSession,
    autor_id: UUID,
    obj_in: MedicaoCreate,
    origem: OrigemMedicao = OrigemMedicao.EMPRESA,
) -> Medicao:
    numero = await _proximo_numero_medicao(db, obj_in.objeto_id)
    retencao = await _resolver_retencao(db, obj_in.contrato_id, obj_in.percentual_retencao)

    db_obj = Medicao(
        objeto_id=obj_in.objeto_id,
        contrato_id=obj_in.contrato_id,
        empresa_usuario_id=autor_id if origem == OrigemMedicao.EMPRESA else None,
        autor_id=autor_id,
        origem=origem,
        numero_medicao=numero,
        status=StatusMedicao.RASCUNHO,
        data_inicio_periodo=obj_in.data_inicio_periodo,
        data_fim_periodo=obj_in.data_fim_periodo,
        percentual_retencao=retencao,
        valor_faturamento_direto=obj_in.valor_faturamento_direto,
    )
    for item_in in obj_in.itens:
        db_obj.itens.append(await _novo_item(db, item_in))

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


def _pode_editar(db_obj: Medicao, usuario_id: UUID) -> None:
    if db_obj.autor_id != usuario_id and db_obj.empresa_usuario_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    if db_obj.status != StatusMedicao.RASCUNHO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas rascunhos podem ser editados.")


async def update_medicao(db: AsyncSession, medicao_id: UUID, usuario_id: UUID, obj_in: MedicaoUpdate) -> Medicao:
    db_obj = await get_medicao_by_id(db, medicao_id)
    _pode_editar(db_obj, usuario_id)

    if obj_in.data_inicio_periodo is not None:
        db_obj.data_inicio_periodo = obj_in.data_inicio_periodo
    if obj_in.data_fim_periodo is not None:
        db_obj.data_fim_periodo = obj_in.data_fim_periodo
    if obj_in.percentual_retencao is not None:
        db_obj.percentual_retencao = obj_in.percentual_retencao
    if obj_in.valor_faturamento_direto is not None:
        db_obj.valor_faturamento_direto = obj_in.valor_faturamento_direto

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Itens do boletim
# ---------------------------------------------------------------------------
async def add_item(db: AsyncSession, medicao_id: UUID, usuario_id: UUID, item_in: MedicaoItemCreate) -> MedicaoItem:
    db_obj = await get_medicao_by_id(db, medicao_id)
    _pode_editar(db_obj, usuario_id)
    item = await _novo_item(db, item_in)
    item.medicao_id = medicao_id
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def _get_item(db: AsyncSession, item_id: UUID) -> MedicaoItem:
    result = await db.execute(select(MedicaoItem).where(MedicaoItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de medição não encontrado.")
    return item


async def update_item(db: AsyncSession, item_id: UUID, usuario_id: UUID, item_in: MedicaoItemUpdate) -> MedicaoItem:
    item = await _get_item(db, item_id)
    medicao = await get_medicao_by_id(db, item.medicao_id)
    _pode_editar(medicao, usuario_id)

    data = item_in.model_dump(exclude_unset=True)
    # As linhas de memória são tratadas à parte (replace-all): remover do dict de
    # campos escalares para não sobrescrever a relação com uma lista de dicts.
    substituir_memoria = "memoria" in data
    data.pop("memoria", None)
    for field, value in data.items():
        setattr(item, field, value)

    if substituir_memoria:
        item.memoria.clear()
        item.memoria.extend(_linhas_memoria(item_in))

    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def remove_item(db: AsyncSession, item_id: UUID, usuario_id: UUID) -> None:
    item = await _get_item(db, item_id)
    medicao = await get_medicao_by_id(db, item.medicao_id)
    _pode_editar(medicao, usuario_id)
    await db.delete(item)
    await db.flush()


# ---------------------------------------------------------------------------
# Cálculo do Boletim de Medição
# ---------------------------------------------------------------------------
QTD = Decimal("0.0001")


def _qtd(value: Decimal) -> Decimal:
    """Arredonda quantidade para 4 casas decimais."""
    return Decimal(value).quantize(QTD, rounding=ROUND_HALF_UP)


async def _acumulado_anterior_por_evento(db: AsyncSession, objeto_id: UUID, numero_medicao: int) -> dict[UUID, tuple[Decimal, Decimal]]:
    """Por evento, soma (valor bruto, quantidade líquida) das medições APROVADAS anteriores."""
    qtd_liquida = MedicaoItem.quantidade_periodo - MedicaoItem.desconto_vaos
    bruto = qtd_liquida * MedicaoItem.valor_unitario
    result = await db.execute(
        select(
            MedicaoItem.evento_id,
            func.coalesce(func.sum(bruto), 0),
            func.coalesce(func.sum(qtd_liquida), 0),
        )
        .join(Medicao, MedicaoItem.medicao_id == Medicao.id)
        .where(
            Medicao.objeto_id == objeto_id,
            Medicao.status == StatusMedicao.APROVADA,
            Medicao.numero_medicao < numero_medicao,
        )
        .group_by(MedicaoItem.evento_id)
    )
    return {row[0]: (Decimal(row[1]), Decimal(row[2])) for row in result.all()}


async def montar_boletim(db: AsyncSession, medicao: Medicao) -> dict:
    """Monta o Boletim de Medição com as colunas físico-financeiras.

    Por item: valor bruto = (qtd - desconto vãos) x preço unitário; acumulado
    anterior (medições aprovadas anteriores) + atual; saldo = total contratado -
    acumulado atual. Totais: bruto, retenção (% sobre o bruto) e valor líquido.
    """
    anteriores = await _acumulado_anterior_por_evento(db, medicao.objeto_id, medicao.numero_medicao)

    itens_out: list[dict] = []
    valor_bruto_total = Decimal("0.00")
    for item in medicao.itens:
        valor_bruto = _money(item.valor_bruto)
        valor_bruto_total += valor_bruto
        valor_ant, qtd_ant = anteriores.get(item.evento_id, (Decimal("0"), Decimal("0")))
        acumulado_anterior = _money(valor_ant)
        acumulado_atual = _money(acumulado_anterior + valor_bruto)
        evento = item.evento
        total_contratado = _money(evento.quantidade * evento.valor_unitario) if evento else Decimal("0.00")
        saldo = _money(total_contratado - acumulado_atual)

        # Colunas de quantidade (espelham a aba PLANILHA do boletim real).
        qtd_liquida = _qtd(item.quantidade_periodo - item.desconto_vaos)
        qtd_prevista = _qtd(evento.quantidade) if evento else Decimal("0.0000")
        qtd_acumulada = _qtd(qtd_ant + qtd_liquida)
        qtd_saldo = _qtd(qtd_prevista - qtd_acumulada)
        if qtd_prevista > 0:
            pct_periodo = _money(qtd_liquida / qtd_prevista * Decimal("100"))
            pct_acumulado = _money(qtd_acumulada / qtd_prevista * Decimal("100"))
        else:
            pct_periodo = Decimal("0.00")
            pct_acumulado = Decimal("0.00")

        itens_out.append({
            "id": item.id,
            "evento_id": item.evento_id,
            "descricao": evento.descricao if evento else None,
            "unidade": evento.unidade if evento else None,
            "quantidade_periodo": item.quantidade_periodo,
            "desconto_vaos": item.desconto_vaos,
            "valor_unitario": item.valor_unitario,
            "valor_bruto": valor_bruto,
            "acumulado_anterior": acumulado_anterior,
            "acumulado_atual": acumulado_atual,
            "total_contratado": total_contratado,
            "saldo": saldo,
            "observacao": item.observacao,
            "quantidade_prevista": qtd_prevista,
            "quantidade_acumulada": qtd_acumulada,
            "quantidade_saldo": qtd_saldo,
            "percentual_periodo": pct_periodo,
            "percentual_acumulado": pct_acumulado,
        })

    valor_bruto_total = _money(valor_bruto_total)
    retencao = _money(valor_bruto_total * medicao.percentual_retencao / Decimal("100"))
    faturamento_direto = _money(medicao.valor_faturamento_direto)
    valor_liquido = _money(valor_bruto_total - faturamento_direto - retencao)

    return {
        "medicao_id": medicao.id,
        "numero_medicao": medicao.numero_medicao,
        "status": medicao.status,
        "percentual_retencao": medicao.percentual_retencao,
        "itens": itens_out,
        "valor_bruto_total": valor_bruto_total,
        "valor_faturamento_direto": faturamento_direto,
        "retencao": retencao,
        "valor_liquido": valor_liquido,
    }


# ---------------------------------------------------------------------------
# Fotos invioláveis da medição (RN03)
# ---------------------------------------------------------------------------
async def upload_foto_medicao(
    db: AsyncSession,
    medicao_id: UUID,
    usuario_id: UUID,
    medicao_item_id: UUID | None,
    latitude: float | None,
    longitude: float | None,
    file: UploadFile,
) -> FotoMedicao:
    """Sobe foto da medição: hash SHA-256, carimbo do servidor e geo (RN03)."""
    medicao = await get_medicao_by_id(db, medicao_id)
    if medicao.status not in (StatusMedicao.RASCUNHO, StatusMedicao.EM_FISCALIZACAO):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fotos só podem ser anexadas em rascunho ou durante a fiscalização.")
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de arquivo inválido. Use JPEG, PNG ou WebP.")

    conteudo = await file.read()
    if len(conteudo) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo vazio.")

    hash_sha256 = hashlib.sha256(conteudo).hexdigest()
    agora = datetime.now(UTC)
    ext = "png" if file.content_type == "image/png" else "webp" if file.content_type == "image/webp" else "jpg"
    key = f"medicoes/{medicao_id}/{hash_sha256[:16]}.{ext}"

    try:
        url_storage = storage.upload_bytes(conteudo, key, file.content_type)
    except storage.StorageError:
        # Degrada para referência simbólica caso o storage esteja indisponível.
        url_storage = f"mock://{key}"

    coordenadas_wkt = None
    if latitude is not None and longitude is not None:
        coordenadas_wkt = f"SRID=4326;POINT({longitude} {latitude})"

    foto = FotoMedicao(
        medicao_id=medicao_id,
        medicao_item_id=medicao_item_id,
        enviado_por_id=usuario_id,
        url_storage=url_storage,
        filename=file.filename,
        coordenadas=coordenadas_wkt,
        hash_sha256=hash_sha256,
        carimbo_servidor=agora,
        exif_metadata={"latitude": latitude, "longitude": longitude},
        origem_camera=True,
    )
    db.add(foto)
    await db.flush()
    await db.refresh(foto)
    return foto


def _validar_fotos_por_item(medicao: Medicao) -> None:
    """Cada item com avanço (> 0) precisa de pelo menos uma foto."""
    itens_com_foto = {f.medicao_item_id for f in medicao.fotos if f.medicao_item_id}
    faltando = [
        it for it in medicao.itens
        if it.quantidade_periodo > 0 and it.id not in itens_com_foto
    ]
    if not medicao.itens:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A medição não possui itens lançados.")
    if faltando:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{len(faltando)} item(ns) com avanço estão sem foto de validação. Anexe uma foto por item executado.",
        )


async def _hash_conteudo(db_obj: Medicao) -> str:
    conteudo = json.dumps({
        "medicao_id": str(db_obj.id),
        "objeto_id": str(db_obj.objeto_id),
        "numero_medicao": db_obj.numero_medicao,
        "autor_id": str(db_obj.autor_id),
        "itens": [
            {
                "evento_id": str(it.evento_id),
                "quantidade_periodo": str(it.quantidade_periodo),
                "desconto_vaos": str(it.desconto_vaos),
                "valor_unitario": str(it.valor_unitario),
            }
            for it in db_obj.itens
        ],
        "timestamp": datetime.now(UTC).isoformat(),
    }, sort_keys=True)
    return hashlib.sha256(conteudo.encode()).hexdigest()


async def assinar_medicao(db: AsyncSession, medicao_id: UUID, usuario_id: UUID) -> Medicao:
    """
    RN01 — Assinar medição (empresa):
    1. Rascunho do próprio usuário, com itens e foto por item executado
    2. ART ativa vinculada à objeto
    3. Gera hash SHA-256 e envia para fiscalização (grava valor líquido)
    """
    db_obj = await get_medicao_by_id(db, medicao_id)

    if db_obj.empresa_usuario_id != usuario_id and db_obj.autor_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    if db_obj.status != StatusMedicao.RASCUNHO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Esta medição não pode ser assinada (status atual: {db_obj.status}).")

    _validar_fotos_por_item(db_obj)

    # RN01 — Verificar ART ativa
    art_result = await db.execute(
        select(ArtRrt).where(
            ArtRrt.objeto_id == db_obj.objeto_id,
            ArtRrt.usuario_id == usuario_id,
            ArtRrt.ativa == True,
        )
    )
    art = art_result.scalar_one_or_none()
    if not art:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível assinar a medição: você não possui uma ART/RRT ativa vinculada a esta objeto."
        )

    boletim = await montar_boletim(db, db_obj)
    now = datetime.now(UTC)
    db_obj.status = StatusMedicao.ASSINADA
    db_obj.assinada_em = now
    db_obj.enviada_em = now
    db_obj.hash_assinatura = await _hash_conteudo(db_obj)
    db_obj.valor_medido = boletim["valor_liquido"]

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def concluir_medicao_fiscal(db: AsyncSession, medicao_id: UUID, fiscal_id: UUID, observacao: str | None = None) -> Medicao:
    """Fiscal conclui (atesta) uma medição de origem própria — vai direto a APROVADA."""
    db_obj = await get_medicao_by_id(db, medicao_id)
    if db_obj.origem != OrigemMedicao.FISCAL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas medições de origem fiscal podem ser concluídas por aqui.")
    if db_obj.status != StatusMedicao.RASCUNHO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Esta medição não pode ser concluída (status atual: {db_obj.status}).")

    _validar_fotos_por_item(db_obj)

    boletim = await montar_boletim(db, db_obj)
    now = datetime.now(UTC)
    db_obj.status = StatusMedicao.APROVADA
    db_obj.assinada_em = now
    db_obj.enviada_em = now
    db_obj.hash_assinatura = await _hash_conteudo(db_obj)
    db_obj.valor_medido = boletim["valor_liquido"]
    db_obj.observacao_fiscal = observacao

    db.add(db_obj)
    await db.flush()
    await _atualizar_financeiro_objeto(db, db_obj.objeto_id)
    await db.refresh(db_obj)
    return db_obj


async def _atualizar_financeiro_objeto(db: AsyncSession, objeto_id: UUID) -> None:
    """Recalcula valor medido e saldo a medir da objeto a partir das medições aprovadas."""
    result = await db.execute(
        select(func.coalesce(func.sum(Medicao.valor_medido), 0))
        .where(Medicao.objeto_id == objeto_id, Medicao.status == StatusMedicao.APROVADA)
    )
    total_medido = _money(Decimal(result.scalar_one()))

    objeto_result = await db.execute(select(Objeto).where(Objeto.id == objeto_id))
    objeto = objeto_result.scalar_one_or_none()
    if objeto is None:
        return
    objeto.valor_medido = total_medido
    if objeto.valor_contrato is not None:
        objeto.saldo_a_medir = _money(objeto.valor_contrato - total_medido)
    db.add(objeto)
    await db.flush()


async def avaliar_medicao(db: AsyncSession, medicao_id: UUID, aprovada: bool, observacao: str | None = None) -> Medicao:
    """Fiscal aprova ou reprova a medição da empresa."""
    db_obj = await get_medicao_by_id(db, medicao_id)

    if db_obj.status not in (StatusMedicao.ASSINADA, StatusMedicao.EM_FISCALIZACAO):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A medição não está disponível para fiscalização.")

    db_obj.status = StatusMedicao.APROVADA if aprovada else StatusMedicao.REPROVADA
    db_obj.observacao_fiscal = observacao
    if aprovada:
        boletim = await montar_boletim(db, db_obj)
        db_obj.valor_medido = boletim["valor_liquido"]

    db.add(db_obj)
    await db.flush()
    if aprovada:
        await _atualizar_financeiro_objeto(db, db_obj.objeto_id)
    await db.refresh(db_obj)
    return db_obj
