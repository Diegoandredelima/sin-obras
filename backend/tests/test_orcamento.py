"""
SIN-Obras — Testes do módulo de Orçamento (template / banco de dados técnico).

Cobre: criação com EAP aninhada + geração de código legível, busca, critério
obrigatório, e a cópia template→objeto com BDI embutido no preço (Opção A).
"""

from decimal import Decimal

from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.usuario import Usuario


def _token(client, db_session, matricula, tipo):
    usuario = Usuario(
        nome="Test User", email=f"{matricula}@test.com", matricula_cnpj=matricula,
        senha_hash=get_password_hash("senha123"), tipo=tipo, ativo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    res = client.post("/api/auth/login", json={"matricula_cnpj": matricula, "senha": "senha123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _payload_orcamento(bdi=20):
    return {
        "titulo": "Orçamento Padrão - Escola Modelo",
        "data_base": "2026-05-01",
        "bdi_percentual": bdi,
        "descricao": "Escopo de teste",
        "metas": [
            {
                "descricao": "1.0 - Superestrutura",
                "ordem": 1,
                "submetas": [
                    {
                        "descricao": "1.1 - Alvenaria",
                        "eventos": [
                            {
                                "codigo_referencia": "SINAPI 87529",
                                "descricao": "Alvenaria de vedação bloco cerâmico 9cm",
                                "unidade": "m2",
                                "quantidade": 100,
                                "valor_unitario": 50,  # custo direto
                                "criterio_medicao": "Área líquida, descontando vãos.",
                                "memoria": [
                                    {"descricao": "Parede A", "comprimento": 10, "altura": 10, "n_repeticoes": 1, "quantidade": 100},
                                ],
                            }
                        ],
                    }
                ],
            }
        ],
    }


def test_criar_orcamento_gera_codigo_e_eap(client: TestClient, db_session):
    token = _token(client, db_session, "92001", Role.APOIO_N2)
    res = client.post("/api/orcamentos", json=_payload_orcamento(), headers=_auth(token))
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["codigo"].startswith("ORC-")
    assert len(data["metas"]) == 1
    ev = data["metas"][0]["submetas"][0]["eventos"][0]
    assert ev["codigo_referencia"] == "SINAPI 87529"
    assert ev["criterio_medicao"].startswith("Área líquida")
    # No template, valor_total = custo direto (sem BDI): 100 × 50 = 5000.
    assert float(ev["valor_total"]) == 5000.0
    assert len(ev["memoria"]) == 1


def test_criterio_medicao_obrigatorio(client: TestClient, db_session):
    token = _token(client, db_session, "92002", Role.APOIO_N2)
    payload = _payload_orcamento()
    del payload["metas"][0]["submetas"][0]["eventos"][0]["criterio_medicao"]
    res = client.post("/api/orcamentos", json=payload, headers=_auth(token))
    assert res.status_code == 422, res.text


def test_busca_orcamento_por_codigo_e_titulo(client: TestClient, db_session):
    token = _token(client, db_session, "92003", Role.APOIO_N2)
    criado = client.post("/api/orcamentos", json=_payload_orcamento(), headers=_auth(token)).json()

    por_codigo = client.get(f"/api/orcamentos?q={criado['codigo']}", headers=_auth(token))
    assert por_codigo.status_code == 200
    assert any(o["id"] == criado["id"] for o in por_codigo.json())

    por_titulo = client.get("/api/orcamentos?q=Escola Modelo", headers=_auth(token))
    assert any(o["id"] == criado["id"] for o in por_titulo.json())


def test_vincular_orcamento_ao_objeto_copia_com_bdi(client: TestClient, db_session):
    token = _token(client, db_session, "92004", Role.APOIO_N2)
    orc = client.post("/api/orcamentos", json=_payload_orcamento(bdi=20), headers=_auth(token)).json()

    # Cadastra o objeto vinculando o orçamento → copia a EAP com BDI embutido.
    res_obj = client.post(
        "/api/objetos",
        json={
            "titulo": "Escola Cidade Nova",
            "descricao": "Objeto vinculado a orçamento de teste.",
            "municipio": "Natal",
            "status": "PLANEJADA",
            "orcamento_id": orc["id"],
        },
        headers=_auth(token),
    )
    assert res_obj.status_code == 201, res_obj.text
    objeto = res_obj.json()
    assert objeto["orcamento_id"] == orc["id"]

    # A EAP foi copiada para o objeto; o preço unitário tem BDI (50 × 1.20 = 60).
    metas = client.get(f"/api/cronograma/objetos/{objeto['id']}/metas", headers=_auth(token)).json()
    assert len(metas) == 1
    ev = metas[0]["submetas"][0]["eventos"][0]
    assert float(ev["valor_unitario"]) == 60.0
    assert float(ev["valor_total"]) == 6000.0  # 100 × 60
    assert ev["criterio_medicao"].startswith("Área líquida")

    # O orçamento-template permanece com o custo direto (cópia congelada).
    orc_full = client.get(f"/api/orcamentos/{orc['id']}", headers=_auth(token)).json()
    ev_tpl = orc_full["metas"][0]["submetas"][0]["eventos"][0]
    assert float(ev_tpl["valor_unitario"]) == 50.0


def test_codigo_sequencial(client: TestClient, db_session):
    token = _token(client, db_session, "92005", Role.APOIO_N2)
    c1 = client.post("/api/orcamentos", json=_payload_orcamento(), headers=_auth(token)).json()
    c2 = client.post("/api/orcamentos", json=_payload_orcamento(), headers=_auth(token)).json()
    assert c1["codigo"] != c2["codigo"]
