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

