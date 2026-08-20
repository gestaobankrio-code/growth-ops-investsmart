# Documentação Growth Ops InvestSmart

Atualização gerada automaticamente em 20/08/2026, 19:14:57.

## Resumo executivo

| Indicador | Total |
|---|---:|
| Registros ativos | 7 |
| Validados | 7 |
| A validar | 0 |
| Risco alto/crítico | 5 |
| Sem 2FA | 0 |

## Inventário

| Ativo | Software | Categoria | Responsável | Status | Risco |
|---|---|---|---|---|---|
| Dropbox InvestSmart | Dropbox | Armazenamento | Bruno Aguiar | Validado | Alto |
| Landing Page | Lovable | Landing Page | Marketing | Validado | Crítico |
| Smart Carreiras | Lovable | Landing Page / Aquisição | Marketing | Validado | Crítico |
| Make | Make | Automação / Integração | Marketing | Validado | Crítico |
| Meta Pixel - Smart Carreiras | Meta Pixel | Tracking / Mensuração | Marketing | Validado | Baixo |
| Claude | Outro | IA | Marketing | Validado | Alto |
| Página de obrigado universal investSmart | RD STATION | Landing Page / Página de Obrigado | Philipe Coutinho | Validado | Baixo |

## Pendências

| Ativo | Software | Pendência | Próxima ação |
|---|---|---|---|
| Dropbox InvestSmart | Dropbox | Risco Alto | Validar com Bruno Aguiar e Angelo a governança atual da conta Dropbox.  Confirmar quem possui acesso ao e-mail designers@investsmart.com.br, validar se existe segundo administrador e revisar o método de recuperação da conta.  Remover qualquer dependência de senha compartilhada e formalizar a custódia do acesso com responsável oficial. |
| Landing Page | Lovable | Risco Crítico | A validar |
| Landing Page | Lovable | Quem recebe o código a validar | A validar |
| Smart Carreiras | Lovable | Risco Crítico | Configurar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar o carregamento do Pixel 328736425190714 no domínio público https://smartcarreiras.com.br/.  Confirmar se será implementado GTM e GA4 para governança de tracking.  Validar propriedades do formulário no HubSpot, especialmente pl__custodia.  Após validar tracking, formulário e recebimento dos leads no HubSpot, atualizar o status para Validado. |
| Smart Carreiras | Lovable | Quem recebe o código a validar | Configurar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar o carregamento do Pixel 328736425190714 no domínio público https://smartcarreiras.com.br/.  Confirmar se será implementado GTM e GA4 para governança de tracking.  Validar propriedades do formulário no HubSpot, especialmente pl__custodia.  Após validar tracking, formulário e recebimento dos leads no HubSpot, atualizar o status para Validado. |
| Make | Make | Risco Crítico | A validar |
| Make | Make | Quem recebe o código a validar | A validar |
| Make | Make | Sem segundo administrador | A validar |
| Meta Pixel - Smart Carreiras | Meta Pixel | Quem recebe o código a validar | Adicionar o disparo do evento Meta Lead ou CompleteRegistration após o envio bem-sucedido do formulário, antes do redirecionamento para WhatsApp.  Validar no Meta Pixel Helper e no Gerenciador de Eventos da Meta se o Pixel 328736425190714 carrega corretamente no domínio https://smartcarreiras.com.br/.  Confirmar se o evento PageView está ativo e testar o disparo do evento Lead após submissão do formulário.  Avaliar implementação futura via GTM e GA4 para melhorar governança de tracking.  Após validação do evento de conversão, atualizar o status do registro para Validado. |
| Claude | Outro | Risco Alto | Remover a autenticação por SMS vinculada ao telefone de Eduardo Alves.  Transferir a custódia do 2FA para um responsável oficial da área gestora ou para um método corporativo controlado pela InvestSmart.  Validar segundo administrador, método de recuperação da conta e registrar nova custódia após a alteração. |
| Claude | Outro | Recuperação de acesso não validada | Remover a autenticação por SMS vinculada ao telefone de Eduardo Alves.  Transferir a custódia do 2FA para um responsável oficial da área gestora ou para um método corporativo controlado pela InvestSmart.  Validar segundo administrador, método de recuperação da conta e registrar nova custódia após a alteração. |
| Página de obrigado universal investSmart | RD STATION | Quem recebe o código a validar | A validar |
