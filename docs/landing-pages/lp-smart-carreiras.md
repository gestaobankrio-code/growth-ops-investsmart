> **ID canônico no Growth Ops:** `lp-smart-carreiras`
> **ID original da auditoria Lovable:** `lp-smart-carreiras`
> **Fonte:** auditoria estática do workspace Lovable em 30/10/2026; sem submissão de formulários em produção.

# Auditoria técnica: Smart Carreiras

- **ID de documentação:** `lp-smart-carreiras`
- **Project ID Lovable:** `c234ab6a-cb3f-46cd-85b5-8c18b0848989`
- **URL registrada:** https://smart-carreiras.lovable.app
- **Status de publicação:** URL pública registrada no relatório anterior; publicação atual A VALIDAR
- **Classificação no relatório anterior:** LP Carreira
- **Data da auditoria de referência:** 30/10/2026
- **Limite desta documentação:** auditoria estática baseada no relatório anterior. Não houve submissão de formulário nem confirmação de gravação em produção.

## 1. Identificação e relação de versões

- **Campanha/família:** Profissão de Elite / Carreiras
- **Variação/relação:** Projeto individual; versionamento A VALIDAR
- **Objetivo e público:** A VALIDAR no conteúdo do projeto.
- **Preview Lovable:** A VALIDAR; project ID: `c234ab6a-cb3f-46cd-85b5-8c18b0848989`
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
- Status do formulário conforme relatório anterior: **Ativo (HubSpot API)**
- Evidência estática: Integração indicada no relatório anterior; detalhes de campos e validação A VALIDAR.

## 4. Fluxo real do lead e persistência

`Usuário → Formulário → Função/arquivo A VALIDAR → Endpoint/integrador → HubSpot Forms API v3 (Portal 21347715 / Form b713217b-7087-4958-b42c-177d3d7f2505) → destino final A VALIDAR`

- Endpoint/função/arquivo HTTP, método, server/edge function, retry, fallback e backup: **A VALIDAR**, exceto integrações listadas abaixo.
- **Google Sheets:** A VALIDAR
- **Bitrix24:** NÃO LOCALIZADO no relatório anterior.
- **HubSpot:** Portal `21347715`, Form `b713217b-7087-4958-b42c-177d3d7f2505`, endpoint Forms Submissions API v3; confirmação de persistência em produção A VALIDAR.
- **n8n:** NÃO LOCALIZADO no relatório anterior.
- **Make / RD Station / Supabase / banco / API / e-mail / WhatsApp:** ver JSON consolidado; quando não há evidência específica, marcado A VALIDAR ou NÃO LOCALIZADO.
- **Confirmação de persistência em produção:** Integração documentada no relatório estático anterior; gravação em produção NÃO foi testada nesta auditoria.
- **Página de obrigado e tracking pós-sucesso:** A VALIDAR.

## 5. Payload e identificadores

Payload estrutural de campos: **A VALIDAR** no código, sem dados pessoais reais.

- source, source_id, origem, identifier, form ID, campaign slug: **A VALIDAR**, salvo os IDs de formulário Bitrix acima.
- `project_id`: `c234ab6a-cb3f-46cd-85b5-8c18b0848989`; ID de documentação: `lp-smart-carreiras`.

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

- Project ID `c234ab6a-cb3f-46cd-85b5-8c18b0848989` e a identidade desta variação.

- Campos, rotas, eventos e regras de negócio não documentados: **A VALIDAR antes de qualquer mudança**.

## 11. Pendências e próxima ação

- **Pendência:** revisar o código-fonte/preview deste projeto e confirmar todos os itens A VALIDAR.
- **Próxima ação:** validar destino e estado de publicação com evidência, sem submeter leads; para mock confirmado, impedir tráfego até corrigir persistência.

> Não realizar operações de escrita no projeto ou no GitHub como parte desta auditoria.

## Dados adicionais preservados do Growth Ops

- Registro legado consolidado: `63aae663-7671-4dc1-9460-f5549d9acd77`
- URL/domínio operacional: https://smartcarreiras.com.br/
- projectName: Smart Carreiras
- lovableUrl: https://smart-carreiras.lovable.app
- deployUrl: https://smart-carreiras.lovable.app
- publicDomain: https://smartcarreiras.com.br/
- formFields: email, phone, firstname, lastname, profissao__funcao, tempo_de_profissao, empresa__instituicao, pl__custodia
- webhookUrl: Não
- tracking: Meta Pixel 328736425190714; HubSpot tracking 21347715;
- lpOwner: Marketing

### Observações legadas

Landing page Smart Carreiras desenvolvida pelo Marketing através da Lovable.

URL de desenvolvimento / deploy:
https://smart-carreiras.lovable.app

Domínio público final:
https://smartcarreiras.com.br/

Finalidade:
Página criada para captação de interessados em oportunidades de carreira relacionadas à InvestSmart.

A página utiliza formulário próprio em React, com envio para HubSpot Forms API v3.

Portal HubSpot:
21347715

Form ID HubSpot:
b713217b-7087-4958-b42c-177d3d7f2505

Meta Pixel identificado:
328736425190714

Evento atualmente identificado:
PageView.

Ponto de atenção:
Não foi identificado disparo de evento Lead ou CompleteRegistration após o envio bem-sucedido do formulário. A mensuração de conversão no Meta está incompleta.

GTM:
Não identificado.

GA4:
Não identificado.

Webhook n8n, Make ou Google Sheets:
Não identificado.

