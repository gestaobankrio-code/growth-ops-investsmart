> **ID canônico no Growth Ops:** `lp-smartcarreiras-samyr`
> **ID original da auditoria Lovable:** `lp-smartcarreiras-samyr`
> **Fonte:** auditoria estática do workspace Lovable em 30/10/2026; sem submissão de formulários em produção.

# Auditoria técnica: smartcarreiras-samyr

- **ID de documentação:** `lp-smartcarreiras-samyr`
- **Project ID Lovable:** `a0ab57c4-9c48-4437-9469-82f3493c7e86`
- **URL registrada:** https://smart-carreiras-samyr.lovable.app
- **Status de publicação:** URL pública registrada no relatório anterior; publicação atual A VALIDAR
- **Classificação no relatório anterior:** LP Carreira
- **Data da auditoria de referência:** 30/10/2026
- **Limite desta documentação:** auditoria estática baseada no relatório anterior. Não houve submissão de formulário nem confirmação de gravação em produção.

## 1. Identificação e relação de versões

- **Campanha/família:** Profissão de Elite / Carreiras
- **Variação/relação:** Projeto individual; versionamento A VALIDAR
- **Objetivo e público:** A VALIDAR no conteúdo do projeto.
- **Preview Lovable:** A VALIDAR; project ID: `a0ab57c4-9c48-4437-9469-82f3493c7e86`
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
- `project_id`: `a0ab57c4-9c48-4437-9469-82f3493c7e86`; ID de documentação: `lp-smartcarreiras-samyr`.

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

- Project ID `a0ab57c4-9c48-4437-9469-82f3493c7e86` e a identidade desta variação.

- Campos, rotas, eventos e regras de negócio não documentados: **A VALIDAR antes de qualquer mudança**.

## 11. Pendências e próxima ação

- **Pendência:** revisar o código-fonte/preview deste projeto e confirmar todos os itens A VALIDAR.
- **Próxima ação:** validar destino e estado de publicação com evidência, sem submeter leads; para mock confirmado, impedir tráfego até corrigir persistência.

> Não realizar operações de escrita no projeto ou no GitHub como parte desta auditoria.

## Dados adicionais preservados do Growth Ops

- Registro legado consolidado: `d534d5c6-dfb0-4c13-abf6-daa22da8dee7`
- URL/domínio operacional: https://convite.smartcarreiras.com.br/
- projectName: smartcarreiras-samyr
- lovableUrl: https://smart-carreiras-samyr.lovable.app
- publicDomain: https://convite.smartcarreiras.com.br/
- formFields: Nome: firstname + lastname, opcional E-mail: email, obrigatório Telefone: phone, obrigatório Profissão / Função: profissao__funcao, obrigatório Tempo de profissão: tempo_de_profissao, obrigatório Empresa / Instituição: empresa__instituicao, obrigatório PL / Custódia: pl__custodia, obrigatório
- webhookUrl: Endpoint HubSpot Forms API v3: https://api.hsforms.com/submissions/v3/integration/submit/21347715/b713217b-****-****-****-************
- tracking: HubSpot Tracking ID 21347715

### Observações legadas

Landing page Planeja Brasil, variação Samyr, criada via Lovable e registrada no Growth Ops.

Formulário próprio em React, com validação client-side, envio para webhook n8n e redirecionamento para página de obrigado.

Identificador validado: UC_UI1PIS, enviado nas chaves source, origem, canal, campanha e source_id.

Integrações identificadas: n8n, Meta Pixel 328736425190714 e GTM GTM-TSMQ7JH.

Tracking validado com evento Lead no Meta Pixel e evento lead_conversion via dataLayer no GTM.

Pontos de atenção: webhook chamado pelo navegador, ausência de fallback, retry, validação server-side e captura estruturada de UTMs.

