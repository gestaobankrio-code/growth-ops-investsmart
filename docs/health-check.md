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

## Conectar a conversão real

Sem configuração, a coluna "Conversão real" aparece como *Não monitorada*. Para ligar:

1. **Planilhas Google** (14 LPs já têm planilha documentada no cadastro e são lidas automaticamente):
   - Crie uma conta de serviço no Google Cloud com a Sheets API ativada e gere uma chave JSON.
   - Salve o JSON inteiro no segredo `GOOGLE_SERVICE_ACCOUNT_JSON` do repositório.
   - Compartilhe cada planilha de leads com o e-mail da conta de serviço como **Leitor**. O painel avisa qual planilha ainda não foi compartilhada.
2. **Outras fontes** (Supabase, Bitrix24, n8n): adicione a LP em `data/conversion-sources.json` (há exemplos no arquivo). Tokens vão no segredo `LEAD_SOURCE_SECRETS` como JSON, ex.: `{"BITRIX_WEBHOOK_URL": "https://…/rest/1/xxxx/"}`. Nunca coloque tokens no arquivo, porque o repositório é público.
3. Planilha usada por mais de uma LP: use `filter` (coluna + valor, ex. `utm_source`) para separar; sem isso os números aparecem somados e marcados como "planilha compartilhada".

## Resumo por IA (opcional)

Com o segredo `ANTHROPIC_API_KEY`, cada execução gera um resumo executivo priorizando perda de leads. Sem a chave, o painel usa um resumo por regras.

## Rodar localmente

```bash
npm install --no-save playwright@1.55.0 && npx playwright install chromium
HEALTHCHECK_ONLY=lp-planeja-brasil-organico node scripts/health-check-lps.cjs
```
