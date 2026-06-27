from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.objeto import Evento, Meta, Objeto, Submeta
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
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]

def _criar_objeto_com_evento(db_session):
    from decimal import Decimal
    objeto = Objeto(titulo="Objeto Cronograma", valor_contrato=Decimal("1000.00"))
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
        quantidade=Decimal("100"), unidade="m2", valor_unitario=Decimal("10"),
    )
    db_session.add(evento)
    db_session.flush()
    return str(objeto.id), str(evento.id)

def test_cronograma_versionamento(client: TestClient, db_session):
    token = _token(client, db_session, "11111", Role.APOIO_N2)
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}

    payload_versao = {
        "justificativa": "Primeira versão (Linha de base)",
        "parcelas": [
            {"evento_id": evento_id, "periodo_numero": 1, "quantidade_prevista": 50},
            {"evento_id": evento_id, "periodo_numero": 2, "quantidade_prevista": 50}
        ]
    }

    response_versao = client.post(
        f"/api/cronograma/objetos/{objeto_id}/versoes",
        json=payload_versao,
        headers=headers
    )
    assert response_versao.status_code == 201
    versao = response_versao.json()
    assert versao["numero_versao"] == 1
    assert versao["linha_de_base"] == True
    assert versao["ativa"] == True
    assert versao["total_periodos"] == 2
    assert len(versao["parcelas"]) == 2

    response_ativa = client.get(
        f"/api/cronograma/objetos/{objeto_id}/versoes/ativa",
        headers=headers
    )
    assert response_ativa.status_code == 200
    assert response_ativa.json()["id"] == versao["id"]

    response_previsao = client.get(
        f"/api/cronograma/objetos/{objeto_id}/previsao?periodo=1",
        headers=headers
    )
    assert response_previsao.status_code == 200
    previsao = response_previsao.json()
    assert previsao["periodo"] == 1
    assert len(previsao["parcelas"]) == 1
    assert float(previsao["parcelas"][0]["quantidade_prevista"]) == 50.0

    # Lock: uma medição EM ANDAMENTO (ASSINADA) bloqueia o replanejamento.
    import uuid

    from app.models.portal import Medicao, StatusMedicao

    med = Medicao(
        objeto_id=uuid.UUID(objeto_id),
        numero_medicao=1,
        status=StatusMedicao.ASSINADA,
    )
    db_session.add(med)
    db_session.commit()

    response_versao_fail = client.post(
        f"/api/cronograma/objetos/{objeto_id}/versoes",
        json=payload_versao,
        headers=headers
    )
    assert response_versao_fail.status_code == 409
    assert "Não é possível alterar o cronograma" in response_versao_fail.json()["detail"]


def test_cronograma_lock_ignora_medicao_finalizada(client: TestClient, db_session):
    """Medições finalizadas (APROVADA) NÃO bloqueiam o replanejamento (Passo 5)."""
    import uuid

    from app.models.portal import Medicao, StatusMedicao

    token = _token(client, db_session, "22222", Role.APOIO_N2)
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)

    med = Medicao(
        objeto_id=uuid.UUID(objeto_id),
        numero_medicao=1,
        status=StatusMedicao.APROVADA,
    )
    db_session.add(med)
    db_session.commit()

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "justificativa": "Replanejamento após aditivo",
        "parcelas": [
            {"evento_id": evento_id, "periodo_numero": 1, "quantidade_prevista": 100},
        ],
    }
    response = client.post(
        f"/api/cronograma/objetos/{objeto_id}/versoes",
        json=payload,
        headers=headers,
    )
    assert response.status_code == 201, response.text
    assert response.json()["linha_de_base"] is True
