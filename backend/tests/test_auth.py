from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.usuario import Usuario


def _criar_usuario(db_session, nome, email, matricula, senha, tipo):
    usuario = Usuario(
        nome=nome,
        email=email,
        matricula_cnpj=matricula,
        senha_hash=get_password_hash(senha),
        tipo=tipo,
        ativo=True,
    )
    db_session.add(usuario)
    db_session.flush()
    return usuario


def test_login_sucesso(client: TestClient, db_session):
    _criar_usuario(db_session, "Fiscal Teste", "fiscal@test.com", "99999", "senha123", Role.FISCAL)
    db_session.commit()

    response = client.post("/api/auth/login", json={
        "matricula_cnpj": "99999", "senha": "senha123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_credenciais_invalidas(client: TestClient, db_session):
    _criar_usuario(db_session, "Fiscal", "fiscal@test.com", "11111", "correta", Role.FISCAL)
    db_session.commit()

    response = client.post("/api/auth/login", json={
        "matricula_cnpj": "11111", "senha": "errada",
    })
    assert response.status_code == 401


def test_me_sem_token(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_autenticado(client: TestClient, db_session):
    _criar_usuario(db_session, "Eng Teste", "eng@test.com", "33333", "senha123", Role.ENGENHEIRO)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={
        "matricula_cnpj": "33333", "senha": "senha123",
    })
    token = login_res.json()["access_token"]

    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["usuario"]["nome"] == "Eng Teste"


def test_refresh_token(client: TestClient, db_session):
    _criar_usuario(db_session, "Coord", "coord@test.com", "44444", "senha123", Role.COORDENADOR)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={
        "matricula_cnpj": "44444", "senha": "senha123",
    })
    refresh_token = login_res.json()["refresh_token"]

    response = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()
