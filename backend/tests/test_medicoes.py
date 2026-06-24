"""
SIN-Obras — Testes do Boletim de Medição (físico-financeiro)
Cobre: cálculo do boletim, acumulado entre medições, foto obrigatória por item,
ART obrigatória e fluxo de origem FISCAL.
"""

from decimal import Decimal

from starlette.testclient import TestClient

from app.core.rbac import Role
from app.core.security import get_password_hash
from app.models.art_rrt import ArtRrt
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


def _criar_objeto_com_evento(db_session, quantidade=100, valor_unitario=10):
    """Cria objeto → meta → submeta → evento e devolve (objeto_id, evento_id)."""
    objeto = Objeto(titulo="Objeto Medição", valor_contrato=Decimal("1000.00"))
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
    return objeto.id, evento.id


def _criar_art(db_session, objeto_id, usuario_id):
    art = ArtRrt(numero=f"ART-{usuario_id}", tipo="ART", objeto_id=objeto_id, usuario_id=usuario_id, ativa=True)
    db_session.add(art)
    db_session.flush()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _upload_foto(client, token, medicao_id, item_id):
    return client.post(
        f"/api/empresa/medicoes/{medicao_id}/fotos",
        files={"file": ("foto.jpg", b"conteudo-binario-foto", "image/jpeg")},
        data={"medicao_item_id": str(item_id)},
        headers=_auth(token),
    )


def test_boletim_calculo_basico(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)  # contratado: 100 x 10 = 1000
    db_session.commit()
    token = _token(client, db_session, "90001000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={
            "itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}],
            "percentual_retencao": 1.5,
            "valor_faturamento_direto": 0,
        },
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text
    medicao_id = res.json()["id"]

    bol = client.get(f"/api/empresa/medicoes/{medicao_id}/boletim", headers=_auth(token))
    assert bol.status_code == 200, bol.text
    data = bol.json()

    assert float(data["valor_bruto_total"]) == 400.0  # 40 x 10
    assert float(data["retencao"]) == 6.0  # 1.5% de 400
    assert float(data["valor_liquido"]) == 394.0  # 400 - 0 - 6

    item = data["itens"][0]
    assert float(item["valor_bruto"]) == 400.0
    assert float(item["acumulado_anterior"]) == 0.0
    assert float(item["acumulado_atual"]) == 400.0
    assert float(item["total_contratado"]) == 1000.0
    assert float(item["saldo"]) == 600.0


def test_desconto_vaos(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "90002000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40, "desconto_vaos": 10}]},
        headers=_auth(token),
    )
    medicao_id = res.json()["id"]
    bol = client.get(f"/api/empresa/medicoes/{medicao_id}/boletim", headers=_auth(token)).json()
    assert float(bol["valor_bruto_total"]) == 300.0  # (40 - 10) x 10


def test_acumulado_entre_medicoes(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    fiscal_token = _token(client, db_session, "90003", Role.FISCAL)

    # Medição 1 (origem fiscal): 30 x 10 = 300, concluída → APROVADA
    res1 = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 30}]},
        headers=_auth(fiscal_token),
    )
    assert res1.status_code == 201, res1.text
    m1 = res1.json()
    _upload_foto(client, fiscal_token, m1["id"], m1["itens"][0]["id"])
    concl = client.post(f"/api/empresa/medicoes/{m1['id']}/concluir", json={}, headers=_auth(fiscal_token))
    assert concl.status_code == 200, concl.text
    assert concl.json()["status"] == "APROVADA"

    # Medição 2: acumulado anterior deve refletir os 300 aprovados
    res2 = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}]},
        headers=_auth(fiscal_token),
    )
    m2 = res2.json()
    bol = client.get(f"/api/empresa/medicoes/{m2['id']}/boletim", headers=_auth(fiscal_token)).json()
    item = bol["itens"][0]
    assert float(item["acumulado_anterior"]) == 300.0
    assert float(item["acumulado_atual"]) == 700.0  # 300 + 400
    assert float(item["saldo"]) == 300.0  # 1000 - 700


def test_assinar_sem_foto_bloqueia(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    empresa = _criar_usuario(db_session, "90004000000", Role.EMPRESA)
    _criar_art(db_session, objeto_id, empresa.id)
    db_session.commit()
    res_login = client.post("/api/auth/login", json={"matricula_cnpj": "90004000000", "senha": "senha123"})
    token = res_login.json()["access_token"]

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}]},
        headers=_auth(token),
    )
    medicao_id = res.json()["id"]

    assinar = client.post(f"/api/empresa/medicoes/{medicao_id}/assinar", json={"confirmado": True}, headers=_auth(token))
    assert assinar.status_code == 400
    assert "foto" in assinar.json()["detail"].lower()


def test_assinar_sem_art_bloqueia(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "90005000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}]},
        headers=_auth(token),
    )
    m = res.json()
    _upload_foto(client, token, m["id"], m["itens"][0]["id"])

    assinar = client.post(f"/api/empresa/medicoes/{m['id']}/assinar", json={"confirmado": True}, headers=_auth(token))
    assert assinar.status_code == 403
    assert "ART" in assinar.json()["detail"]


def test_assinar_completo(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    empresa = _criar_usuario(db_session, "90006000000", Role.EMPRESA)
    _criar_art(db_session, objeto_id, empresa.id)
    db_session.commit()
    token = client.post("/api/auth/login", json={"matricula_cnpj": "90006000000", "senha": "senha123"}).json()["access_token"]

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40}], "percentual_retencao": 1.5},
        headers=_auth(token),
    )
    m = res.json()
    _upload_foto(client, token, m["id"], m["itens"][0]["id"])

    assinar = client.post(f"/api/empresa/medicoes/{m['id']}/assinar", json={"confirmado": True}, headers=_auth(token))
    assert assinar.status_code == 200, assinar.text
    body = assinar.json()
    assert body["status"] == "ASSINADA"
    assert body["hash_assinatura"]
    assert float(body["valor_medido"]) == 394.0


def test_fiscal_cria_e_conclui(client: TestClient, db_session):
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    fiscal_token = _token(client, db_session, "90007", Role.FISCAL)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 50}]},
        headers=_auth(fiscal_token),
    )
    assert res.status_code == 201, res.text
    m = res.json()
    assert m["origem"] == "FISCAL"
    _upload_foto(client, fiscal_token, m["id"], m["itens"][0]["id"])

    concl = client.post(f"/api/empresa/medicoes/{m['id']}/concluir", json={"observacao": "Medido em campo"}, headers=_auth(fiscal_token))
    assert concl.status_code == 200, concl.text
    assert concl.json()["status"] == "APROVADA"
    assert float(concl.json()["valor_medido"]) == 500.0


def test_memoria_calculo_persistida(client: TestClient, db_session):
    """Item de medição grava as linhas de memória de cálculo (C/P × L × H × N)."""
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "90009000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={
            "itens": [{
                "evento_id": str(evento_id),
                "quantidade_periodo": 10,
                "memoria": [
                    {"descricao": "Parede A", "comprimento": 2.5, "largura": 4.0, "n_repeticoes": 1, "quantidade": 10},
                ],
            }],
        },
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text
    item = res.json()["itens"][0]
    assert len(item["memoria"]) == 1
    linha = item["memoria"][0]
    assert linha["descricao"] == "Parede A"
    assert float(linha["quantidade"]) == 10.0


def test_boletim_colunas_quantidade(client: TestClient, db_session):
    """Boletim expõe colunas de quantidade e percentual (espelha a PLANILHA)."""
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)  # previsto 100
    db_session.commit()
    token = _token(client, db_session, "90010000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes",
        json={"itens": [{"evento_id": str(evento_id), "quantidade_periodo": 40, "desconto_vaos": 10}]},
        headers=_auth(token),
    )
    medicao_id = res.json()["id"]
    bol = client.get(f"/api/empresa/medicoes/{medicao_id}/boletim", headers=_auth(token)).json()
    item = bol["itens"][0]
    assert float(item["quantidade_prevista"]) == 100.0
    assert float(item["quantidade_acumulada"]) == 30.0  # 40 - 10 líquido
    assert float(item["quantidade_saldo"]) == 70.0
    assert float(item["percentual_periodo"]) == 30.0  # 30 / 100
    assert float(item["percentual_acumulado"]) == 30.0


def test_rdo_estruturado_persistido(client: TestClient, db_session):
    """Diário grava tempo por turno, pluviometria e listas JSONB de equip./mão de obra."""
    objeto_id, _ = _criar_objeto_com_evento(db_session)
    db_session.commit()
    token = _token(client, db_session, "90011000000", Role.EMPRESA)

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/diario",
        json={
            "data_registro": "2026-06-05",
            "tempo_manha": "BOM",
            "tempo_tarde": "CHUVA_FRACA",
            "pluviometria_mm": 12.5,
            "equipamentos_lista": [{"nome": "Betoneira", "quantidade": 1}],
            "mao_de_obra": [{"funcao": "Pedreiro", "quantidade": 2}, {"funcao": "Auxiliar", "quantidade": 3}],
            "observacoes_fiscal": "Sem pendências",
        },
        headers=_auth(token),
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["tempo_manha"] == "BOM"
    assert body["tempo_tarde"] == "CHUVA_FRACA"
    assert float(body["pluviometria_mm"]) == 12.5
    assert body["mao_de_obra"][0]["funcao"] == "Pedreiro"
    assert body["equipamentos_lista"][0]["nome"] == "Betoneira"
    assert body["observacoes_fiscal"] == "Sem pendências"


def test_exportar_documentos_xls(client: TestClient, db_session):
    """Endpoints de documentos geram XLS válido (boletim, memória e RDO)."""
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    fiscal_token = _token(client, db_session, "90012", Role.FISCAL)
    XLS = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    res = client.post(
        f"/api/empresa/objetos/{objeto_id}/medicoes/fiscal",
        json={"itens": [{
            "evento_id": str(evento_id), "quantidade_periodo": 10,
            "memoria": [{"descricao": "Parede A", "comprimento": 2.5, "largura": 4, "n_repeticoes": 1, "quantidade": 10}],
        }]},
        headers=_auth(fiscal_token),
    )
    assert res.status_code == 201, res.text
    medicao_id = res.json()["id"]

    bol = client.get(f"/api/documentos/medicoes/{medicao_id}/boletim", params={"formato": "xls"}, headers=_auth(fiscal_token))
    assert bol.status_code == 200, bol.text
    assert bol.headers["content-type"].startswith(XLS)
    assert len(bol.content) > 100

    mem = client.get(f"/api/documentos/medicoes/{medicao_id}/memoria-calculo", params={"formato": "xls"}, headers=_auth(fiscal_token))
    assert mem.status_code == 200, mem.text
    assert len(mem.content) > 100

    diario = client.post(
        f"/api/empresa/objetos/{objeto_id}/diario",
        json={"data_registro": "2026-06-05", "tempo_manha": "BOM",
              "equipamentos_lista": [{"nome": "Betoneira", "quantidade": 1}],
              "mao_de_obra": [{"funcao": "Pedreiro", "quantidade": 2}]},
        headers=_auth(fiscal_token),
    )
    assert diario.status_code == 201, diario.text
    rdo = client.get(f"/api/documentos/diario/{diario.json()['id']}/rdo", params={"formato": "xls"}, headers=_auth(fiscal_token))
    assert rdo.status_code == 200, rdo.text
    assert len(rdo.content) > 100


def test_empresa_nao_conclui_medicao_fiscal(client: TestClient, db_session):
    """Endpoint de conclusão exige papel FISCAL."""
    objeto_id, evento_id = _criar_objeto_com_evento(db_session)
    db_session.commit()
    empresa_token = _token(client, db_session, "90008000000", Role.EMPRESA)

    concl = client.post(
        "/api/empresa/medicoes/00000000-0000-0000-0000-000000000000/concluir",
        json={}, headers=_auth(empresa_token),
    )
    assert concl.status_code == 403
