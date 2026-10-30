# Auditoria preservada: Planeja Brasil - Samyr

- **ID canônico Growth Ops:** `lp-planeja-brasil-samyr`
- **Origem:** registro Growth Ops preexistente
- **URL registrada:** https://seu-planejamento-financeiro.investsmart.com.br
- **Status:** Validado
- **Risco:** Alto

> Este registro foi mantido separado do projeto Lovable auditado em 30/10/2026 porque o UUID do preview
> documentado anteriormente não coincide com o Project ID Lovable atual. A relação entre as duas versões
> permanece **A VALIDAR**.

## Observações existentes

Validação técnica realizada em modo leitura na landing page Planeja Brasil - Samyr.

Formulário próprio em React no componente LeadForm, com validação client-side, aceite de Termos de Uso/Política de Privacidade, envio via fetch POST para webhook n8n e redirecionamento para /obrigado após o envio.

Identificador validado: UC_UI1PIS, enviado nas chaves source, origem, canal, campanha e source_id.

Destino primário dos leads: webhook n8n.

Google Sheets: não há integração direta identificada no front-end.

CRM/ferramentas: não há chamada direta identificada para Bitrix, HubSpot, RD Station, Make, Google Apps Script ou outro endpoint no código analisado.

UTMs: não são capturadas de forma estruturada no front-end. A página envia apenas pageUrl.

Pontos de atenção: envio 100% client-side, webhook exposto no navegador, ausência de retry, ausência de fallback, ausência de persistência local e dependência exclusiva do n8n para recebimento dos leads.

## Próxima ação

Validar com Bruno/Marketing o fluxo n8n vinculado ao source UC_UI1PIS.

Confirmar se, após receber o lead, o n8n grava os dados em Google Sheets, Bitrix, HubSpot, RD Station, e-mail ou outro destino operacional.

Mapear nome da planilha, aba, campos salvos, responsável pelo tratamento dos leads e eventuais etapas comerciais.

Avaliar captura estruturada de UTMs no front-end e implementação de fallback para reduzir risco de perda de leads.

## Metadados

```json
{
  "campaignName": "",
  "variation": "Samyr",
  "identifier": "UC_UI1PIS",
  "lovableUrl": "https://id-preview--bb8b9299-f6c0-449f-b58e-fe3189e749e0.lovable.app",
  "publicDomain": "https://seu-planejamento-financeiro.investsmart.com.br",
  "webhookUrl": "",
  "gtmId": "GTM-TSMQ7JH",
  "pixelId": "",
  "ga4Id": "",
  "leadDestination": "https://docs.google.com/spreadsheets/d/1-3qBh7C07Rd_UeUV21IgQMLE9IX4Oga5hoqo6LwGnqg/edit?usp=sharing",
  "possibleLovableWorkspaceDuplicate": {
    "lovableAuditRecordId": "lp-planeja-brasil-samyr",
    "lovableProjectId": "bb8b9299-873b-4876-96ea-576f30a430ee",
    "lovableWorkspaceUrl": "https://planeja-brasil-samyr.lovable.app",
    "reason": "Nome/ID lógico coincidem, porém o Project ID Lovable atual não coincide com o UUID do preview documentado no registro existente. Mantidos separados até validação humana."
  }
}
```
