# Changelog

## 2026-11-25 — Health Check v2 (saúde + conversão)

- Corrigido: o Health Check falhava todo dia desde 12/11 (`ubuntu-latest` → 26.04, sem suporte no Playwright 1.55). Runner fixado em `ubuntu-24.04`.
- Envio simulado do formulário com interceptação: detecta formulário mock, destino do lead e webhook n8n inativo, sem gerar lead.
- Detecção de página em branco, erros de JS, LCP, pixels e evento de Lead no envio.
- Conversão real lida automaticamente do n8n (workflow descoberto pelo webhook da LP, execuções com erro = leads perdidos), além de Sheets/Supabase/Bitrix/JSON, com alarme estatístico de "conversão parada" sensível ao horário.
- Execução a cada 4 h, histórico (`data/health-history.json`), issues automáticas de alerta e de monitor quebrado, resumo opcional por IA.
- Integridade: validação antes de gravar, escrita atômica, falha confirmada em 2 checagens, trava de rede, rodada parcial sem perda, workflow restrito aos arquivos do Health Check.
- Painel refeito: veredito por LP, frescor dos dados, filtros, conversão com tendência; removida a animação que simulava uma validação.

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
