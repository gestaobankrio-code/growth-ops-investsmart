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

    if (
      document.querySelector('[data-b24-form]') ||
      scripts.some(src => src.includes('bitrix24')) ||
      iframes.some(src => src.includes('bitrix24')) ||
      html.includes('data-b24-form')
    ) {
      return { detected: true, provider: 'Bitrix24' };
    }

    if (
      scripts.some(src => src.includes('hubspot')) ||
      iframes.some(src => src.includes('hubspot')) ||
      html.includes('hsforms') ||
      html.includes('hubspot')
    ) {
      return { detected: true, provider: 'HubSpot' };
    }

    if (
      scripts.some(src => src.includes('rdstation')) ||
      iframes.some(src => src.includes('rdstation')) ||
      html.includes('rdstation')
    ) {
      return { detected: true, provider: 'RD Station' };
    }

    if (document.querySelector('form')) {
      return { detected: true, provider: 'Formulário HTML/React' };
    }

    const fields = document.querySelectorAll(
      'input[type="email"], ' +
      'input[type="tel"], ' +
      'input[name*="email" i], ' +
      'input[name*="phone" i], ' +
      'textarea, ' +
      'select'
    );

    if (fields.length >= 2) {
      return { detected: true, provider: 'Formulário renderizado' };
    }

    return { detected: false, provider: 'Não detectado' };
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
    userAgent: 'InvestSmart-Growth-Ops-HealthCheck/1.3'
  });

  const items = [];

  for (const record of lps) {
    const destinationDocumented = Boolean(
      documentedDestination(record)
    );

    const item = {
      id: record.id,
      ativo: record.ativo,
      url: record.url,

      checkedAt: new Date().toISOString(),

      online: null,
      httpStatus: null,

      formDetected: null,
      formProvider: 'A validar',

      /*
       * Governança documental fica separada da saúde técnica.
       */
      destinationDocumented,
      governanceStatus:
        destinationDocumented ? 'Documentado' : 'Atenção',

      conversionTest: 'Não executado',

      technicalStatus: 'A validar',

      note: '',

      governanceNote: destinationDocumented
        ? 'Destino do lead documentado.'
        : 'Destino do lead ainda não está documentado no Growth Ops.'
    };

    /*
     * Não possuir URL HTTP/HTTPS cadastrada NÃO significa que a LP está offline.
     */
    if (!hasHttpUrl(record)) {
      item.online = null;
      item.httpStatus = null;
      item.formDetected = null;
      item.technicalStatus = 'Não testável';
      item.note =
        'URL pública válida não cadastrada; teste técnico não executado.';

      items.push(item);
      continue;
    }

    const page = await context.newPage();

    try {
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
       * Crítico somente quando uma URL válida foi realmente testada e falhou.
       */
      if (!item.online) {
        item.formDetected = false;
        item.technicalStatus = 'Crítico';

        item.note =
          `Falha técnica confirmada. URL respondeu com status ${
            item.httpStatus ?? 'desconhecido'
          }.`;

        items.push(item);
        continue;
      }

      /*
       * Aguarda componentes dinâmicos: React, Bitrix, HubSpot, RD etc.
       */
      await page.waitForTimeout(2500);

      const form = await detectForm(page);

      item.formDetected = form.detected;
      item.formProvider = form.provider;

      /*
       * A saúde técnica depende somente da disponibilidade e do formulário.
       */
      if (!form.detected) {
        item.technicalStatus = 'Atenção';
        item.note =
          'Página online, mas nenhum formulário foi detectado no DOM renderizado.';
      } else {
        item.technicalStatus = 'Operacional';
        item.note =
          'Página online e formulário detectado com sucesso.';
      }
    }

    catch (error) {
      item.online = false;
      item.formDetected = false;
      item.technicalStatus = 'Crítico';

      item.note =
        `Falha técnica confirmada durante o Health Check: ${error.message}`;
    }

    finally {
      await page.close();
    }

    items.push(item);
  }

  await browser.close();

  const payload = {
    schema: 'growth-ops-health-check-v1.3',

    generatedAt: new Date().toISOString(),

    mode: 'structural-safe',

    classificationPolicy: {
      operacional:
        'URL válida testada online + formulário detectado',
      atencao:
        'URL válida testada online + formulário não detectado',
      critico:
        'URL válida testada com erro HTTP, timeout ou falha de carregamento',
      naoTestavel:
        'Não existe URL pública HTTP/HTTPS válida cadastrada'
    },

    governancePolicy:
      'Destino do lead e documentação são indicadores de governança e não alteram a saúde técnica.',

    conversionTestPolicy:
      'Não submete formulários de produção automaticamente.',

    items
  };

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
