> **ID canônico no Growth Ops:** `lp-best-franquias`
> **ID original da auditoria Lovable:** `lp-best-franquias-upgrade`
> **Fonte:** auditoria estática do workspace Lovable em 30/10/2026; sem submissão de formulários em produção.

> Registro Growth Ops preexistente preservado e enriquecido com esta auditoria.

# Auditoria técnica: Best Franquias Upgrade

- **ID de documentação:** `lp-best-franquias-upgrade`
- **Project ID Lovable:** `0b51c6aa-3f9b-4eaf-b5da-443a537a509b`
- **URL registrada:** https://bestfranquia.lovable.app
- **Status de publicação:** URL pública registrada no relatório anterior; publicação atual A VALIDAR
- **Classificação no relatório anterior:** LP Expansão
- **Data da auditoria de referência:** 30/10/2026
- **Limite desta documentação:** auditoria estática baseada no relatório anterior. Não houve submissão de formulário nem confirmação de gravação em produção.

## 1. Identificação e relação de versões

- **Campanha/família:** Expansão / Franquias
- **Variação/relação:** Projeto individual; versionamento A VALIDAR
- **Objetivo e público:** A VALIDAR no conteúdo do projeto.
- **Preview Lovable:** A VALIDAR; project ID: `0b51c6aa-3f9b-4eaf-b5da-443a537a509b`
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
- Status do formulário conforme relatório anterior: **Ativo (n8n + Sheets)**
- Evidência estática: Integração indicada no relatório anterior; detalhes de campos e validação A VALIDAR.

## 4. Fluxo real do lead e persistência

`Usuário → Formulário → Função/arquivo A VALIDAR → Endpoint/integrador → Google Sheets 1r719ZwMvR0e8i85lcqf0ZL1I3djelvaCyAyjCaj9_-4; n8n https://n8n.investsmart.com.br/webhook/lp-best-franquias → destino final A VALIDAR`

- Endpoint/função/arquivo HTTP, método, server/edge function, retry, fallback e backup: **A VALIDAR**, exceto integrações listadas abaixo.
- **Google Sheets:** ID `1r719ZwMvR0e8i85lcqf0ZL1I3djelvaCyAyjCaj9_-4`, aba `Leads`, range `Leads!A:J`; método e colunas A VALIDAR.
- **Bitrix24:** NÃO LOCALIZADO no relatório anterior.
- **HubSpot:** NÃO LOCALIZADO no relatório anterior.
- **n8n:** `https://n8n.investsmart.com.br/webhook/lp-best-franquias`; POST indicado pelo padrão informado, status do workflow/destino final A VALIDAR.
- **Make / RD Station / Supabase / banco / API / e-mail / WhatsApp:** ver JSON consolidado; quando não há evidência específica, marcado A VALIDAR ou NÃO LOCALIZADO.
- **Confirmação de persistência em produção:** Integração documentada no relatório estático anterior; gravação em produção NÃO foi testada nesta auditoria.
- **Página de obrigado e tracking pós-sucesso:** A VALIDAR.

## 5. Payload e identificadores

Payload estrutural de campos: **A VALIDAR** no código, sem dados pessoais reais.

- source, source_id, origem, identifier, form ID, campaign slug: **A VALIDAR**, salvo os IDs de formulário Bitrix acima.
- `project_id`: `0b51c6aa-3f9b-4eaf-b5da-443a537a509b`; ID de documentação: `lp-best-franquias-upgrade`.

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

- **GTM / GA4 / Google Ads / dataLayer / gtag / fbq / CustomEvent:** A VALIDAR; Pixel Meta: `A VALIDAR`.
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

- Project ID `0b51c6aa-3f9b-4eaf-b5da-443a537a509b` e a identidade desta variação.
- Google Sheets 1r719ZwMvR0e8i85lcqf0ZL1I3djelvaCyAyjCaj9_-4; aba/range Leads / Leads!A:J
- Webhook https://n8n.investsmart.com.br/webhook/lp-best-franquias

- Campos, rotas, eventos e regras de negócio não documentados: **A VALIDAR antes de qualquer mudança**.

## 11. Pendências e próxima ação

- **Pendência:** revisar o código-fonte/preview deste projeto e confirmar todos os itens A VALIDAR.
- **Próxima ação:** validar destino e estado de publicação com evidência, sem submeter leads; para mock confirmado, impedir tráfego até corrigir persistência.

> Não realizar operações de escrita no projeto ou no GitHub como parte desta auditoria.
