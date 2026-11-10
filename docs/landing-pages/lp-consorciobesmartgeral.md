> **ID canônico no Growth Ops:** `lp-consorciobesmartgeral`
> **ID original da auditoria Lovable:** `lp-consorciobesmartgeral`
> **Fonte:** auditoria estática do workspace Lovable em 30/10/2026; sem submissão de formulários em produção.

# Auditoria técnica: Consorciobesmartgeral

- **ID de documentação:** `lp-consorciobesmartgeral`
- **Project ID Lovable:** `a1c0456b-f298-4e40-8f5b-b4503cbcac09`
- **URL registrada:** https://consorciobesmartgeral.lovable.app
- **Status de publicação:** URL pública registrada no relatório anterior; publicação atual A VALIDAR
- **Classificação no relatório anterior:** LP Consórcio
- **Data da auditoria de referência:** 30/10/2026
- **Limite desta documentação:** auditoria estática baseada no relatório anterior. Não houve submissão de formulário nem confirmação de gravação em produção.

## 1. Identificação e relação de versões

- **Campanha/família:** BeSmart
- **Variação/relação:** Projeto individual; versionamento A VALIDAR
- **Objetivo e público:** A VALIDAR no conteúdo do projeto.
- **Preview Lovable:** A VALIDAR; project ID: `a1c0456b-f298-4e40-8f5b-b4503cbcac09`
- **Domínio próprio, rotas e branch:** A VALIDAR
- **Projeto provavelmente oficial:** A VALIDAR. Não inferir oficialidade somente pelo nome.
- **Recomendação de arquivamento:** não arquivar/despublicar sem validação humana. 

## 2. Tecnologia e arquivos críticos

- Framework, React, TypeScript, Vite, SSR/CSR, runtime/hospedagem: **A VALIDAR**.
- Repositório GitHub e branch: **A VALIDAR** (o repositório Growth Ops não comprova o repositório-fonte deste app).
- Arquivos críticos: **A VALIDAR** no projeto.

## 3. Formulário, campos e validações

- Arquivo/componente, campos e obrigatoriedade: **A VALIDAR**.
- Validações client/server, consentimento, captcha, honeypot e rate limit: **A VALIDAR**.
- Status do formulário conforme relatório anterior: **Ativo (Bitrix + Sheets)**
- Evidência estática: Integração indicada no relatório anterior; detalhes de campos e validação A VALIDAR.

## 4. Fluxo real do lead e persistência

`Usuário → Formulário → Função/arquivo A VALIDAR → Endpoint/integrador → Google Sheets 1WLqpmIfI5eG3MqbDkpCIgGA2n0Q5yn_79c-wEDCle_Y; Bitrix24 loader_1337.js; Bitrix24 CRM → destino final A VALIDAR`

- Endpoint/função/arquivo HTTP, método, server/edge function, retry, fallback e backup: **A VALIDAR**, exceto integrações listadas abaixo.
- **Google Sheets:** ID `1WLqpmIfI5eG3MqbDkpCIgGA2n0Q5yn_79c-wEDCle_Y`, aba `Leads`, range `Leads!A:R`; método e colunas A VALIDAR.
- **Bitrix24:** loader `loader_1337.js`, form ID `inline/1337/wi075j`; gravação final A VALIDAR.
- **HubSpot:** NÃO LOCALIZADO no relatório anterior.
- **n8n:** NÃO LOCALIZADO no relatório anterior.
- **Make / RD Station / Supabase / banco / API / e-mail / WhatsApp:** ver JSON consolidado; quando não há evidência específica, marcado A VALIDAR ou NÃO LOCALIZADO.
- **Confirmação de persistência em produção:** Integração documentada no relatório estático anterior; gravação em produção NÃO foi testada nesta auditoria.
- **Página de obrigado e tracking pós-sucesso:** A VALIDAR.

## 5. Payload e identificadores

Payload estrutural de campos: **A VALIDAR** no código, sem dados pessoais reais.

- source, source_id, origem, identifier, form ID, campaign slug: **A VALIDAR**, salvo os IDs de formulário Bitrix acima.
- `project_id`: `a1c0456b-f298-4e40-8f5b-b4503cbcac09`; ID de documentação: `lp-consorciobesmartgeral`.

## 6. Atribuição e tracking

| Campo | Capturado | Enviado | Persistido | Destino |
|---|---|---|---|---|
| `utm_source` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `utm_medium` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `utm_campaign` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `utm_term` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `utm_content` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `gclid` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `fbclid` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `pageUrl` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |
| `referrer` | A VALIDAR | A VALIDAR | A VALIDAR | A VALIDAR |

- **GTM / GA4 / Google Ads / dataLayer / gtag / fbq / CustomEvent:** A VALIDAR; Pixel Meta: `328736425190714`.
- **Eventos existentes e conversão após sucesso real:** A VALIDAR / A VALIDAR.

## 7. SEO

Title, description, canonical, Open Graph/og:image, schema, sitemap, robots e indexabilidade: **A VALIDAR**.

## 8. LGPD e segurança

Consentimento, política e armazenamento do consentimento, CORS, endpoints públicos, rate limit, captcha, honeypot, spam, formula injection e exposição de erros: **A VALIDAR**. Nenhum segredo foi reproduzido.

## 9. Riscos

- **Perda de leads:** A VALIDAR
- **Tracking:** A VALIDAR
- **Integração:** A VALIDAR
- **Segurança / LGPD / SEO:** A VALIDAR

## 10. O que não pode quebrar

- Project ID `a1c0456b-f298-4e40-8f5b-b4503cbcac09` e a identidade desta variação.
- Google Sheets 1WLqpmIfI5eG3MqbDkpCIgGA2n0Q5yn_79c-wEDCle_Y; aba/range Leads / Leads!A:R
- Bitrix loader loader_1337.js / form inline/1337/wi075j

- Campos, rotas, eventos e regras de negócio não documentados: **A VALIDAR antes de qualquer mudança**.

## 11. Pendências e próxima ação

- **Pendência:** revisar o código-fonte/preview deste projeto e confirmar todos os itens A VALIDAR.
- **Próxima ação:** validar destino e estado de publicação com evidência, sem submeter leads; para mock confirmado, impedir tráfego até corrigir persistência.

> Não realizar operações de escrita no projeto ou no GitHub como parte desta auditoria.


## Atualização operacional — 10/11/2026 — UTM-STD v2.1

Esta seção atualiza o estado operacional da LP; as seções anteriores permanecem como histórico da auditoria de 30/10. Não cria nova ficha ou novo identificador.

- Domínio oficial: https://encontreseuconsorcio.besmart.com.br. Formulário próprio; Bitrix removido. Destinos paralelos: Google Sheets Central de Leads + n8n lp-leads.
- Planilha atual: 17cJI_hmUDEKN3k29cdiT3RJhpMpWe9_gS2Cs1AL6GNU, abas Tráfego Pago, Orgânico, Linktree, Backup n8n; 54 colunas principais e 3 extras de Backup. Planilha antiga preservada, sem novos leads deste fluxo.
- Regra anterior v2.0: organic_social exigia source instagram/facebook/linkedin/youtube; outras origens iam ao Backup como não classificadas.
- Nova regra institucional v2.1: organic, organic_social e organic_search classificam ORGANICO independentemente de source, sem reescrever UTMs. Prioridade: Linktree; campanha validada no catálogo; medium orgânico; demais evidências pagas existentes ou Backup quando não identificada. Click ID isolado não sobrepõe medium orgânico.
- Justificativa: lead com chatgpt.com + organic_social era preservado no Backup, mas excluído da aba Orgânico pela lista restritiva.
- Regularização autorizada: event_id 0f1a2b42-6836-4079-9ac4-26ff150bff40 agora em Orgânico linha 2, uma ocorrência principal; original no Backup linha 10 mantido com classificação histórica v2.0 e marcado REGULARIZADO. UTMs e event_id preservados; NÃO reenviado ao n8n (aceite anterior HTTP 200).
- Homologação parcial em 10/11/2026: 25 testes automatizados aprovados; compilação automática OK. Gravação real autorizada, usando classificação, seleção de aba e append/update da aplicação, com dados fictícios identificados e SEM n8n: Orgânico linha 3, event_id 0acb211d-8425-48e5-9ac6-afe09003fdb5; Linktree linha 2, event_id 089846fd-5a43-4655-b7f5-49b30716d644. Releitura confirmou uma linha principal por event_id após atualização.
- Testes 1, 2, 3 e 5: APROVADO. Teste 4: classificação com fixture de catálogo APROVADA, gravação por campanha real BLOQUEADA (catálogo de produção vazio; não inventar campanha). Teste 6 n8n: BLOQUEADO sem ambiente isolado ou bypass comercial comprovado. Teste 7: append + update único APROVADO; deduplicação entre reenvios independentes e conversão Pixel ponta a ponta NÃO EXECUTADAS.
- Não houve submissão fictícia ao endpoint n8n nem criação de contato fictício em RD/Findor nesta execução. Aceite HTTP 200 anterior não comprova entregas finais.
- Publicação da correção NÃO realizada. Homologação integral do domínio oficial permanece pendente de publicação, envio seguro e catálogo real.
- Arquivos alterados: src/lib/utm-taxonomy.ts, src/lib/lead-routing.ts, src/lib/lead-submit.server.ts, src/lib/organic-classification.test.ts; governança em AGENTS.md e roadmap.md.


## Recuperação de leads pagos — 10/11/2026 — revisão técnica v2.2

Atualização cumulativa: histórico anterior integralmente preservado. Sete leads únicos em Tráfego Pago linhas 2–8 e sete backups FALHA_N8N correspondentes: HTTP 404 histórico, 21 operações Sheets originais com upstream 200. Zero entregas comerciais comprovadas; sete pendentes de verificação; zero liberados para reenvio seguro. Nenhum contato, registro ou workflow foi modificado nesta recuperação, nenhum reenvio/publicação executado.

Hub [Marketing] Hub de leads das LPs, workflow oNu6vPpjJ3IAYyjrJCKui, API acessível, active=true. Destino configurado bs-consorcio-geral: RD besmart-consorcio-geral; Findor null/false. Responde OK precede entrega RD. Quatro execuções disponíveis, todas manuais anteriores às capturas e de outras LPs; nenhum dos sete event_ids encontrado, mas retenção incompleta não comprova ausência de entrega. Repetições históricas teste-001/teste-002 acionaram RD novamente. Não há ledger/deduplicação visível; RD não recebe event_id e parte das UTMs. neverError=true permite execução success mesmo com Findor 401 em teste de outra LP.

Correções seguras no preview: somente catálogo real LP-scoped, exato e compatível valida pago; R2_UTM_ID/click ID desconhecido não valida campanha. Nomes/brutos preservados inclusive espaços; sete históricos não reclassificados. Medium orgânico mantém v2.1; catálogo continua vazio e consulta Meta Ads recusada. Novo pago sem evidência vai ao Backup. Aceite exige 2xx+ok=true+event_id igual; recibo deixa PENDENTE_ENTREGA_COMERCIAL; 2xx ambíguo PENDENTE_VERIFICACAO_HUB. Falha no update não bloqueia backup; erros combinados uma tentativa de ocorrência por submissão; log sem PII. Sem retry automático e sem idempotência persistente implementada.

35 testes isolados passaram, build automático OK, hosted preview succeeded/in_sync; domínio oficial e preview visualmente íntegros, UTMs preservadas, sem envio. Não homologado E2E nem publicado. Teste A real e B controlado pago bloqueados por catálogo; C aprovado isolado sem rede; D API/workflow confirmado mas E2E bloqueado; E destino consulta bloqueada; F reprovado inspeção/sem teste comercial.

Administrador deve consultar RD/histórico dos sete em ambiente restrito, confirmar retenção e recibos, implantar ledger único atômico por (lp_id,event_id,destino), preservar UTMs/event_id no contrato suportado pelo RD, validar resultados comerciais e isolar teste. Revisar redação/acesso a headers sensíveis salvos nas execuções, sem reproduzir segredos. Gestor deve fornecer exportação oficial de campanha 120251828693540156 e anúncio/conjunto 120251828693770156, nomes exatos, vínculo LP, canal e template UTMs; valores recebidos não são catálogo validado.

Fila preparada em quarentena pelos sete event_ids abaixo, NÃO autorizada nem liberada. Autorização de publicação e recuperação deverá ocorrer após prova de segurança e catálogo.
- 3ed150af-5bfd-402d-b6c0-94f2badac948
- 98b22f57-0c2a-40de-8992-16e5d7b4761a
- 2d069019-9113-4217-a016-49e6cb39523d
- 858d0c9b-0b6c-4fdc-a1a3-250ee05641d7
- 6a247824-f043-4afc-98ad-512be2be730f
- 0dd83de3-06d7-4bdf-abc3-a3543ad9f141
- 2f60da49-d3e2-46ba-9d6c-aa593181dcb7
