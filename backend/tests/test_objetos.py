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


def test_criar_objeto_engenheiro(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70001", "senha123", Role.ENGENHEIRO)

    response = client.post("/api/objetos", json={
        "titulo": "Objeto Teste", "descricao": "Desc",
        "municipio": "Natal", "valor_contrato": 500000.00,
        "latitude": -5.7945, "longitude": -35.2110,
    }, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 201
    data = response.json()
    assert data["titulo"] == "Objeto Teste"
    assert float(data["valor_contrato"]) == 500000.00


def test_criar_objeto_empresa_bloqueado(client: TestClient, db_session):
    token = _obter_token(client, db_session, "12345678000199", "senha123", Role.EMPRESA)

    response = client.post("/api/objetos", json={
        "titulo": "Objeto Indevida", "valor_contrato": 1000.00,
    }, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_listar_objetos(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70002", "senha123", Role.ENGENHEIRO)

    client.post("/api/objetos", json={"titulo": "Objeto A", "valor_contrato": 100000.00},
                headers={"Authorization": f"Bearer {token}"})
    client.post("/api/objetos", json={"titulo": "Objeto B", "valor_contrato": 200000.00},
                headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/objetos", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    titulos = [o["titulo"] for o in data["items"]]
    assert "Objeto A" in titulos


def test_buscar_objeto_por_id(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70003", "senha123", Role.ENGENHEIRO)

    create_res = client.post("/api/objetos", json={
        "titulo": "Objeto Detalhe", "valor_contrato": 300000.00,
    }, headers={"Authorization": f"Bearer {token}"})
    objeto_id = create_res.json()["id"]

    response = client.get(f"/api/objetos/{objeto_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["titulo"] == "Objeto Detalhe"


def test_objeto_nao_encontrada(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70004", "senha123", Role.ENGENHEIRO)

    response = client.get("/api/objetos/00000000-0000-0000-0000-000000000000",
                          headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_stats_objetos(client: TestClient, db_session):
    token = _obter_token(client, db_session, "70005", "senha123", Role.ENGENHEIRO)

    client.post("/api/objetos", json={"titulo": "Objeto Stats", "valor_contrato": 100000.00},
                headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/objetos/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_listar_sem_autenticacao(client: TestClient):
    response = client.get("/api/objetos")
    assert response.status_code == 401
