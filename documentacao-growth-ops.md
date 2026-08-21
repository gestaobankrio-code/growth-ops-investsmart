# Documentação Growth Ops InvestSmart

Atualização gerada automaticamente em 21/08/2026, 15:19:07.

## Resumo executivo

| Indicador | Total |
|---|---:|
| Registros ativos | 13 |
| Validados | 11 |
| A validar | 1 |
| Risco alto/crítico | 8 |
| Sem 2FA | 0 |

## Inventário

| Ativo | Software | Categoria | Responsável | Status | Risco |
|---|---|---|---|---|---|
| Dropbox InvestSmart | Dropbox | Armazenamento | Bruno Aguiar | Validado | Alto |
| Planeja Brasil - Orgânico | Landing Page | Landing Page / Planeja Brasil | Marketing | Validado | Alto |
| Planeja Brasil - Samyr | Landing Page | Landing Page / Planeja Brasil | Marketing | Validado | Médio |
| Planeja Brasil - Tráfego Pago | Landing Page | Landing Page / Planeja Brasil | Marketing | Validado | Alto |
| Abertura de Filial | Lovable | Landing Page / Aquisição / Expansão | Marketing | Incompleto | Baixo |
| Convite Smart Carreiras - Samyr | Lovable | Landing Page / Aquisição | Marketing | Validado | Crítico |
| Indique um Bancário e Ganhe até 5 Mil | Lovable | Landing Page / Aquisição | Marketing | A validar | Baixo |
| Lovable | Lovable | Licença / Plataforma de Desenvolvimento | Marketing | Validado | Crítico |
| Smart Carreiras | Lovable | Landing Page / Aquisição | Marketing | Validado | Crítico |
| Make | Make | Automação / Integração | Marketing | Validado | Crítico |
| Meta Pixel - Smart Carreiras | Meta Pixel | Tracking / Mensuração | Marketing | Validado | Baixo |
| Claude | Outro | IA | Marketing | Validado | Alto |
| Página de obrigado universal investSmart | RD STATION | Landing Page / Página de Obrigado | Philipe Coutinho | Validado | Baixo |

## Pendências

| Ativo | Software | Pendência | Próxima ação |
|---|---|---|---|
| Dropbox InvestSmart | Dropbox | Risco Alto | Validar com Bruno Aguiar e Angelo a governança atual da conta Dropbox.  Confirmar quem possui acesso ao e-mail designers@investsmart.com.br, validar se existe segundo administrador e revisar o método de recuperação da conta.  Remover qualquer dependência de senha compartilhada e formalizar a custódia do acesso com responsável oficial. |
| Planeja Brasil - Orgânico | Landing Page | Risco Alto | Registrar separadamente o source UC_QZ91TG, o webhook n8n, o Meta Pixel e o GTM. Validar no n8n se os leads estão chegando corretamente com source UC_QZ91TG e confirmar destino final do fluxo. |
| Planeja Brasil - Tráfego Pago | Landing Page | Risco Alto | Registrar separadamente o source 201, o webhook n8n, o Meta Pixel e o GTM. Validar no n8n se os leads estão chegando corretamente com source 201 e confirmar destino final do fluxo. |
| Abertura de Filial | Lovable | Quem recebe o código a validar | Definir com o time o destino oficial dos leads da landing page Abertura de Filial.  Implementar envio real do formulário para CRM, webhook, HubSpot, RD Station, Bitrix, n8n, Make, Google Sheets, e-mail ou outro destino oficial definido.  Configurar confirmação real de recebimento antes de mostrar a tela de sucesso.  Instalar GTM com GA4, Meta Pixel e conversão do Google Ads, caso a página seja usada em mídia paga.  Configurar evento de conversão no submit real do formulário.  Confirmar qual domínio será considerado canônico em produção: https://aberturadefilial.investsmart.com.br ou https://aberturadefilial02.lovable.app.  Após corrigir envio, tracking e destino dos leads, atualizar o status para Validado. |
| Abertura de Filial | Lovable | Recuperação de acesso não validada | Definir com o time o destino oficial dos leads da landing page Abertura de Filial.  Implementar envio real do formulário para CRM, webhook, HubSpot, RD Station, Bitrix, n8n, Make, Google Sheets, e-mail ou outro destino oficial definido.  Configurar confirmação real de recebimento antes de mostrar a tela de sucesso.  Instalar GTM com GA4, Meta Pixel e conversão do Google Ads, caso a página seja usada em mídia paga.  Configurar evento de conversão no submit real do formulário.  Confirmar qual domínio será considerado canônico em produção: https://aberturadefilial.investsmart.com.br ou https://aberturadefilial02.lovable.app.  Após corrigir envio, tracking e destino dos leads, atualizar o status para Validado. |
| Convite Smart Carreiras - Samyr | Lovable | Risco Crítico | A validar |
| Convite Smart Carreiras - Samyr | Lovable | Quem recebe o código a validar | A validar |
| Indique um Bancário e Ganhe até 5 Mil | Lovable | Quem recebe o código a validar | Aguardar validação da Amanda / Jurídico sobre o domínio público da landing page.  Auditar o projeto na Lovable para identificar campos do formulário, endpoint, webhook, destino dos leads, tracking instalado, Pixel, GTM, GA4, HubSpot, RD Station, Bitrix, n8n ou outra integração.  Após validação jurídica e técnica, atualizar domínio público, status, campos do formulário, tracking e destino dos leads no painel Growth Ops. |
| Lovable | Lovable | Risco Crítico | A validar |
| Lovable | Lovable | Quem recebe o código a validar | A validar |
| Smart Carreiras | Lovable | Risco Crítico | Configurar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar o carregamento do Pixel 328736425190714 no domínio público https://smartcarreiras.com.br/.  Confirmar se será implementado GTM e GA4 para governança de tracking.  Validar propriedades do formulário no HubSpot, especialmente pl__custodia.  Após validar tracking, formulário e recebimento dos leads no HubSpot, atualizar o status para Validado. |
| Smart Carreiras | Lovable | Quem recebe o código a validar | Configurar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar o carregamento do Pixel 328736425190714 no domínio público https://smartcarreiras.com.br/.  Confirmar se será implementado GTM e GA4 para governança de tracking.  Validar propriedades do formulário no HubSpot, especialmente pl__custodia.  Após validar tracking, formulário e recebimento dos leads no HubSpot, atualizar o status para Validado. |
| Make | Make | Risco Crítico | A validar |
| Make | Make | Quem recebe o código a validar | A validar |
| Make | Make | Sem segundo administrador | A validar |
| Meta Pixel - Smart Carreiras | Meta Pixel | Quem recebe o código a validar | Adicionar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar no Meta Pixel Helper e no Gerenciador de Eventos da Meta se o Pixel 328736425190714 carrega corretamente no domínio https://smartcarreiras.com.br/.  Confirmar se o evento PageView está ativo e testar o disparo do evento Lead após submissão do formulário.  Avaliar implementação futura via GTM e GA4 para melhorar governança de tracking.  Após validação do evento de conversão, atualizar o status do registro para Validado. |
| Claude | Outro | Risco Alto | Remover a autenticação por SMS vinculada ao telefone de Eduardo Alves.  Transferir a custódia do 2FA para um responsável oficial da área gestora ou para um método corporativo controlado pela InvestSmart.  Validar segundo administrador, método de recuperação da conta e registrar nova custódia após a alteração. |
| Claude | Outro | Recuperação de acesso não validada | Remover a autenticação por SMS vinculada ao telefone de Eduardo Alves.  Transferir a custódia do 2FA para um responsável oficial da área gestora ou para um método corporativo controlado pela InvestSmart.  Validar segundo administrador, método de recuperação da conta e registrar nova custódia após a alteração. |
| Página de obrigado universal investSmart | RD STATION | Quem recebe o código a validar | A validar |
