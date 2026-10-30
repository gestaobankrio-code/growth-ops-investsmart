# Automação Growth Ops

## Princípio definitivo

GitHub Pages não grava diretamente no repositório pelo navegador para evitar exposição de token. A persistência oficial acontece por GitHub Issues + GitHub Actions.

## Fluxo persistente

```txt
Painel GitHub Pages
↓
Issue estruturada com bloco GROWTH_OPS_JSON
↓
GitHub Actions: Processar Growth Ops
↓
data/registros.json atualizado
↓
Inventário, pendências, documentação e CSVs regenerados
↓
Issue comentada e fechada
```

## Ações suportadas

- Criar
- Atualizar
- Validar
- Reprovar
- Arquivar
- Excluir

## Arquivar vs Excluir

- `Arquivar`: mantém o registro no JSON com status `Arquivado`, mas ele sai da visão principal do painel.
- `Excluir`: remove o registro de `data/registros.json` e registra a ação em `data/auditoria.json`.


## Sincronização Automática Lovable ↔ Growth Ops

Além da persistência por Issues, o Growth Ops conta com sincronização contínua e em tempo real com os projetos Lovable:

```txt
Projeto Lovable (edição/criação)
↓
GitHub Git Sync (push no repositório da LP)
↓
GitHub Actions (notify-growth-ops.yml dispara repository_dispatch)
↓
GitHub Actions Central (sync-lovable-growth-ops.yml)
↓
data/lovable-projects.json (manifesto atualizado por lovableProjectId)
↓
data/registros.json (upsert com merge conservador)
↓
docs/landing-pages/<id>.md (documentação individual atualizada)
↓
Validação estrita pré-commit (zero secrets, IDs únicos, panel safe)
↓
Commit automático seguro ([skip ci])
```

Consulte `docs/automacao-sincronizacao-lovable.md` para o guia completo de implementação e modelo de workflow.
