# Health Check das Landing Pages (v2)

Responde três perguntas por LP, a cada 4 horas (07h–23h de Brasília):

| Pergunta | Como é verificado |
|---|---|
| **A página está no ar?** | HTTP, página renderizada de fato (SPA em branco ou 404 conta como falha), erros de JavaScript, recursos quebrados, LCP/tempo de carga |
| **O formulário entrega o lead?** | Um navegador preenche e envia o formulário (inclusive quiz/modal em várias etapas). A requisição é **interceptada e respondida localmente**: nenhum lead chega à produção. O painel mostra para onde o lead iria (n8n, Supabase, Bitrix24, HubSpot, Apps Script, WhatsApp…). Se nada sai da página, o formulário é *mock* e está perdendo leads. Webhooks n8n e Edge Functions recebem uma sonda sem dados para saber se estão ativos |
| **Está convertendo ultimamente?** | Lê os leads reais da fonte (Google Sheets, Supabase, Bitrix24 ou endpoint JSON) e compara com o próprio histórico da LP |

Pixels (Meta, GA4, Google Ads, TikTok) também são interceptados: o painel mostra quais eventos disparariam (ex.: `Meta Pixel: Lead` no envio) sem enviá-los, para não sujar a otimização das campanhas.

## Veredito

- **Crítico** — fora do ar, em branco, formulário que não envia, destino do lead inativo, ou **conversão parada**.
- **Atenção** — lentidão, erros de JS, sem pixel ou sem evento de Lead, teste de envio inconclusivo, queda de conversão (> 50% vs semana anterior) ou sem leads recentes.
- **OK** — tudo acima saudável.

**Conversão parada** não é um limite fixo de horas. O script calcula quantos leads a LP costuma receber *na mesma janela de horário* nos 28 dias anteriores. Assim a madrugada e o fim de semana são respeitados. Se o esperado era 4 ou mais leads e a chance de zero ter sido acaso é menor que 1% (Poisson), a LP vira crítica. Uma LP de 50 leads/dia alarma em poucas horas; uma de 2/dia, só depois de alguns dias.

## Alertas

- LP crítica → abre (ou atualiza) a issue **🚨 Health Check: landing pages críticas** e comenta quando surge uma nova; fecha sozinha quando tudo normaliza.
- O próprio monitor falhou → issue **⚠️ Health Check das LPs não está rodando**. O painel também mostra "Monitor parado" quando os dados têm mais de 10 h.

## Conversão real (automática)

O health check descobre sozinho de onde ler os leads de cada LP, nesta ordem:

1. **n8n (principal):** o envio simulado captura o webhook que a LP usa (`/webhook/...`). O script acha o workflow do n8n dono desse webhook e conta as execuções dos últimos 28 dias. Sucesso conta como lead processado; erro conta como lead possivelmente perdido. Um workflow desativado vira crítico na hora. LPs novas entram sozinhas, sem cadastro.
   - **Configuração única:** no n8n, crie uma chave em *Settings → n8n API → Create an API key*. Salve no repositório em *Settings → Secrets and variables → Actions* com o nome `N8N_API_KEY`. Se o n8n não estiver em `https://n8n.investsmart.com.br`, crie a variável `N8N_API_URL`.
2. **Planilha Google documentada no cadastro:** usada quando a LP não passa pelo n8n. Precisa do segredo `GOOGLE_SERVICE_ACCOUNT_JSON` e da planilha compartilhada com a conta de serviço.
3. **Outras fontes** (Supabase, Bitrix24, endpoint JSON): entrada em `data/conversion-sources.json`. Tokens vão no segredo `LEAD_SOURCE_SECRETS`, nunca no arquivo, porque o repositório é público.

Sem nenhuma credencial, a coluna "Conversão real" mostra *Não monitorada*. Os testes de página, envio do formulário, webhook ativo e pixels continuam funcionando sem nenhuma configuração.

## Resumo por IA (opcional)

Com o segredo `ANTHROPIC_API_KEY`, cada execução gera um resumo executivo priorizando perda de leads. Sem a chave, o painel usa um resumo por regras.

## Rodar localmente

```bash
npm install --no-save playwright@1.55.0 && npx playwright install chromium
HEALTHCHECK_ONLY=lp-planeja-brasil-organico node scripts/health-check-lps.cjs
```
