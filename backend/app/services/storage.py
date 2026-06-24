"""
SIN-Obras — Serviço de armazenamento de objetos (MinIO / S3)

Wrapper fino sobre boto3 (mesma lib já usada no health check de `main.py`).
Mantém o bucket configurado em `settings.MINIO_BUCKET` e expõe `upload_bytes`,
usado pelo upload de fotos invioláveis das medições.

Degradação graciosa: se o MinIO estiver indisponível, levanta `StorageError`
para o serviço chamador decidir o tratamento (ex.: 503).
"""

from functools import lru_cache

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import ClientError

from app.core import settings


class StorageError(RuntimeError):
    """Falha ao comunicar com o storage de objetos."""


@lru_cache(maxsize=1)
def _client():
    return boto3.client(
        "s3",
        endpoint_url=f"http{'s' if settings.MINIO_USE_SSL else ''}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ROOT_USER,
        aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
        config=BotoConfig(signature_version="s3v4"),
    )


def _ensure_bucket(s3) -> None:
    bucket = settings.MINIO_BUCKET
    try:
        s3.head_bucket(Bucket=bucket)
    except ClientError:
        try:
            s3.create_bucket(Bucket=bucket)
        except ClientError as exc:  # noqa: B904
            raise StorageError(f"Não foi possível criar o bucket '{bucket}': {exc}")


def upload_bytes(conteudo: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    """Envia bytes para o storage e retorna a URL pública (ou s3://) do objeto.

    `key` é o caminho do objeto dentro do bucket (ex.: ``medicoes/<id>/<hash>.jpg``).
    """
    s3 = _client()
    _ensure_bucket(s3)
    try:
        s3.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=key,
            Body=conteudo,
            ContentType=content_type,
        )
    except ClientError as exc:  # noqa: B904
        raise StorageError(f"Falha no upload do objeto '{key}': {exc}")

    scheme = "https" if settings.MINIO_USE_SSL else "http"
    return f"{scheme}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{key}"
