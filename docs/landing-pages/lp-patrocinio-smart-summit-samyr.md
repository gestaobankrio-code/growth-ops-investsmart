> **ID canônico no Growth Ops:** `lp-patrocinio-smart-summit-samyr`
> **ID original da auditoria Lovable:** `lp-patrocinio-smart-summit-samyr`
> **Fonte:** auditoria estática do workspace Lovable em 30/10/2026; sem submissão de formulários em produção.

> Registro Growth Ops preexistente preservado e enriquecido com esta auditoria.

# Auditoria técnica: Patrocinio Smart Summit Samyr

- **ID de documentação:** `lp-patrocinio-smart-summit-samyr`
- **Project ID Lovable:** `45f9a203-7b60-4fa0-8df0-36d8108f639d`
- **URL registrada:** https://decisor-link-studio.lovable.app
- **Status de publicação:** URL pública registrada no relatório anterior; publicação atual A VALIDAR
- **Classificação no relatório anterior:** LP Patrocínio
- **Data da auditoria de referência:** 30/10/2026
- **Limite desta documentação:** auditoria estática baseada no relatório anterior. Não houve submissão de formulário nem confirmação de gravação em produção.

## 1. Identificação e relação de versões

- **Campanha/família:** Smart Summit / Patrocínio
- **Variação/relação:** Possível duplicidade / versão relacionada; oficialidade A VALIDAR
- **Objetivo e público:** A VALIDAR no conteúdo do projeto.
- **Preview Lovable:** A VALIDAR; project ID: `45f9a203-7b60-4fa0-8df0-36d8108f639d`
- **Domínio próprio, rotas e branch:** A VALIDAR
- **Projeto provavelmente oficial:** A VALIDAR. Não inferir oficialidade somente pelo nome.
- **Recomendação de arquivamento:** não arquivar/despublicar sem validação humana. Risco de leads: bloquear tráfego e revisar antes de arquivar.

## 2. Tecnologia e arquivos críticos

- Framework, React, TypeScript, Vite, SSR/CSR, runtime/hospedagem: **A VALIDAR**.
- Repositório GitHub e branch: **A VALIDAR** (o repositório Growth Ops não comprova o repositório-fonte deste app).
- Arquivos críticos: **A VALIDAR** no projeto.

## 3. Formulário, campos e validações

- Arquivo/componente, campos e obrigatoriedade: **A VALIDAR**.
- Validações client/server, consentimento, captcha, honeypot e rate limit: **A VALIDAR**.
- Status do formulário conforme relatório anterior: **Falso sucesso / mock; persistência real não identificada**
- Evidência estática: CtaForm.tsx waits 700 ms and simulates success; no persistence identified.

## 4. Fluxo real do lead e persistência

`Usuário → Formulário → Função/arquivo A VALIDAR → Endpoint/integrador → NENHUM endpoint identificado no relatório (mock) → destino final A VALIDAR`

- Endpoint/função/arquivo HTTP, método, server/edge function, retry, fallback e backup: **A VALIDAR**, exceto integrações listadas abaixo.
- **Google Sheets:** NÃO LOCALIZADO
- **Bitrix24:** NÃO LOCALIZADO no relatório anterior.
- **HubSpot:** NÃO LOCALIZADO no relatório anterior.
- **n8n:** NÃO LOCALIZADO no relatório anterior.
- **Make / RD Station / Supabase / banco / API / e-mail / WhatsApp:** ver JSON consolidado; quando não há evidência específica, marcado A VALIDAR ou NÃO LOCALIZADO.
- **Confirmação de persistência em produção:** Não confirmada; evidência estática de submissão simulada, sem gravação identificada.
- **Página de obrigado e tracking pós-sucesso:** A VALIDAR.

## 5. Payload e identificadores

Payload estrutural de campos: **A VALIDAR** no código, sem dados pessoais reais.

- source, source_id, origem, identifier, form ID, campaign slug: **A VALIDAR**, salvo os IDs de formulário Bitrix acima.
- `project_id`: `45f9a203-7b60-4fa0-8df0-36d8108f639d`; ID de documentação: `lp-patrocinio-smart-summit-samyr`.

## 6. Atribuição e tracking

| Campo | Capturado | Enviado | Persistido | Destino |
|---|---|---|---|---|
| `utm_source` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `utm_medium` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `utm_campaign` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `utm_term` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `utm_content` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `gclid` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `fbclid` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `pageUrl` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |
| `referrer` | NÃO LOCALIZADO | NÃO LOCALIZADO | NÃO LOCALIZADO | A VALIDAR |

- **GTM / GA4 / Google Ads / dataLayer / gtag / fbq / CustomEvent:** A VALIDAR; Pixel Meta: `NÃO LOCALIZADO`.
- **Eventos existentes e conversão após sucesso real:** NÃO LOCALIZADO / NÃO; sucesso local sem confirmação de persistência.

## 7. SEO

Title, description, canonical, Open Graph/og:image, schema, sitemap, robots e indexabilidade: **A VALIDAR**.

## 8. LGPD e segurança

Consentimento, política e armazenamento do consentimento, CORS, endpoints públicos, rate limit, captcha, honeypot, spam, formula injection e exposição de erros: **A VALIDAR**. Nenhum segredo foi reproduzido.

## 9. Riscos

- **Perda de leads:** Crítico
- **Tracking:** Alto
- **Integração:** Crítico
- **Segurança / LGPD / SEO:** A VALIDAR

## 10. O que não pode quebrar

- Project ID `45f9a203-7b60-4fa0-8df0-36d8108f639d` e a identidade desta variação.

- Campos, rotas, eventos e regras de negócio não documentados: **A VALIDAR antes de qualquer mudança**.

## 11. Pendências e próxima ação

- **Pendência:** revisar o código-fonte/preview deste projeto e confirmar todos os itens A VALIDAR.
- **Próxima ação:** validar destino e estado de publicação com evidência, sem submeter leads; para mock confirmado, impedir tráfego até corrigir persistência.

> Não realizar operações de escrita no projeto ou no GitHub como parte desta auditoria.
