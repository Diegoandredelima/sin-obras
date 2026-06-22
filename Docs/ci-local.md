# CI Local — validação sem GitHub Actions pago

O CI automático do GitHub Actions (`.github/workflows/ci.yml`) está **desativado**
para não usar o plano pago. A validação passou a ser **local**, com o mesmo
conjunto de checagens (lint + testes + typecheck + build).

A validação roda em `scripts/validate.sh` (fonte única, **não precisa de `make`**):
o **backend** (ruff + pytest) roda no container, e o **frontend** (eslint + tsc +
build) roda no **host** — o `node_modules` do container usa volume anônimo e pode
ficar desatualizado.

## Validar manualmente

Com os containers de pé (`docker compose up -d`) e as deps do frontend instaladas
(`cd frontend && npm ci` na primeira vez):

```bash
bash scripts/validate.sh    # tudo: ruff + pytest + eslint + tsc + build
# (se você tiver `make`: `make validate` chama o mesmo script)
```

## Validar automaticamente antes de cada push (recomendado)

Há um hook versionado em `.githooks/pre-push` que roda `scripts/validate.sh` e
**aborta o push** se algo falhar. Ative uma vez por clone:

```bash
git config core.hooksPath .githooks    # (ou `make hooks`)
```

- Pular a validação num push específico: `git push --no-verify`
- O hook exige os containers de pé; senão ele avisa e aborta.

> O hook fica em `.githooks/` (versionado), e não em `.git/hooks/` (não versionado).
> Por isso é necessário `make hooks` uma vez em cada máquina/clone — o
> `core.hooksPath` é configuração local do git.

## Estado da branch protection

Os checks de CI estão **não-obrigatórios** na `main` (ver
[branch-protection.md](./branch-protection.md)), então PRs não ficam bloqueados.
A `main` segue protegida contra force-push e deleção.

## Reativar o CI do GitHub Actions no futuro

Se um dia o billing do Actions for resolvido (ou o repositório virar público, onde
o Actions é gratuito):

1. Em `.github/workflows/ci.yml`, restaure os gatilhos automáticos:
   ```yaml
   on:
     push:
       branches: ["main"]
     pull_request:
       branches: ["main"]
   ```
2. Torne os checks obrigatórios de novo seguindo
   [branch-protection.md](./branch-protection.md).
