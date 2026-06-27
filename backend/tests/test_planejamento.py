"""
SIN-Obras — Testes do Plano de Gestão e Medição.

Cobre as duas decisões de arquitetura e os gaps relacionados:
  - Decisão 1: trava de quantitativo NO LANÇAMENTO (acima do contratado / negativa),
    configurável por contrato.
  - Decisão 2: snapshot do orçamento ao congelar a versão (Planejamento) e trava de
    edição do orçamento (evento) com medição em andamento.
  - Memória de cálculo contratada no evento.
"""

from decimal import Decimal

from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.objeto import Contrato, Evento, Meta, Objeto, Submeta
from app.models.usuario import Usuario


def _criar_usuario(db_session, matricula, tipo):
    usuario = Usuario(
        nome="Test User", email=f"{matricula}@test.com", matricula_cnpj=matricula,
        senha_hash=get_password_hash("senha123"), tipo=tipo, ativo=True,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


def _token(client, db_session, matricula, tipo):
    _criar_usuario(db_session, matricula, tipo)
    db_session.commit()
    res = client.post("/api/auth/login", json={"matricula_cnpj": matricula, "senha": "senha123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _criar_objeto_com_evento(db_session, quantidade=100, valor_unitario=10, contrato=None):
    objeto = Objeto(titulo="Objeto Planejamento", valor_contrato=Decimal("1000.00"))
    if contrato is not None:
        objeto.contrato_id = contrato.id
    db_session.add(objeto)
    db_session.flush()
    meta = Meta(objeto_id=objeto.id, descricao="Meta 1")
    db_session.add(meta)
    db_session.flush()
    submeta = Submeta(meta_id=meta.id, descricao="Submeta 1")
    db_session.add(submeta)
    db_session.flush()
    evento = Evento(
        submeta_id=submeta.id, descricao="Alvenaria",
        quantidade=Decimal(quantidade), unidade="m2", valor_unitario=Decimal(valor_unitario),
    )
    db_session.add(evento)
    db_session.flush()
    return objeto.id, submeta.id, evento.id


def _criar_contrato(db_session, numero, bloquear_acima=True, bloquear_negativa=True):
    contrato = Contrato(
        numero_processo=f"PROC-{numero}", numero_contrato=f"CT-{numero}",
        valor_global=Decimal("1000.00"),
        bloquear_acima_contratado=bloquear_acima,
        bloquear_quantidade_negativa=bloquear_negativa,
    )
    db_session.add(contrato)
    db_session.flush()
    return contrato


# ---------------------------------------------------------------------------
# Decisão 1 — trava no lançamento
# ---------------------------------------------------------------------------
def test_trava_acima_do_contratado_bloqueia_lancamento(client: TestClient, db_session):
    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session)  # contratado 100
    db_session.commit()
    token = _token(client, db_session, "91001000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 150}]},
        headers=_auth(token),
    )
    assert res.status_code == 422, res.text
    assert "saldo contratado" in res.json()["detail"]


def test_trava_quantidade_negativa_bloqueia(client: TestClient, db_session):
    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "91002000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": -5}]},
        headers=_auth(token),
    )
    # Rejeitada já no schema (ge=0); a trava de serviço é rede de segurança.
    assert res.status_code == 422, res.text


def test_trava_configuravel_permite_acima_quando_desligada(client: TestClient, db_session):
    contrato = _criar_contrato(db_session, "91003", bloquear_acima=False)
    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session, contrato=contrato)
    db_session.commit()
    token = _token(client, db_session, "91003000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={
            "itens": [{"evento_id": str(evento_id), "quantidade_periodo": 150}],
            "contrato_id": str(contrato.id),
        },
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text


def test_dentro_do_contratado_passa(client: TestClient, db_session):
    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "91004000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 80}]},
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text


# ---------------------------------------------------------------------------
# Decisão 2 — snapshot do orçamento e trava de edição
# ---------------------------------------------------------------------------
def test_snapshot_congela_orcamento_na_versao(client: TestClient, db_session):
    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session, quantidade=100, valor_unitario=10)
    db_session.commit()
    apoio_token = _token(client, db_session, "91005", Role.APOIO_N2)

    # V01 fotografa o orçamento (100 x 10).
    res_v = client.post(
        f"/api/cronograma/objetos/{objeto_id}/versoes",
        json={"justificativa": "Linha de base", "parcelas": [
            {"evento_id": str(evento_id), "periodo_numero": 1, "quantidade_prevista": 100},
        ]},
        headers=_auth(apoio_token),
    )
    assert res_v.status_code == 201, res_v.text
    parcela = res_v.json()["parcelas"][0]
    assert float(parcela["quantidade_contratada"]) == 100.0
    assert float(parcela["valor_unitario"]) == 10.0

    # Edita a linha viva do evento (sem medição aberta): NÃO deve mudar o snapshot.
    res_e = client.put(
        f"/api/cronograma/eventos/{evento_id}",
        json={"descricao": "Alvenaria", "quantidade": 999, "unidade": "m2", "valor_unitario": 10},
        headers=_auth(apoio_token),
    )
    assert res_e.status_code == 200, res_e.text

    # O boletim deve usar o contratado do snapshot (1000), não 999 x 10.
    empresa_token = _token(client, db_session, "91005000000", Role.EMPRESA)
    res_m = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}]},
        headers=_auth(empresa_token),
    )
    assert res_m.status_code == 201, res_m.text
    medicao_id = res_m.json()["id"]
    bol = client.get(f"/api/empresa/medicoes/{medicao_id}/boletim", headers=_auth(empresa_token)).json()
    assert float(bol["itens"][0]["total_contratado"]) == 1000.0


def test_editar_evento_com_medicao_aberta_bloqueia(client: TestClient, db_session):
    from app.models.portal import Medicao, StatusMedicao

    objeto_id, _submeta_id, evento_id = _criar_objeto_com_evento(db_session)
    med = Medicao(objeto_id=objeto_id, numero_medicao=1, status=StatusMedicao.ASSINADA)
    db_session.add(med)
    db_session.commit()
    apoio_token = _token(client, db_session, "91006", Role.APOIO_N2)

    res = client.put(
        f"/api/cronograma/eventos/{evento_id}",
        json={"descricao": "Alvenaria", "quantidade": 50, "unidade": "m2", "valor_unitario": 10},
        headers=_auth(apoio_token),
    )
    assert res.status_code == 409, res.text
    assert "orçamento" in res.json()["detail"]


# ---------------------------------------------------------------------------
# Memória de cálculo contratada
# ---------------------------------------------------------------------------
def test_memoria_contratada_persistida(client: TestClient, db_session):
    _objeto_id, submeta_id, _evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    apoio_token = _token(client, db_session, "91007", Role.APOIO_N2)

    res = client.post(
        f"/api/cronograma/submetas/{submeta_id}/eventos",
        json={
            "submeta_id": str(submeta_id),
            "descricao": "Piso cerâmico", "quantidade": 30, "unidade": "m2", "valor_unitario": 55,
            "memoria": [
                {"descricao": "Sala", "comprimento": 5, "largura": 4, "n_repeticoes": 1, "quantidade": 20},
                {"descricao": "Quarto", "comprimento": 5, "largura": 2, "n_repeticoes": 1, "quantidade": 10},
            ],
        },
        headers=_auth(apoio_token),
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert len(data["memoria"]) == 2
    assert float(data["memoria"][0]["quantidade"]) == 20.0
