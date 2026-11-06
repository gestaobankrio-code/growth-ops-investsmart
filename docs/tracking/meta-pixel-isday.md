# Meta Pixel - ISDay

## Identificação do ativo
- **ID Growth Ops:** `meta-pixel-isday`
- **Ativo:** Meta Pixel - ISDay
- **Categoria:** Tracking / Meta Pixel / ISDay
- **Responsável:** Marketing (Marketing / Growth)
- **Status:** A validar
- **URL de referência:** https://isday.investsmart.com.br/

## Pixel ID
`328736425190714` (Dataset ID: A validar)

## Escopo de implantação
Todas as páginas ISDay atuais e futuras.

Este registro é específico do ISDay. O mesmo Pixel ID também aparece em registros de outros projetos (Planeja Brasil, Smart Carreiras etc.), que continuam documentados separadamente.

## Evento
- `PageView` (disparado automaticamente pelo código base).
- CAPI: Não informado. Deduplicação: A validar.

## Regra de utilização
- Usar exatamente o código abaixo, sem alterações, dentro do `<head>` de cada página ISDay.
- Toda nova página ISDay deve receber este código desde a publicação.

## Como evitar duplicidade
- Instalar o código **uma única vez** por página.
- Não combinar o código inline com outra instalação do mesmo Pixel (ex.: via Google Tag Manager ou plugin), o que dobraria os PageViews.
- Antes de instalar, verificar com o Meta Pixel Helper se o Pixel `328736425190714` já está ativo na página.
- Não repetir `fbq('init', '328736425190714')` em componentes ou rotas internas.

## Páginas ISDay relacionadas
- https://isday.investsmart.com.br/ (referência)
- IS Day Atibaia - Orgânico (`lp-is-day-atibaia-organico`) - https://isdayatibaia.lovable.app
- IS Day Matriz RJ 14/11 (`lp-is-day-matriz-rj-1411`) - https://isday-matriz.lovable.app
- Novas páginas ISDay que forem criadas.

## Próxima ação
Validar a instalação em produção em todas as páginas ISDay, confirmar o Dataset ID e avaliar CAPI/deduplicação. Nesta etapa o código foi apenas documentado; nenhuma página foi alterada.

## Código completo

```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '328736425190714');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=328736425190714&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```
