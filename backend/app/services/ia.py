"""
SIN-Obras — Assistente de IA (RF21)

Analisa os textos do Diário de Obras com o Claude (Anthropic) e retorna alertas
de risco em linguagem simples, cada um com o trecho originador.

Projetado com fallback gracioso: se a IA estiver desabilitada, sem chave de API
ou se o SDK não estiver instalado, retorna lista vazia sem quebrar o fluxo.
"""
import json
import logging

from app.core import settings

logger = logging.getLogger("sinobras.ia")

# Esquema de saída estruturada (JSON) — RF21: alertas com trecho originador.
_SCHEMA = {
    "type": "object",
    "properties": {
        "alertas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string", "description": "Resumo curto do risco"},
                    "gravidade": {"type": "string", "enum": ["BAIXA", "MEDIA", "ALTA", "CRITICA"]},
                    "descricao": {"type": "string", "description": "Explicação em linguagem simples"},
                    "trecho": {"type": "string", "description": "Trecho do diário que originou o alerta"},
                },
                "required": ["titulo", "gravidade", "descricao", "trecho"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["alertas"],
    "additionalProperties": False,
}

_SYSTEM = (
    "Você é um analista técnico da fiscalização de obras públicas da SIN-RN. "
    "Analise os registros do Diário de Obras e identifique inconsistências e "
    "riscos ocultos (ex.: menção repetida de chuva como justificativa de atraso, "
    "divergência entre equipe declarada e atividades, paralisações não formalizadas, "
    "equipamentos incompatíveis com os serviços). "
    "Para cada risco, gere um alerta em linguagem simples com o trecho originador. "
    "Se não houver riscos relevantes, retorne uma lista vazia. Responda em português."
)


async def analisar_diarios(textos: list[str]) -> list[dict]:
    """Analisa os textos do Diário de Obras e retorna alertas de risco.

    Retorna lista vazia em caso de IA desabilitada, sem chave, sem texto, SDK
    ausente ou falha de chamada (best-effort).
    """
    conteudo = "\n\n".join(t.strip() for t in textos if t and t.strip())
    if not settings.IA_ENABLED or not settings.ANTHROPIC_API_KEY or not conteudo:
        logger.debug("Assistente de IA desabilitado ou sem conteúdo — retornando vazio.")
        return []

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        logger.warning("SDK 'anthropic' não instalado — assistente de IA indisponível.")
        return []

    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        response = await client.messages.create(
            model=settings.IA_MODEL,
            max_tokens=4096,
            system=_SYSTEM,
            output_config={"format": {"type": "json_schema", "schema": _SCHEMA}},
            messages=[{
                "role": "user",
                "content": f"Registros do Diário de Obras a analisar:\n\n{conteudo}",
            }],
        )
    except Exception as exc:  # noqa: BLE001 — best-effort, não pode quebrar o fluxo
        logger.warning("Falha ao chamar o assistente de IA: %s", exc)
        return []

    # output_config.format garante que o primeiro bloco de texto é JSON válido.
    texto = next((b.text for b in response.content if b.type == "text"), "")
    try:
        data = json.loads(texto)
        return data.get("alertas", [])
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Resposta da IA não pôde ser interpretada como JSON.")
        return []
