const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const recordsPath = path.join(ROOT, 'data', 'registros.json');
const outputPath = path.join(ROOT, 'data', 'health-check.json');

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isLandingPage(record) {
  const ativo = normalize(record.ativo);
  const categoria = normalize(record.categoria);
  const url = normalize(record.url);

  const isLp =
    ativo.startsWith('lp -') ||
    categoria.includes('landing page');

  const isThankYouPage =
    ativo.includes('pagina de obrigado') ||
    ativo.includes('thank you') ||
    categoria.includes('pagina de obrigado') ||
    categoria.includes('thank you') ||
    /\/obrigado(?:[-/?#]|$)/i.test(url) ||
    /\/thank-you(?:[-/?#]|$)/i.test(url);

  return isLp && !isThankYouPage;
}

function documentedDestination(record) {
  const extra = record.extra || {};

  return (
    extra.finalLeadDestination ||
    extra.leadDestination ||
    extra.spreadsheetUrl ||
    ''
  );
}

function hasHttpUrl(record) {
  return /^https?:\/\//i.test(String(record.url || ''));
}

async function detectForm(page) {
  return page.evaluate(() => {
    const scripts = [...document.scripts]
      .map(script => script.src || '')
      .filter(Boolean);

    const iframes = [...document.querySelectorAll('iframe')]
      .map(iframe => iframe.src || '')
      .filter(Boolean);

    const html = document.documentElement.innerHTML.toLowerCase();

    // Bitrix24
    if (
      document.querySelector('[data-b24-form]') ||
      scripts.some(src => src.includes('bitrix24')) ||
      iframes.some(src => src.includes('bitrix24')) ||
      html.includes('data-b24-form')
    ) {
      return {
        detected: true,
        provider: 'Bitrix24'
      };
    }

    // HubSpot
    if (
      scripts.some(src => src.includes('hubspot')) ||
      iframes.some(src => src.includes('hubspot')) ||
      html.includes('hsforms') ||
      html.includes('hubspot')
    ) {
      return {
        detected: true,
        provider: 'HubSpot'
      };
    }

    // RD Station
    if (
      scripts.some(src => src.includes('rdstation')) ||
      iframes.some(src => src.includes('rdstation')) ||
      html.includes('rdstation')
    ) {
      return {
        detected: true,
        provider: 'RD Station'
      };
    }

    // Formulário tradicional
    if (document.querySelector('form')) {
      return {
        detected: true,
        provider: 'Formulário HTML/React'
      };
    }

    // Formulários renderizados sem tag <form>
    const fields = document.querySelectorAll(
      'input[type="email"], ' +
      'input[type="tel"], ' +
      'input[name*="email" i], ' +
      'input[name*="phone" i], ' +
      'textarea, ' +
      'select'
    );

    if (fields.length >= 2) {
      return {
        detected: true,
        provider: 'Formulário renderizado'
      };
    }

    return {
      detected: false,
      provider: 'Não detectado'
    };
  });
}

(async () => {
  const records = JSON.parse(
    fs.readFileSync(recordsPath, 'utf8')
  );

  const lps = records.filter(isLandingPage);

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'InvestSmart-Growth-Ops-HealthCheck/1.1'
  });

  const items = [];

  for (const record of lps) {
    const item = {
      id: record.id,
      ativo: record.ativo,
      url: record.url,

      checkedAt: new Date().toISOString(),

      online: null,
      httpStatus: null,

      formDetected: null,
      formProvider: 'A validar',

      destinationDocumented: Boolean(
        documentedDestination(record)
      ),

      conversionTest: 'Não executado',

      technicalStatus: 'Atenção',

      note: ''
    };

    /*
     * Verifica se existe URL pública válida
     */
    if (!hasHttpUrl(record)) {
      item.online = false;
      item.formDetected = false;
      item.technicalStatus = 'Crítico';
      item.note = 'URL pública ausente ou inválida.';

      items.push(item);
      continue;
    }

    const page = await context.newPage();

    try {
      /*
       * Abre a Landing Page
       */
      const response = await page.goto(record.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      item.httpStatus = response
        ? response.status()
        : null;

      item.online = Boolean(
        response && response.ok()
      );

      /*
       * URL fora do ar
       */
      if (!item.online) {
        item.formDetected = false;
        item.technicalStatus = 'Crítico';

        item.note =
          `URL respondeu com status ${
            item.httpStatus ?? 'desconhecido'
          }.`;

        items.push(item);

        continue;
      }

      /*
       * Aguarda scripts dinâmicos:
       * Bitrix, HubSpot, React etc.
       */
      await page.waitForTimeout(2500);

      /*
       * Detecta formulário
       */
      const form = await detectForm(page);

      item.formDetected = form.detected;
      item.formProvider = form.provider;

      /*
       * Classificação da saúde operacional
       */
      if (!form.detected) {
        item.technicalStatus = 'Atenção';

        item.note =
          'Página online, mas nenhum formulário foi detectado no DOM renderizado.';
      }

      else if (!item.destinationDocumented) {
        item.technicalStatus = 'Atenção';

        item.note =
          'Página e formulário online, porém destino do lead não está documentado.';
      }

      else {
        item.technicalStatus = 'Operacional';

        item.note =
          'URL online, formulário detectado e destino do lead documentado.';
      }
    }

    catch (error) {
      item.online = false;
      item.formDetected = false;
      item.technicalStatus = 'Crítico';

      item.note =
        `Falha no Health Check: ${error.message}`;
    }

    finally {
      await page.close();
    }

    items.push(item);
  }

  await browser.close();

  /*
   * Resultado final
   */
  const payload = {
    schema: 'growth-ops-health-check-v1',

    generatedAt: new Date().toISOString(),

    mode: 'structural-safe',

    conversionTestPolicy:
      'Não submete formulários de produção automaticamente.',

    items
  };

  /*
   * Atualiza health-check.json
   */
  fs.writeFileSync(
    outputPath,
    JSON.stringify(payload, null, 2) + '\n',
    'utf8'
  );

  console.log(
    `Health Check concluído: ${items.length} Landing Pages.`
  );
})()

.catch(error => {
  console.error(error);
  process.exit(1);
});
