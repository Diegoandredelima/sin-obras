"""
SIN-Obras — Testes de Relatórios (progresso por meta do cronograma)
"""

from decimal import Decimal

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
    return res.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _criar_objeto_com_meta_evento(db_session, quantidade=100, valor_unitario=10):
    """Objeto → Meta → Submeta → Evento; devolve (objeto_id, evento_id)."""
    objeto = Objeto(titulo="Objeto Relatório", valor_contrato=Decimal("1000.00"))
    db_session.add(objeto)
    db_session.flush()
    meta = Meta(objeto_id=objeto.id, descricao="Fundação", ordem=1)
    db_session.add(meta)
    db_session.flush()
    submeta = Submeta(meta_id=meta.id, descricao="Mês 1")
    db_session.add(submeta)
    db_session.flush()
    evento = Evento(
        submeta_id=submeta.id, descricao="Sapatas",
        quantidade=Decimal(quantidade), unidade="m3", valor_unitario=Decimal(valor_unitario),
    )
    db_session.add(evento)
    db_session.flush()
    return objeto.id, evento.id


def _upload_foto(client, token, medicao_id, item_id):
    return client.post(
        f"/api/empresa/medicoes/{medicao_id}/fotos",
        files={"file": ("foto.jpg", b"conteudo-binario-foto", "image/jpeg")},
        data={"medicao_item_id": str(item_id)},
        headers=_auth(token),
    )


def test_relatorio_cronograma_planejado_vs_realizado(client: TestClient, db_session):
    """Planejado = soma dos eventos; realizado = medições aprovadas por meta."""
    objeto_id, evento_id = _criar_objeto_com_meta_evento(db_session)  # planejado: 100 x 10 = 1000
    db_session.commit()
    token = _token(client, db_session, "91001000000", Role.APOIO_N2)

    # Medição fiscal de 60 → 600, concluída (APROVADA)
    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 60}]},
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text
    m = res.json()
    _upload_foto(client, token, m["id"], m["itens"][0]["id"])
    concl = client.post(f"/api/empresa/medicoes/{m['id']}/concluir", json={}, headers=_auth(token))
    assert concl.status_code == 200, concl.text

    rel = client.get(f"/api/relatorios/cronograma/{objeto_id}", headers=_auth(token))
    assert rel.status_code == 200, rel.text
    data = rel.json()

    assert float(data["valor_planejado_total"]) == 1000.0
    assert float(data["valor_realizado_total"]) == 600.0
    assert float(data["percentual_total"]) == 60.0

    assert len(data["metas"]) == 1
    meta = data["metas"][0]
    assert meta["descricao"] == "Fundação"
    assert float(meta["valor_planejado"]) == 1000.0
    assert float(meta["valor_realizado"]) == 600.0
    assert float(meta["percentual"]) == 60.0


def test_relatorio_cronograma_sem_medicao(client: TestClient, db_session):
    """Sem medições aprovadas, realizado é zero e percentual 0."""
    objeto_id, _ = _criar_objeto_com_meta_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "91002000000", Role.APOIO_N1)  # N1 pode consultar relatório

    rel = client.get(f"/api/relatorios/cronograma/{objeto_id}", headers=_auth(token))
    assert rel.status_code == 200, rel.text
    data = rel.json()
    assert float(data["valor_planejado_total"]) == 1000.0
    assert float(data["valor_realizado_total"]) == 0.0
    assert float(data["percentual_total"]) == 0.0


def test_relatorio_fotos_por_objeto(client: TestClient, db_session):
    """Compila fotos de todas as medições do objeto, com a descrição do item."""
    objeto_id, evento_id = _criar_objeto_com_meta_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "91003000000", Role.APOIO_N2)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 20}]},
        headers=_auth(token),
    )
    m = res.json()
    foto = _upload_foto(client, token, m["id"], m["itens"][0]["id"])
    assert foto.status_code == 201, foto.text

    rel = client.get(f"/api/relatorios/fotos/{objeto_id}", headers=_auth(token))
    assert rel.status_code == 200, rel.text
    data = rel.json()
    assert data["total_fotos"] == 1
    assert len(data["medicoes"]) == 1
    grupo = data["medicoes"][0]
    assert grupo["numero_medicao"] == m["numero_medicao"]
    assert grupo["fotos"][0]["item_descricao"] == "Sapatas"


def test_relatorio_fotos_objeto_sem_fotos(client: TestClient, db_session):
    """Objeto sem fotos retorna lista vazia e total zero."""
    objeto_id, _ = _criar_objeto_com_meta_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "91004000000", Role.APOIO_N1)

    rel = client.get(f"/api/relatorios/fotos/{objeto_id}", headers=_auth(token))
    assert rel.status_code == 200, rel.text
    data = rel.json()
    assert data["total_fotos"] == 0
    assert data["medicoes"] == []
