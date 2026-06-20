from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.usuario import Usuario


def _criar_usuario(db_session, nome, email, matricula, senha, tipo):
    usuario = Usuario(
        nome=nome, email=email, matricula_cnpj=matricula,
        senha_hash=get_password_hash(senha), tipo=tipo, ativo=True,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


def _obter_token(client, db_session, matricula, senha, tipo):
    _criar_usuario(db_session, "Test User", f"{matricula}@test.com", matricula, senha, tipo)
    db_session.commit()
    res = client.post("/api/auth/login", json={"matricula_cnpj": matricula, "senha": senha})
    return res.json()["access_token"]


def test_criar_obra_engenheiro(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70001", "senha123", Role.ENGENHEIRO)

    response = client.post("/api/obras", json={
        "titulo": "Obra Teste", "descricao": "Desc",
        "municipio": "Natal", "valor_contrato": 500000.00,
        "latitude": -5.7945, "longitude": -35.2110,
    }, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 201
    data = response.json()
    assert data["titulo"] == "Obra Teste"
    assert float(data["valor_contrato"]) == 500000.00


def test_criar_obra_empresa_bloqueado(client: TestClient, db_session):
    token = _obter_token(client, db_session, "12345678000199", "senha123", Role.EMPRESA)

    response = client.post("/api/obras", json={
        "titulo": "Obra Indevida", "valor_contrato": 1000.00,
    }, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_listar_obras(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70002", "senha123", Role.ENGENHEIRO)

    client.post("/api/obras", json={"titulo": "Obra A", "valor_contrato": 100000.00},
                headers={"Authorization": f"Bearer {token}"})
    client.post("/api/obras", json={"titulo": "Obra B", "valor_contrato": 200000.00},
                headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/obras", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    titulos = [o["titulo"] for o in data["items"]]
    assert "Obra A" in titulos


def test_buscar_obra_por_id(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70003", "senha123", Role.ENGENHEIRO)

    create_res = client.post("/api/obras", json={
        "titulo": "Obra Detalhe", "valor_contrato": 300000.00,
    }, headers={"Authorization": f"Bearer {token}"})
    obra_id = create_res.json()["id"]

    response = client.get(f"/api/obras/{obra_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["titulo"] == "Obra Detalhe"


def test_obra_nao_encontrada(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70004", "senha123", Role.ENGENHEIRO)

    response = client.get("/api/obras/00000000-0000-0000-0000-000000000000",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_stats_obras(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70005", "senha123", Role.ENGENHEIRO)

    client.post("/api/obras", json={"titulo": "Obra Stats", "valor_contrato": 100000.00},
                headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/obras/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_listar_sem_autenticacao(client: TestClient):
    response = client.get("/api/obras")
    assert response.status_code == 401
