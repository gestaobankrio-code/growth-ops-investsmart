# Changelog

## 2026-08-18 — v4 definitiva

- Removido uso de dados de demonstração como fonte inicial.
- Removido Bitrix da base padrão para evitar reaparecimento após refresh.
- Fonte oficial passa a ser exclusivamente `data/registros.json`.
- Arquivar passa a ser ação persistente via Issue + GitHub Actions.
- Excluir passa a ser ação oficial suportada pela automação.
- Painel deixa claro que a confirmação no GitHub é necessária para salvar no repositório.
- Workflow único `Processar Growth Ops` processa Issues com bloco `GROWTH_OPS_JSON`.
- Regeneração automática de inventário, pendências, documentação e CSVs.
- Inclusão de auditoria em `data/auditoria.json`.
