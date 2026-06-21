# Branch Protection — `main`

> Configuração de proteção da branch `main` no GitHub (`Diegoandredelima/sin-obras`).
> Aplicada via API com o GitHub CLI (`gh`).

## Estado atual

| Regra | Valor |
|---|---|
| Checks obrigatórios (`backend-tests` / `frontend-lint-build`) | ❌ **não-obrigatórios (temporário)** |
| `strict` (branch atualizada antes do merge) | — (só vale quando os checks são obrigatórios) |
| Resolução de conversas obrigatória | ✅ sim |
| Force-push na `main` | ❌ bloqueado |
| Deleção da `main` | ❌ bloqueada |
| `enforce_admins` | ❌ desligado (admin pode mergear/override) |
| Reviews obrigatórios | nenhum |

**Por que os checks estão não-obrigatórios:** o GitHub Actions da conta está
**bloqueado por uma pendência de cobrança** (*"The job was not started because your
account is locked due to a billing issue"*). Com os checks obrigatórios, nenhum PR
mergearia (os jobs nunca passam). O CI continua rodando e reportando nos PRs — só
não bloqueia o merge.

## Quando o billing for resolvido — reativar os checks obrigatórios

Settings → Billing no GitHub, depois rode:

```bash
gh api -X PUT repos/Diegoandredelima/sin-obras/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["backend-tests", "frontend-lint-build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

## Voltar a afrouxar os checks (deixar não-obrigatórios)

```bash
gh api -X PUT repos/Diegoandredelima/sin-obras/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

## Conferir o estado atual

```bash
gh api repos/Diegoandredelima/sin-obras/branches/main/protection \
  --jq '{required_status_checks, conversation_resolution: .required_conversation_resolution.enabled, force_pushes: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled, enforce_admins: .enforce_admins.enabled}'
```

## Notas

- O `PUT .../protection` **substitui** a configuração inteira — sempre envie o
  objeto completo (todos os campos), não só o que muda.
- Os nomes dos checks (`backend-tests`, `frontend-lint-build`) são os nomes dos
  jobs em `.github/workflows/ci.yml`. Se renomear um job, atualize os `contexts`.
- `enforce_admins: false` é proposital: garante que um admin consiga mergear caso
  o CI fique indisponível (ex.: billing). Para travar inclusive admins, mude para
  `true`.
- Requer permissão de admin no repositório e um token com escopo `repo`.
