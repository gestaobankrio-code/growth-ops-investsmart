/*
 * Growth Ops InvestSmart — Health Check das Landing Pages (v2)
 *
 * Responde três perguntas por LP:
 *   1. A página está no ar e renderiza?            (disponibilidade, render, performance, erros JS)
 *   2. O formulário entrega o lead em algum lugar?  (teste de envio SIMULADO: preenche, clica e
 *                                                    intercepta a requisição — nada chega à produção)
 *   3. A LP está convertendo ultimamente?           (leads reais lidos do destino: Google Sheets,
 *                                                    Supabase, Bitrix24 ou endpoint JSON) + detecção
 *                                                    estatística de "conversão parada"
 *
 * Segurança: durante o envio simulado TODA requisição de escrita (POST/PUT/PATCH/DELETE) e todo
 * GET para hosts de captura de lead é interceptado e respondido localmente com 200 falso.
 * Pixels (Meta, GA4, Google Ads, TikTok) são interceptados em todas as fases: o script registra
 * quais eventos seriam disparados, mas não os envia, para não sujar a otimização das campanhas.
 *
 * Variáveis de ambiente (todas opcionais):
 *   HEALTHCHECK_ONLY              ids separados por vírgula para checar só algumas LPs
 *   HEALTHCHECK_CONCURRENCY       páginas em paralelo (padrão 4)
 *   HEALTHCHECK_CHROME_PATH       executável do Chrome (testes locais)
 *   HEALTHCHECK_RECORDS           caminho alternativo de registros.json (testes)
 *   HEALTHCHECK_OUTPUT_DIR        diretório alternativo de saída (testes)
 *   GOOGLE_SERVICE_ACCOUNT_JSON   credencial para ler as planilhas de leads
 *   LEAD_SOURCE_SECRETS           JSON {"NOME": "valor"} com tokens usados em conversion-sources.json
 *   ANTHROPIC_API_KEY             gera o resumo executivo com IA (opcional)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const OUTPUT_DIR = process.env.HEALTHCHECK_OUTPUT_DIR || path.join(ROOT, 'data');
const recordsPath = process.env.HEALTHCHECK_RECORDS || path.join(ROOT, 'data', 'registros.json');
const sourcesPath = path.join(ROOT, 'data', 'conversion-sources.json');
const outputPath = path.join(OUTPUT_DIR, 'health-check.json');
const historyPath = path.join(OUTPUT_DIR, 'health-history.json');
const alertsPath = process.env.HEALTHCHECK_ALERTS_PATH || path.join(OUTPUT_DIR, 'health-alerts.md');

const SCHEMA = 'growth-ops-health-check-v2.0';
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/140.0 Safari/537.36 InvestSmart-Growth-Ops-HealthCheck/2.0';
const CONCURRENCY = Math.max(1, Number(process.env.HEALTHCHECK_CONCURRENCY || 4));
const RUN_ID = Date.now().toString(36);

const THRESHOLDS = {
  minVisibleText: 80,          // abaixo disso a SPA provavelmente não renderizou
  slowLoadMs: 8000,            // carregamento lento
  slowLcpMs: 4000,             // LCP ruim (Core Web Vitals)
  silenceProbability: 0.01,    // P(0 leads no período | ritmo normal) abaixo disso = parada
  silenceMinExpected: 4,       // só alarma se o normal fosse ao menos 4 leads no período
  dropRatio: 0.5,              // semana atual < 50% da anterior = queda
  dropMinPrevious: 10,
  maxFunnelSteps: 8,
  noConversionDays: 3          // sem nenhuma conversão nesse período (até a data atual) = crítico
};

/* ------------------------------------------------------------------ utilidades */

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function fmtBR(date) {
  return new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLandingPage(record) {
  const ativo = normalize(record.ativo);
  const categoria = normalize(record.categoria);
  const url = normalize(record.url);
  const status = normalize(record.status);

  const isLp = ativo.startsWith('lp -') || categoria.includes('landing page');
  const isThankYouPage =
    ativo.includes('pagina de obrigado') ||
    ativo.includes('thank you') ||
    categoria.includes('pagina de obrigado') ||
    /\/obrigado(?:[-/?#]|$)/i.test(url) ||
    /\/thank-you(?:[-/?#]|$)/i.test(url);
  const isHistorical = categoria.includes('historico') || status === 'arquivado';

  return isLp && !isThankYouPage && !isHistorical;
}

function isTestableUrl(url) {
  return /^https?:\/\//i.test(url || '') && !/id-preview--/i.test(url || '');
}

function testUrlFor(record) {
  const extra = record.extra || {};
  const candidates = [record.url, extra.publicUrl, extra.publicDomain, extra.deployUrl, extra.lovableUrl];
  return candidates.find(isTestableUrl) || null;
}

function documentedDestination(record) {
  const extra = record.extra || {};
  return extra.finalLeadDestination || extra.leadDestination || extra.spreadsheetUrl || '';
}

function spreadsheetIdFrom(record) {
  const extra = record.extra || {};
  const text = [extra.spreadsheetUrl, extra.leadDestination, extra.finalLeadDestination].join(' ');
  const match = text.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  return match ? match[1] : null;
}

/* ---------------------------------------------- classificação de requisições */

const TRACKING_RULES = [
  { name: 'Meta Pixel', test: u => /facebook\.com\/tr/i.test(u), event: u => param(u, 'ev') },
  { name: 'GA4', test: u => /(google-analytics\.com|analytics\.google\.com)\/(g\/)?collect/i.test(u), event: u => param(u, 'en') || param(u, 't') },
  { name: 'Google Ads', test: u => /(googleadservices\.com\/pagead\/conversion|googleads\.g\.doubleclick\.net\/pagead\/viewthroughconversion|google\.com\/pagead\/1p-conversion)/i.test(u), event: () => 'conversion' },
  { name: 'TikTok Pixel', test: u => /analytics\.tiktok\.com\/api\/v2\/pixel/i.test(u), event: () => 'event' },
  { name: 'LinkedIn Insight', test: u => /px\.ads\.linkedin\.com/i.test(u), event: () => 'event' }
];

const TAG_SCRIPTS = [
  { name: 'GTM', test: u => /googletagmanager\.com\/gtm\.js/i.test(u) },
  { name: 'gtag', test: u => /googletagmanager\.com\/gtag\/js/i.test(u) },
  { name: 'Meta Pixel', test: u => /connect\.facebook\.net\/.*fbevents\.js/i.test(u) }
];

const LEAD_HOST_PATTERN =
  /(n8n|\/webhook\/|script\.google(usercontent)?\.com|sheets\.googleapis\.com|bitrix24|hsforms|api\.hubapi\.com|rdstation|api\.resend\.com|hooks\.zapier\.com|hook\.[a-z0-9]+\.make\.com|formspree|getform|sheetdb|sheet\.best|\/functions\/v1\/|\/rest\/v1\/|\/api\/|_serverFn)/i;

const WHATSAPP_PATTERN = /(wa\.me\/|api\.whatsapp\.com|web\.whatsapp\.com)/i;

// Os dados fictícios que o robô digita. Só é "envio de lead" a requisição que os carrega:
// telemetria (Lovable __l5e, RUM, coletores /events, YouTube, contadores) nunca contém esses valores.
const TEST_EMAIL_MARK = `healthcheck.${RUN_ID}`;

function carriesTestData(request) {
  let text = request.url();
  try {
    const buffer = request.postDataBuffer();
    if (buffer) text += ' ' + buffer.toString('utf8');
  } catch (error) {
    // sem corpo
  }
  let decoded = text;
  try { decoded = decodeURIComponent(text.replace(/\+/g, ' ')); } catch (error) { /* mantém bruto */ }
  const haystack = `${text} ${decoded}`.toLowerCase();
  return haystack.includes(TEST_EMAIL_MARK) ||
    haystack.includes('teste health check') ||
    /9\D{0,3}8765\D{0,3}4321/.test(haystack) ||
    /529\D?982\D?247\D?25/.test(haystack);
}

function param(url, key) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(key);
  } catch (error) {
    return null;
  }
}

function classifyLeadDestination(url, method) {
  let host = '';
  let pathname = '';
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    pathname = parsed.pathname;
  } catch (error) {
    host = url;
  }

  const u = url.toLowerCase();
  if (WHATSAPP_PATTERN.test(u)) return 'WhatsApp';
  if (u.includes('n8n') || pathname.includes('/webhook/')) return 'n8n';
  if (u.includes('supabase.co/functions/v1/')) return 'Supabase Edge Function';
  if (u.includes('supabase.co/rest/v1/')) return 'Supabase (tabela)';
  if (u.includes('script.google')) return 'Google Apps Script';
  if (u.includes('sheets.googleapis.com')) return 'Google Sheets API';
  if (u.includes('bitrix24')) return 'Bitrix24';
  if (u.includes('hsforms') || u.includes('hubapi')) return 'HubSpot';
  if (u.includes('rdstation')) return 'RD Station';
  if (u.includes('resend.com')) return 'Resend (e-mail)';
  if (u.includes('zapier')) return 'Zapier';
  if (u.includes('make.com')) return 'Make';
  if (u.includes('_serverfn') || pathname.startsWith('/api/')) return 'Função server da LP';
  return `${method} ${host}`;
}

/* ------------------------------------------------------- inspeção da página */

async function collectPageFacts(page) {
  return page.evaluate(() => {
    const visibleText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
    const nav = performance.getEntriesByType('navigation')[0];
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null;
    const iframes = [...document.querySelectorAll('iframe')].map(f => f.src || '');

    return {
      title: document.title || '',
      textLength: visibleText.length,
      textSample: visibleText.slice(0, 160),
      loadMs: nav ? Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0) : null,
      ttfbMs: nav ? Math.round(nav.responseStart) : null,
      lcpMs: lcp ? Math.round(lcp) : null,
      hasFbq: typeof window.fbq === 'function',
      hasGtag: typeof window.gtag === 'function',
      hasDataLayer: Array.isArray(window.dataLayer),
      captcha: iframes.some(src => /recaptcha|hcaptcha|challenges\.cloudflare/i.test(src)) ||
        Boolean(document.querySelector('.g-recaptcha, .h-captcha, .cf-turnstile')),
      bitrixEmbed: Boolean(document.querySelector('[data-b24-form]')) ||
        [...document.scripts].some(s => /bitrix24/i.test(s.src || '')),
      looksLike404: /\b404\b|page not found|pagina nao encontrada|página não encontrada/i.test(visibleText) && visibleText.length < 400
    };
  });
}

async function detectFormProvider(page) {
  return page.evaluate(() => {
    const scripts = [...document.scripts].map(s => s.src || '').filter(Boolean);
    const iframes = [...document.querySelectorAll('iframe')].map(f => f.src || '').filter(Boolean);
    const html = document.documentElement.innerHTML.toLowerCase();
    const any = needle => scripts.some(s => s.includes(needle)) || iframes.some(s => s.includes(needle));

    if (document.querySelector('[data-b24-form]') || any('bitrix24') || html.includes('data-b24-form')) return 'Bitrix24';
    if (any('hubspot') || html.includes('hsforms')) return 'HubSpot';
    if (any('rdstation')) return 'RD Station';
    if (document.querySelector('form')) return 'Formulário HTML/React';
    const fields = document.querySelectorAll('input[type="email"], input[type="tel"], input[name*="email" i], input[name*="phone" i], textarea, select');
    if (fields.length >= 2) return 'Formulário renderizado';
    return null;
  });
}

/* --------------------------------------------- envio simulado (dry-run) */

const FIELD_SCAN = () => {
  const visible = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };
  const labelFor = el => {
    const parts = [];
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) parts.push(label.innerText);
    }
    const wrap = el.closest('label');
    if (wrap) parts.push(wrap.innerText);
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) labelledBy.split(' ').forEach(id => { const n = document.getElementById(id); if (n) parts.push(n.innerText); });
    return parts.join(' ').slice(0, 120);
  };

  const fields = [];
  document.querySelectorAll('input, textarea, select').forEach(el => {
    const type = (el.getAttribute('type') || el.tagName).toLowerCase();
    if (['hidden', 'submit', 'button', 'image', 'file', 'reset'].includes(type)) return;
    if (el.disabled || el.readOnly) return;
    // checkbox/radio estilizados costumam ficar invisíveis; o rótulo visível conta
    const target = (type === 'checkbox' || type === 'radio') && !visible(el) ? el.closest('label') || el.parentElement : el;
    if (!target || !visible(target)) return;

    const hcId = el.getAttribute('data-hc-id') || `hc-${Math.random().toString(36).slice(2, 9)}`;
    el.setAttribute('data-hc-id', hcId);

    fields.push({
      hcId,
      tag: el.tagName.toLowerCase(),
      type,
      key: [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), el.autocomplete, el.getAttribute('inputmode'), labelFor(el)].join(' ').toLowerCase(),
      empty: type === 'checkbox' || type === 'radio' ? !el.checked : !el.value,
      groupName: el.name || '',
      min: el.min || '',
      max: el.max || '',
      options: el.tagName === 'SELECT' ? [...el.options].filter(o => o.value && !o.disabled).map(o => o.value).slice(0, 3) : [],
      hiddenControl: target !== el
    });
  });
  return fields;
};

const CLICK_SCAN = () => {
  const visible = el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };
  const SUBMIT = /(enviar|envie|quero|cadastr|inscrev|participar|garantir|concluir|finalizar|confirmar|solicitar|receber|falar com|agendar|simular|calcular|ver resultado|come[cç]ar|iniciar|continuar|pr[oó]xim|avan[cç]ar|seguir|submit|send|get started|sign up)/i;
  const SKIP = /(whatsapp|instagram|facebook|linkedin|youtube|pol[ií]tica|privacidade|termos|cookies|login|entrar|voltar|fechar)/i;

  const items = [];
  document.querySelectorAll('button, [role="button"], input[type="submit"], a[href^="#"], a:not([href]), [role="radio"], [role="option"], [data-state]').forEach(el => {
    if (!visible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 80 || SKIP.test(text)) return;
    const inForm = Boolean(el.closest('form'));
    const isSubmit = el.type === 'submit' || SUBMIT.test(text);
    const isOption = ['radio', 'option'].includes(el.getAttribute('role')) || (!isSubmit && text.length <= 40 && Boolean(el.closest('main, section, form, [class*="quiz" i], [class*="step" i]')));
    if (!isSubmit && !isOption) return;
    const hcId = el.getAttribute('data-hc-click') || `hcc-${Math.random().toString(36).slice(2, 9)}`;
    el.setAttribute('data-hc-click', hcId);
    items.push({ hcId, text: text.slice(0, 60), inForm, isSubmit, isOption, isTypeSubmit: el.type === 'submit' });
  });
  return items;
};

const STATE_SIGNATURE = () => {
  const text = (document.body?.innerText || '').length;
  const inputs = document.querySelectorAll('input:not([type=hidden]), textarea, select').length;
  return `${location.href}|${text}|${inputs}|${document.querySelectorAll('[role=dialog]').length}`;
};

function valueForField(field) {
  const key = normalize(field.key);
  const type = field.type;

  if (type === 'email' || /e-?mail/.test(key)) return `${TEST_EMAIL_MARK}@investsmart.com.br`;
  if (type === 'tel' || /(tel|fone|phone|celular|whats|zap)/.test(key)) return '21987654321';
  if (/cpf/.test(key)) return '52998224725';
  if (/cnpj/.test(key)) return '11222333000181';
  if (/cep|postal|zip/.test(key)) return '20040020';
  if (type === 'date' || /nascimento|birth/.test(key)) return type === 'date' ? '1990-01-01' : '01/01/1990';
  if (/sobrenome|last.?name/.test(key)) return 'Automatizado';
  if (/empresa|company|organiza/.test(key)) return 'InvestSmart QA';
  if (/cidade|city|municipio/.test(key)) return 'Rio de Janeiro';
  if (/\buf\b|estado|state/.test(key)) return 'RJ';
  if (/idade|age/.test(key)) return '35';
  if (type === 'url' || /site|website|linkedin/.test(key)) return 'https://investsmart.com.br';
  if (type === 'number' || type === 'range' || /valor|renda|patrim|invest|salario|quantia|credito|parcela/.test(key)) {
    const min = Number(field.min);
    const max = Number(field.max);
    if (Number.isFinite(min) && Number.isFinite(max) && field.max !== '') return String(Math.round((min + max) / 2));
    return '50000';
  }
  if (/nome|name/.test(key)) return 'Teste Health Check';
  if (field.tag === 'textarea') return 'Teste automatizado de saúde (envio simulado, não chega ao destino).';
  return 'Teste';
}

async function fillVisibleFields(frame, state) {
  let fields = [];
  try {
    fields = await frame.evaluate(FIELD_SCAN);
  } catch (error) {
    return 0;
  }

  let filled = 0;
  const radioGroupsDone = new Set();

  for (const field of fields) {
    if (!field.empty) continue;
    const locator = frame.locator(`[data-hc-id="${field.hcId}"]`).first();

    try {
      if (field.type === 'checkbox') {
        await locator.check({ force: true, timeout: 1500 });
      } else if (field.type === 'radio') {
        if (field.groupName && radioGroupsDone.has(field.groupName)) continue;
        radioGroupsDone.add(field.groupName);
        await locator.check({ force: true, timeout: 1500 });
      } else if (field.tag === 'select') {
        if (!field.options.length) continue;
        await locator.selectOption(field.options[0], { timeout: 1500 });
      } else {
        await locator.fill(valueForField(field), { timeout: 2000 });
      }
      filled += 1;
      state.fieldsFilled += 1;
    } catch (error) {
      // campo com máscara/controle customizado: segue sem ele
    }
  }
  return filled;
}

// Select, checkbox e radio do shadcn/Radix (padrão do Lovable) não são <select>/<input> nativos.
async function fillCustomControls(frame, state) {
  let ids = [];
  try {
    ids = await frame.evaluate(() => {
      const visible = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
      const out = [];
      const tag = (el, kind) => { const id = `hcx-${Math.random().toString(36).slice(2, 9)}`; el.setAttribute('data-hc-x', id); out.push({ id, kind }); };
      document.querySelectorAll('[role="checkbox"][aria-checked="false"], button[role="switch"][aria-checked="false"]').forEach(el => { if (visible(el)) tag(el, 'check'); });
      document.querySelectorAll('[role="radiogroup"]').forEach(group => {
        if (group.querySelector('[role="radio"][aria-checked="true"], [data-state="checked"]')) return;
        const first = [...group.querySelectorAll('[role="radio"]')].find(visible);
        if (first) tag(first, 'check');
      });
      document.querySelectorAll('button[role="combobox"], [aria-haspopup="listbox"]').forEach(el => {
        if (!visible(el)) return;
        const text = (el.innerText || '').trim();
        if (!text || /selecione|escolha|select|choose|--/i.test(text) || el.querySelector('[data-placeholder]') || el.hasAttribute('data-placeholder')) tag(el, 'combo');
      });
      return out;
    });
  } catch (error) {
    return;
  }
  for (const control of ids) {
    const locator = frame.locator(`[data-hc-x="${control.id}"]`).first();
    try {
      await locator.click({ timeout: 1500 });
      if (control.kind === 'combo') {
        const option = frame.locator('[role="option"]:not([aria-disabled="true"])').first();
        await option.click({ timeout: 1500 });
      }
      state.fieldsFilled += 1;
    } catch (error) {
      await frame.page().keyboard.press('Escape').catch(() => {});
    }
  }
}

async function pickAndClick(page, state) {
  const frames = page.frames();
  for (const preferSubmit of [true, false]) {
    for (const frame of frames) {
      let items = [];
      try {
        items = await frame.evaluate(CLICK_SCAN);
      } catch (error) {
        continue;
      }

      const ranked = items
        .filter(item => !state.clicked.has(`${frame.url()}|${item.text}`))
        .filter(item => (preferSubmit ? item.isSubmit : item.isOption))
        .sort((a, b) =>
          (b.isTypeSubmit - a.isTypeSubmit) * 4 + (b.inForm - a.inForm) * 2 + (b.isSubmit - a.isSubmit)
        );

      for (const item of ranked.slice(0, 3)) {
        state.clicked.add(`${frame.url()}|${item.text}`);
        try {
          await frame.locator(`[data-hc-click="${item.hcId}"]`).first().click({ timeout: 2500 });
          state.clicks.push(item.text);
          return true;
        } catch (error) {
          // tenta o próximo candidato
        }
      }
    }
  }
  return false;
}

async function runDryRunFunnel(page, state) {
  state.phase = 'submit';
  const startedAt = Date.now();
  const SUCCESS = /(obrigad[oa]|sucesso|recebemos|enviad[oa]s? com|parab[eé]ns|entraremos em contato|inscri[cç][aã]o (confirmada|realizada)|cadastro (realizado|conclu[ií]do)|vaga garantida|thank you)/gi;
  const ERROR = /(obrigat[oó]ri|inv[aá]lid|preencha|informe (seu|um|uma)|required|campo .{0,20}necess|digite um)/gi;
  const countIn = (text, regex) => (text.match(regex) || []).length;
  const readText = () => page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alert"], [role="status"], ol[class*="toast" i] li, [data-sonner-toast]')].map(n => n.innerText).join(' ');
    return `${document.body?.innerText || ''} ${dialogs}`;
  }).catch(() => '');
  const initialText = await readText();

  for (let step = 0; step < THRESHOLDS.maxFunnelSteps; step += 1) {
    if (state.leadRequests.length) break;

    const before = await page.evaluate(STATE_SIGNATURE).catch(() => '');
    for (const frame of page.frames()) {
      await fillVisibleFields(frame, state);
      await fillCustomControls(frame, state);
    }

    const clicked = await pickAndClick(page, state);
    if (!clicked) break;

    // espera a requisição de lead ou mudança de etapa
    for (let i = 0; i < 12 && !state.leadRequests.length; i += 1) {
      await sleep(400);
      const after = await page.evaluate(STATE_SIGNATURE).catch(() => before);
      if (after !== before && i >= 2) break;
    }
  }

  // tolerância final para envios assíncronos (debounce, validação remota)
  for (let i = 0; i < 10 && !state.leadRequests.length; i += 1) await sleep(500);

  const invalid = await page.evaluate(() =>
    document.querySelectorAll(':invalid, [aria-invalid="true"]').length).catch(() => 0);
  const finalText = await readText();

  return {
    durationMs: Date.now() - startedAt,
    invalidFields: invalid,
    // só vale se a mensagem APARECEU depois do envio (não conta texto que já estava na página)
    successMessage: countIn(finalText, SUCCESS) > countIn(initialText, SUCCESS),
    validationErrors: countIn(finalText, ERROR) > countIn(initialText, ERROR)
  };
}

/* --------------------------------------------- probes de endpoint (sem escrever) */

async function probeEndpoint(lead) {
  try {
    if (lead.destination === 'n8n') {
      const response = await fetch(lead.url.split('?')[0], { method: 'GET', signal: AbortSignal.timeout(8000) });
      const body = (await response.text()).slice(0, 400);
      if (response.ok) return { status: 'Ativo', detail: `n8n respondeu ${response.status} a um GET sem dados` };
      if (/not registered for get|did you mean to make a post/i.test(body)) return { status: 'Ativo', detail: 'Webhook n8n registrado (aceita POST)' };
      if (/is not registered|not found|workflow.*(inactive|not active)/i.test(body)) return { status: 'Inativo', detail: 'Webhook n8n NÃO registrado — workflow desativado ou removido' };
      return { status: 'Indeterminado', detail: `n8n respondeu ${response.status}` };
    }
    if (lead.destination === 'Supabase Edge Function') {
      const response = await fetch(lead.url.split('?')[0], { method: 'OPTIONS', signal: AbortSignal.timeout(8000) });
      if (response.status === 404) return { status: 'Inativo', detail: 'Edge Function não encontrada (404)' };
      return { status: 'Ativo', detail: `Edge Function respondeu ${response.status} ao preflight` };
    }
  } catch (error) {
    return { status: 'Indeterminado', detail: `Probe falhou: ${error.message}` };
  }
  return null;
}

/* --------------------------------------------- checagem de uma LP */

async function checkLandingPage(browser, record) {
  const url = testUrlFor(record);
  const item = {
    id: record.id,
    ativo: record.ativo,
    url: url || record.url || '',
    checkedAt: new Date().toISOString(),
    page: { online: null, httpStatus: null, finalUrl: null, rendered: null, title: null, loadMs: null, lcpMs: null, jsErrors: [], failedResources: 0 },
    form: { detected: null, provider: null },
    funnel: { status: 'Não executado', destinations: [], requests: [], whatsapp: false, successMessage: false, clicks: [], fieldsFilled: 0, endpointProbes: [] },
    tracking: { tags: [], pixels: [], pageEvents: [], submitEvents: [] },
    conversion: null,
    destinationDocumented: Boolean(documentedDestination(record)),
    // campos legados lidos por versões antigas do painel
    online: null,
    httpStatus: null,
    formDetected: null,
    formProvider: 'A validar',
    conversionTest: 'Não executado',
    technicalStatus: 'A validar',
    note: ''
  };

  if (!url) {
    item.page.online = null;
    item.funnel.status = 'Não testável';
    return item;
  }

  const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'pt-BR', viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const state = { phase: 'load', leadRequests: [], background: [], clicked: new Set(), clicks: [], fieldsFilled: 0, navigations: [] };
  const origin = new URL(url).origin;

  context.on('page', popup => {
    const popupUrl = popup.url();
    state.navigations.push(popupUrl);
    if (WHATSAPP_PATTERN.test(popupUrl)) state.leadRequests.push({ url: popupUrl, method: 'GET', destination: 'WhatsApp' });
    popup.close().catch(() => {});
  });

  page.on('pageerror', error => {
    if (item.page.jsErrors.length < 5) item.page.jsErrors.push(String(error.message || error).slice(0, 200));
  });

  page.on('response', response => {
    const status = response.status();
    if (status >= 400 && response.request().resourceType() !== 'document' && response.url().startsWith(origin)) {
      item.page.failedResources += 1;
    }
  });

  await page.route('**/*', async route => {
    const request = route.request();
    const reqUrl = request.url();
    const method = request.method();

    const tracker = TRACKING_RULES.find(rule => rule.test(reqUrl));
    if (tracker) {
      let event = tracker.event(reqUrl);
      if (!event && method === 'POST') {
        const body = request.postData() || '';
        event = (body.match(/(?:^|&)ev=([^&]+)/) || body.match(/(?:^|&)en=([^&]+)/) || [])[1] || null;
      }
      const bucket = state.phase === 'submit' ? item.tracking.submitEvents : item.tracking.pageEvents;
      const label = `${tracker.name}${event ? ': ' + decodeURIComponent(event) : ''}`;
      if (!bucket.includes(label)) bucket.push(label);
      if (!item.tracking.pixels.includes(tracker.name)) item.tracking.pixels.push(tracker.name);
      return route.fulfill({ status: 204, body: '' });
    }

    const tag = TAG_SCRIPTS.find(rule => rule.test(reqUrl));
    if (tag && !item.tracking.tags.includes(tag.name)) item.tracking.tags.push(tag.name);

    if (WHATSAPP_PATTERN.test(reqUrl) && request.isNavigationRequest()) {
      state.leadRequests.push({ url: reqUrl, method, destination: 'WhatsApp' });
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>WhatsApp (interceptado)</body></html>' });
    }

    if (state.phase === 'submit') {
      const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method);
      const isLeadGet = method === 'GET' && LEAD_HOST_PATTERN.test(reqUrl) && !/\.(js|css|png|jpe?g|svg|webp|woff2?)(\?|$)/i.test(reqUrl) && !/\/rest\/v1\/.*select=/i.test(reqUrl);
      if (isWrite || isLeadGet) {
        // Segurança: toda escrita é interceptada. Mas só conta como lead se levar os dados de teste.
        if (carriesTestData(request)) {
          state.leadRequests.push({ url: reqUrl.slice(0, 300), method, destination: classifyLeadDestination(reqUrl, method) });
        } else if (state.background.length < 10) {
          try { state.background.push(new URL(reqUrl).host + new URL(reqUrl).pathname.slice(0, 40)); } catch (error) { /* ignora */ }
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          body: JSON.stringify({ success: true, ok: true, id: 'healthcheck-dry-run' })
        });
      }
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        state.navigations.push(reqUrl);
      }
    }

    return route.continue();
  });

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    item.page.httpStatus = response ? response.status() : null;
    item.page.online = Boolean(response && response.ok());
    item.page.finalUrl = page.url();

    if (item.page.online) {
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
      await sleep(1500);

      const facts = await collectPageFacts(page);
      Object.assign(item.page, {
        title: facts.title,
        loadMs: facts.loadMs,
        lcpMs: facts.lcpMs,
        rendered: facts.textLength >= THRESHOLDS.minVisibleText && !facts.looksLike404,
        textLength: facts.textLength,
        looksLike404: facts.looksLike404
      });
      item.tracking.fbq = facts.hasFbq;
      item.tracking.gtag = facts.hasGtag || facts.hasDataLayer;

      const provider = await detectFormProvider(page);
      item.form.detected = Boolean(provider);
      item.form.provider = provider || 'Não detectado na carga';

      if (item.page.rendered) {
        const funnel = await runDryRunFunnel(page, state);
        item.funnel.clicks = state.clicks.slice(0, 10);
        item.funnel.fieldsFilled = state.fieldsFilled;
        item.funnel.successMessage = funnel.successMessage;
        item.funnel.requests = state.leadRequests.slice(0, 6);
        item.funnel.destinations = [...new Set(state.leadRequests.map(r => r.destination))];
        item.funnel.whatsapp = item.funnel.destinations.includes('WhatsApp');
        item.funnel.backgroundRequests = [...new Set(state.background)].slice(0, 5);
        if (state.fieldsFilled > 0 && !item.form.detected) {
          item.form.detected = true;
          item.form.provider = 'Formulário em etapa (modal/quiz)';
        }

        const claimsSuccess = funnel.successMessage || state.navigations.some(nav => /obrigad|thank|sucesso|confirmac/i.test(nav));
        if (state.leadRequests.length) {
          item.funnel.status = 'Envia lead';
        } else if (claimsSuccess) {
          // A página diz que deu certo, mas nenhum dado saiu dela: formulário falso, lead perdido.
          item.funnel.status = 'Não envia lead';
          item.funnel.note = state.navigations.some(nav => /obrigad|thank|sucesso|confirmac/i.test(nav))
            ? 'redireciona para a página de obrigado sem enviar os dados'
            : `mostra confirmação ao visitante, mas os dados não saem da página${state.background.length ? ` (só telemetria: ${[...new Set(state.background)].slice(0, 2).join(', ')})` : ''}`;
        } else if (facts.captcha) {
          item.funnel.status = 'Inconclusivo (captcha)';
        } else if (state.fieldsFilled === 0) {
          item.funnel.status = 'Formulário não alcançado';
        } else if (funnel.invalidFields > 0 || funnel.validationErrors) {
          item.funnel.status = 'Inconclusivo (validação bloqueou)';
        } else {
          item.funnel.status = 'Inconclusivo (envio não concluído)';
        }
        item.funnel.successShown = funnel.successMessage;

        for (const lead of state.leadRequests.slice(0, 3)) {
          const probe = await probeEndpoint(lead);
          if (probe) item.funnel.endpointProbes.push({ destination: lead.destination, ...probe });
        }
      }
    }
  } catch (error) {
    item.page.online = false;
    item.page.error = error.message.split('\n')[0].slice(0, 200);
  } finally {
    await context.close().catch(() => {});
  }

  return item;
}

/* --------------------------------------------- conversão real (leads) */

async function googleAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  if (googleAccessToken.cache) return googleAccessToken.cache;

  const credentials = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key, 'base64url');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` })
  });
  if (!response.ok) throw new Error(`Google OAuth ${response.status}`);
  googleAccessToken.cache = (await response.json()).access_token;
  googleAccessToken.clientEmail = credentials.client_email;
  return googleAccessToken.cache;
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && value > 30000 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400000) + 3 * 3600000); // serial do Sheets, horário de Brasília
  }
  const text = String(value).trim();
  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    const year = br[3].length === 2 ? 2000 + Number(br[3]) : Number(br[3]);
    const iso = `${year}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}T${(br[4] || '12').padStart(2, '0')}:${br[5] || '00'}:${br[6] || '00'}-03:00`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(text) || text.length <= 10 ? text : `${text}-03:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function timestampsFromRows(rows, config) {
  if (!rows.length) return [];
  const header = rows[0].map(cell => normalize(cell));
  let column = -1;

  if (config.timestampColumn) column = header.indexOf(normalize(config.timestampColumn));
  if (column < 0) column = header.findIndex(h => /(carimbo|timestamp|data|date|criado|created|enviado|submitted|hora)/.test(h));
  if (column < 0) {
    // escolhe a coluna em que a maioria dos valores é data
    const sample = rows.slice(1, 40);
    let best = { index: -1, hits: 0 };
    (rows[0] || []).forEach((_, index) => {
      const hits = sample.filter(row => parseDate(row[index])).length;
      if (hits > best.hits) best = { index, hits };
    });
    column = best.hits >= Math.min(3, sample.length) ? best.index : -1;
  }
  if (column < 0) throw new Error('Coluna de data do lead não identificada na planilha');

  let filterIndex = -1;
  if (config.filter && config.filter.column) filterIndex = header.indexOf(normalize(config.filter.column));

  return rows.slice(1)
    .filter(row => filterIndex < 0 || normalize(row[filterIndex]).includes(normalize(config.filter.contains)))
    .map(row => parseDate(row[column]))
    .filter(Boolean);
}

async function readGoogleSheet(config) {
  const token = await googleAccessToken();
  if (!token) return { error: 'credencial', message: 'GOOGLE_SERVICE_ACCOUNT_JSON não configurado' };
  const headers = { authorization: `Bearer ${token}` };
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`;

  let range = config.range;
  if (!range) {
    const meta = await fetch(`${base}?fields=sheets.properties.title`, { headers });
    if (meta.status === 403 || meta.status === 404) {
      return { error: 'acesso', message: `Planilha não compartilhada com ${googleAccessToken.clientEmail || 'a conta de serviço'}` };
    }
    if (!meta.ok) throw new Error(`Sheets ${meta.status}`);
    range = `'${(await meta.json()).sheets[0].properties.title}'`;
  }

  const response = await fetch(`${base}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`, { headers });
  if (response.status === 403 || response.status === 404) {
    return { error: 'acesso', message: `Planilha não compartilhada com ${googleAccessToken.clientEmail || 'a conta de serviço'}` };
  }
  if (!response.ok) throw new Error(`Sheets ${response.status}`);
  const rows = (await response.json()).values || [];
  return { timestamps: timestampsFromRows(rows, config), lookbackDays: 3650 };
}

function secret(name) {
  if (!name) return null;
  const bag = readJson.secretBag || (readJson.secretBag = (() => {
    try { return JSON.parse(process.env.LEAD_SOURCE_SECRETS || '{}'); } catch (error) { return {}; }
  })());
  return bag[name] || process.env[name] || null;
}

async function readSupabase(config) {
  const key = secret(config.keySecret);
  if (!key) return { error: 'credencial', message: `Segredo ${config.keySecret} não configurado` };
  const since = new Date(Date.now() - 28 * 86400000).toISOString();
  const column = config.createdAtColumn || 'created_at';
  const filter = config.filter ? `&${config.filter}` : '';
  const url = `${config.url.replace(/\/$/, '')}/rest/v1/${config.table}?select=${column}&${column}=gte.${since}&order=${column}.desc&limit=5000${filter}`;
  const response = await fetch(url, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  const rows = await response.json();
  const last = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/${config.table}?select=${column}&order=${column}.desc&limit=1${filter}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  const lastRows = last.ok ? await last.json() : [];
  return {
    timestamps: rows.map(row => parseDate(row[column])).filter(Boolean),
    lastLeadAt: lastRows[0] ? parseDate(lastRows[0][column]) : null
  };
}

async function readBitrix(config) {
  const webhook = secret(config.webhookSecret);
  if (!webhook) return { error: 'credencial', message: `Segredo ${config.webhookSecret} não configurado` };
  const since = new Date(Date.now() - 28 * 86400000).toISOString();
  const timestamps = [];
  let start = 0;
  for (let page = 0; page < 20; page += 1) {
    const params = new URLSearchParams({ 'order[DATE_CREATE]': 'DESC', 'filter[>=DATE_CREATE]': since, 'select[]': 'DATE_CREATE', start: String(start) });
    Object.entries(config.filter || {}).forEach(([k, v]) => params.append(`filter[${k}]`, v));
    const response = await fetch(`${webhook.replace(/\/$/, '')}/crm.lead.list.json?${params}`);
    if (!response.ok) throw new Error(`Bitrix24 ${response.status}`);
    const body = await response.json();
    (body.result || []).forEach(lead => { const d = parseDate(lead.DATE_CREATE); if (d) timestamps.push(d); });
    if (body.next === undefined) break;
    start = body.next;
  }
  return { timestamps };
}

/*
 * n8n: descobre automaticamente o workflow de cada LP pelo webhook capturado no envio simulado
 * e lê as execuções (sucesso = lead processado, erro = lead perdido). Precisa só de
 * N8N_API_URL + N8N_API_KEY (ou dentro de LEAD_SOURCE_SECRETS), uma vez para todas as LPs.
 */
const n8nState = { workflows: null, error: null };

function n8nCredentials() {
  const url = secret('N8N_API_URL') || 'https://n8n.investsmart.com.br';
  const key = secret('N8N_API_KEY');
  return key ? { url: url.replace(/\/$/, ''), key } : null;
}

async function n8nGet(pathname) {
  const creds = n8nCredentials();
  const response = await fetch(`${creds.url}/api/v1${pathname}`, {
    headers: { 'X-N8N-API-KEY': creds.key, accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`n8n API ${response.status}`);
  return response.json();
}

async function n8nWebhookIndex() {
  if (n8nState.workflows || n8nState.error) return n8nState.workflows;
  try {
    const index = {};
    let cursor = '';
    for (let page = 0; page < 20; page += 1) {
      const body = await n8nGet(`/workflows?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      (body.data || []).forEach(workflow => {
        (workflow.nodes || [])
          .filter(node => /webhook|formtrigger/i.test(node.type || ''))
          .forEach(node => {
            const paths = [node.parameters && node.parameters.path, node.webhookId].filter(Boolean);
            paths.forEach(p => { index[String(p).replace(/^\//, '')] = { id: workflow.id, name: workflow.name, active: workflow.active }; });
          });
      });
      if (!body.nextCursor) break;
      cursor = body.nextCursor;
    }
    n8nState.workflows = index;
  } catch (error) {
    n8nState.error = error.message;
  }
  return n8nState.workflows;
}

function n8nPathFromUrl(url) {
  const match = String(url || '').match(/\/webhook(?:-test)?\/([^?#]+)/);
  return match ? decodeURIComponent(match[1]).replace(/\/$/, '') : null;
}

async function readN8n(webhookUrl) {
  if (!n8nCredentials()) return { error: 'credencial', message: 'Chave da API do n8n (N8N_API_KEY) não configurada' };
  const index = await n8nWebhookIndex();
  if (!index) return { error: 'acesso', message: `API do n8n indisponível: ${n8nState.error}` };

  const path = n8nPathFromUrl(webhookUrl);
  const workflow = path && (index[path] || index[path.split('/')[0]]);
  if (!workflow) return { error: 'acesso', message: `Webhook /${path} não encontrado em nenhum workflow do n8n` };

  const since = Date.now() - 28 * 86400000;
  const maxLookback = Date.now() - 180 * 86400000;
  const timestamps = [];
  let lastSuccess = null;
  let oldestSeen = null;
  let errors7d = 0;
  let lastError = null;
  let cursor = '';
  // Lê 28 dias para as métricas e continua (até 180 dias) só até achar o último lead com sucesso,
  // para provar há quantos dias não há conversão.
  for (let page = 0; page < 80; page += 1) {
    const body = await n8nGet(`/executions?workflowId=${workflow.id}&limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    let pastLookback = false;
    (body.data || []).forEach(execution => {
      const at = parseDate(execution.startedAt);
      if (!at) return;
      if (!oldestSeen || at < oldestSeen) oldestSeen = at;
      if (at.getTime() < maxLookback) { pastLookback = true; return; }
      const ok = execution.status === 'success' || (execution.finished && !execution.status);
      if (ok && (!lastSuccess || at > lastSuccess)) lastSuccess = at;
      if (at.getTime() < since) return;
      if (ok) timestamps.push(at);
      else if (['error', 'crashed', 'failed'].includes(execution.status)) {
        if (at.getTime() > Date.now() - 7 * 86400000) errors7d += 1;
        if (!lastError || at > lastError) lastError = at;
      }
    });
    const doneWithWindow = oldestSeen && oldestSeen.getTime() < since;
    if (pastLookback || !body.nextCursor || (doneWithWindow && lastSuccess)) break;
    cursor = body.nextCursor;
  }
  const lookbackDays = oldestSeen ? Math.max(1, Math.round((Date.now() - oldestSeen.getTime()) / 86400000)) : 0;

  return { timestamps, lastLeadAt: lastSuccess, lookbackDays: lookbackDays || 1, n8n: { workflow: workflow.name, active: workflow.active, errors7d, lastErrorAt: lastError ? lastError.toISOString() : null } };
}

async function readHttpJson(config) {
  const token = secret(config.tokenSecret);
  const response = await fetch(config.url, { headers: token ? { authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Endpoint ${response.status}`);
  const body = await response.json();
  if (Array.isArray(body)) return { timestamps: body.map(v => parseDate(typeof v === 'object' ? v.createdAt || v.created_at || v.date : v)).filter(Boolean) };
  if (Array.isArray(body.leads)) return { timestamps: body.leads.map(v => parseDate(v.createdAt || v.created_at || v.date || v)).filter(Boolean), lastLeadAt: parseDate(body.lastLeadAt) };
  return { aggregates: { leads24h: body.leads24h, leads7d: body.leads7d, leadsPrev7d: body.leadsPrev7d, leads28d: body.leads28d }, lastLeadAt: parseDate(body.lastLeadAt) };
}

function analyseConversion(result, now = Date.now()) {
  const HOUR = 3600000;
  const DAY = 24 * HOUR;
  let leads24h; let leads7d; let leadsPrev7d; let leads28d; let lastLeadAt = result.lastLeadAt || null;
  const daily = [];

  if (result.timestamps) {
    const times = result.timestamps.map(d => d.getTime()).filter(t => t <= now + HOUR).sort((a, b) => b - a);
    if (!lastLeadAt && times.length) lastLeadAt = new Date(times[0]);
    const within = (from, to) => times.filter(t => t > now - to && t <= now - from).length;
    leads24h = within(0, DAY);
    leads7d = within(0, 7 * DAY);
    leadsPrev7d = within(7 * DAY, 14 * DAY);
    leads28d = within(0, 28 * DAY);
    result.leadsInNoConvWindow = within(0, THRESHOLDS.noConversionDays * DAY);
    for (let d = 13; d >= 0; d -= 1) daily.push(within(d * DAY, (d + 1) * DAY));
  } else {
    ({ leads24h, leads7d, leadsPrev7d, leads28d } = result.aggregates || {});
  }

  const conversion = {
    leads24h: leads24h ?? null,
    leads7d: leads7d ?? null,
    leadsPrev7d: leadsPrev7d ?? null,
    leads28d: leads28d ?? null,
    lastLeadAt: lastLeadAt ? lastLeadAt.toISOString() : null,
    daily,
    trendPct: leadsPrev7d ? Math.round(((leads7d - leadsPrev7d) / leadsPrev7d) * 100) : null
  };

  // ---- Regra objetiva: nenhuma conversão nos últimos N dias, confrontando com a data atual ----
  const windowDays = THRESHOLDS.noConversionDays;
  const windowStart = now - windowDays * DAY;
  let leadsInWindow = result.leadsInNoConvWindow;
  if (leadsInWindow === undefined) {
    const agg = result.aggregates || {};
    if (Number.isInteger(agg.leads72h)) leadsInWindow = agg.leads72h;
    else if (lastLeadAt) leadsInWindow = lastLeadAt.getTime() < windowStart ? 0 : null;
    else if (agg.leads7d === 0) leadsInWindow = 0;
    else leadsInWindow = null;
  }
  const daysWithout = lastLeadAt ? Math.floor((now - lastLeadAt.getTime()) / DAY) : null;
  const lookbackDays = result.lookbackDays || 28;
  conversion.noConversionCheck = {
    rule: `Nenhuma conversão nos últimos ${windowDays} dias`,
    referenceAt: new Date(now).toISOString(),
    windowStart: new Date(windowStart).toISOString(),
    leadsInWindow,
    lastLeadAt: conversion.lastLeadAt,
    daysWithoutConversion: daysWithout,
    lookbackDays,
    result: leadsInWindow === 0 ? 'Sem conversão' : leadsInWindow > 0 ? 'Com conversão' : 'Indeterminado'
  };
  if (leadsInWindow === 0) {
    const sinceText = lastLeadAt
      ? `Último lead: ${fmtBR(lastLeadAt)}, há ${daysWithout} dia(s).`
      : `Nenhum lead com sucesso em todo o histórico disponível na fonte (${lookbackDays} dia(s) de registros).`;
    conversion.status = lastLeadAt ? `Sem conversão há ${daysWithout} dias` : 'Sem conversão (nenhum lead no histórico)';
    conversion.severity = 'critical';
    conversion.reason = `Zero conversões entre ${fmtBR(windowStart)} e ${fmtBR(now)} (data atual). ${sinceText}`;
    conversion.noConversionCheck.evidence = conversion.reason;
    return conversion;
  }

  const hoursSince = lastLeadAt ? (now - lastLeadAt.getTime()) / HOUR : null;
  // ritmo de referência: os 28 dias, exceto o período de silêncio atual
  const baselineHours = Math.max(24, 28 * 24 - (hoursSince || 0));
  const baselineLeads = typeof leads28d === 'number' ? leads28d : null;
  const ratePerHour = baselineLeads !== null ? baselineLeads / baselineHours : null;
  conversion.expectedPerDay = ratePerHour !== null ? Math.round(ratePerHour * 24 * 10) / 10 : null;

  if (!leads28d && !lastLeadAt) {
    conversion.status = 'Sem leads em 28 dias';
    conversion.severity = 'attention';
    conversion.reason = 'Nenhum lead nos últimos 28 dias. Campanha pausada ou funil quebrado.';
    return conversion;
  }

  if (hoursSince !== null && ratePerHour !== null) {
    // Esperado = média de leads na MESMA janela de horário nos dias anteriores (respeita madrugada,
    // horário comercial e fim de semana); sem timestamps, cai no ritmo médio uniforme.
    let expected = ratePerHour * hoursSince;
    if (result.timestamps && hoursSince < 14 * 24) {
      const times = result.timestamps.map(d => d.getTime());
      const silenceMs = hoursSince * HOUR;
      const counts = [];
      for (let k = 1; k * DAY + silenceMs <= 28 * DAY; k += 1) {
        const end = now - k * DAY;
        counts.push(times.filter(t => t > end - silenceMs && t <= end).length);
      }
      if (counts.length >= 7) expected = counts.reduce((a, b) => a + b, 0) / counts.length;
    }
    conversion.expectedInSilence = Math.round(expected * 10) / 10;
    const probability = Math.exp(-expected);
    conversion.silenceHours = Math.round(hoursSince);
    conversion.silenceProbability = Number(probability.toFixed(4));
    if (expected >= THRESHOLDS.silenceMinExpected && probability < THRESHOLDS.silenceProbability) {
      conversion.status = 'Conversão parada';
      conversion.severity = 'critical';
      conversion.reason = `Sem leads há ${Math.round(hoursSince)} h; no ritmo normal seriam ~${Math.round(expected)} nesse período (chance de ser acaso < ${(THRESHOLDS.silenceProbability * 100).toFixed(0)}%).`;
      return conversion;
    }
  }

  if (typeof leadsPrev7d === 'number' && leadsPrev7d >= THRESHOLDS.dropMinPrevious && leads7d < leadsPrev7d * THRESHOLDS.dropRatio) {
    conversion.status = 'Queda de conversão';
    conversion.severity = 'attention';
    conversion.reason = `${leads7d} leads em 7 dias contra ${leadsPrev7d} na semana anterior (${conversion.trendPct}%).`;
    return conversion;
  }

  conversion.status = leads7d > 0 ? 'Convertendo' : 'Sem leads em 7 dias';
  conversion.severity = leads7d > 0 ? 'ok' : 'attention';
  conversion.reason = leads7d > 0
    ? `${leads7d} leads em 7 dias${conversion.trendPct !== null ? ` (${conversion.trendPct >= 0 ? '+' : ''}${conversion.trendPct}% vs semana anterior)` : ''}.`
    : 'Nenhum lead nos últimos 7 dias, mas houve leads no mês.';
  return conversion;
}

async function conversionFor(record, sources, sheetUsage, item) {
  let config = sources[record.id];
  if (!config) {
    // 1º n8n: o webhook capturado no envio simulado (ou documentado) identifica o workflow sozinho
    const captured = ((item && item.funnel && item.funnel.requests) || []).find(r => r.destination === 'n8n');
    const documented = [record.extra && record.extra.webhookUrl, documentedDestination(record)].find(v => /\/webhook\//.test(v || ''));
    const webhookUrl = (captured && captured.url) || documented;
    const spreadsheetId = spreadsheetIdFrom(record);
    if (webhookUrl && (n8nCredentials() || !spreadsheetId)) config = { type: 'n8n', webhookUrl, auto: true };
    else if (spreadsheetId) config = { type: 'google-sheet', spreadsheetId, auto: true };
  }
  if (!config) {
    return { status: 'Não monitorada', severity: 'neutral', reason: 'Destino do lead não usa n8n nem planilha documentada; configurar em data/conversion-sources.json.' };
  }

  const base = { source: config.type, auto: Boolean(config.auto) };
  if (config.type === 'google-sheet' && !config.filter && (sheetUsage[config.spreadsheetId] || 0) > 1) {
    base.sharedSource = true;
  }

  try {
    let result;
    if (config.type === 'n8n') result = await readN8n(config.webhookUrl);
    else if (config.type === 'google-sheet') result = await readGoogleSheet(config);
    else if (config.type === 'supabase') result = await readSupabase(config);
    else if (config.type === 'bitrix') result = await readBitrix(config);
    else if (config.type === 'http-json') result = await readHttpJson(config);
    else return { ...base, status: 'Fonte inválida', severity: 'neutral', reason: `Tipo ${config.type} desconhecido.` };

    if (result.error) {
      return { ...base, status: result.error === 'credencial' ? 'Não monitorada' : 'Sem acesso à fonte', severity: 'neutral', reason: result.message };
    }
    const analysis = analyseConversion(result);
    analysis.sourceLabel = result.n8n ? `n8n · workflow “${result.n8n.workflow}”`
      : config.type === 'google-sheet' ? 'Planilha Google de leads'
      : config.type === 'supabase' ? `Supabase · tabela ${config.table}`
      : config.type === 'bitrix' ? 'Bitrix24 (CRM)' : 'Endpoint de leads';
    if (analysis.noConversionCheck) analysis.noConversionCheck.source = analysis.sourceLabel;
    if (analysis.noConversionCheck && analysis.noConversionCheck.evidence) analysis.reason += ` Fonte: ${analysis.sourceLabel}.`;
    if (result.n8n) {
      analysis.n8n = result.n8n;
      if (result.n8n.active === false && analysis.severity !== 'critical') {
        analysis.status = 'Workflow n8n desativado';
        analysis.severity = 'critical';
        analysis.reason = `O workflow “${result.n8n.workflow}” que recebe os leads está desativado no n8n.`;
      } else if (result.n8n.errors7d > 0) {
        const recent = result.n8n.lastErrorAt && Date.now() - new Date(result.n8n.lastErrorAt).getTime() < 86400000;
        analysis.reason += ` ${result.n8n.errors7d} execução(ões) com erro no n8n em 7 dias (leads possivelmente perdidos; última ${new Date(result.n8n.lastErrorAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}).`;
        if (recent && analysis.severity !== 'critical') {
          analysis.severity = 'critical';
          analysis.status = 'Leads com erro no n8n';
        } else if (analysis.severity === 'ok') {
          analysis.severity = 'attention';
        }
      }
    }
    if (base.sharedSource) analysis.reason += ' Planilha compartilhada com outra LP: números somados.';
    return { ...base, ...analysis };
  } catch (error) {
    return { ...base, status: 'Erro na fonte', severity: 'attention', reason: error.message.slice(0, 200) };
  }
}

/* --------------------------------------------- veredito */

function verdictFor(item, record) {
  const reasons = [];
  const add = (severity, text) => reasons.push({ severity, text });
  const p = item.page;
  const f = item.funnel;
  let score = 100;

  if (!item.url) {
    add('neutral', 'Sem URL pública cadastrada; não foi possível testar.');
    return { verdict: 'Não testável', severity: 'neutral', score: null, reasons };
  }

  if (p.online === false) {
    add('critical', p.error ? `Página não carregou: ${p.error}` : `Página respondeu HTTP ${p.httpStatus}.`);
    return { verdict: 'Crítico', severity: 'critical', score: 0, reasons };
  }
  if (p.rendered === false) {
    add('critical', p.looksLike404 ? 'A página carrega, mas mostra 404/“não encontrada”.' : `Página em branco: só ${p.textLength || 0} caracteres visíveis após carregar (falha de JavaScript ou publicação).`);
    score -= 60;
  }
  if (p.jsErrors.length) { add('attention', `${p.jsErrors.length} erro(s) de JavaScript: ${p.jsErrors[0]}`); score -= 8; }
  if (p.failedResources > 2) { add('attention', `${p.failedResources} recursos do próprio site falharam (imagens/scripts).`); score -= 5; }
  if ((p.lcpMs && p.lcpMs > THRESHOLDS.slowLcpMs) || (p.loadMs && p.loadMs > THRESHOLDS.slowLoadMs)) {
    add('attention', `Carregamento lento (LCP ${p.lcpMs ? (p.lcpMs / 1000).toFixed(1) + ' s' : '—'}, load ${p.loadMs ? (p.loadMs / 1000).toFixed(1) + ' s' : '—'}). Perde conversão no celular.`);
    score -= 7;
  }

  if (f.status === 'Envia lead') {
    const inactive = f.endpointProbes.filter(probe => probe.status === 'Inativo');
    if (inactive.length) {
      add('critical', `O formulário envia para ${inactive[0].destination}, mas o destino está fora do ar: ${inactive[0].detail}.`);
      score -= 45;
    } else {
      add('ok', `Envio simulado chegou até: ${f.destinations.join(', ')}.`);
    }
  } else if (f.status === 'Não envia lead') {
    add('critical', `Formulário falso: ${f.note || 'confirma o envio sem enviar os dados'}. Leads estão sendo perdidos.`);
    score -= 45;
  } else if (f.status === 'Formulário não alcançado') {
    add('attention', 'O robô não encontrou um formulário preenchível (pode estar atrás de quiz/modal customizado). Validar manualmente.');
    score -= 15;
  } else if (f.status.startsWith('Inconclusivo')) {
    add('attention', `O robô não conseguiu concluir o envio (${f.status.replace(/^Inconclusivo \(|\)$/g, '')}); nenhum dado saiu da página nem houve confirmação. Validar manualmente.`);
    score -= 10;
  }

  const hasMeta = item.tracking.pixels.includes('Meta Pixel') || item.tracking.tags.includes('Meta Pixel') || item.tracking.fbq;
  const hasGoogle = item.tracking.tags.includes('GTM') || item.tracking.tags.includes('gtag') || item.tracking.gtag;
  if (!hasMeta && !hasGoogle) {
    add('attention', 'Nenhum pixel/tag de mensuração detectado (Meta, GTM ou GA4). Campanhas não conseguem otimizar.');
    score -= 10;
  } else if (f.status === 'Envia lead' && hasMeta && !item.tracking.submitEvents.some(e => /Meta Pixel: (Lead|CompleteRegistration|SubmitApplication|Contact|Schedule)/i.test(e))) {
    add('attention', 'Meta Pixel instalado, mas nenhum evento de conversão (Lead) dispara no envio.');
    score -= 6;
  }

  const c = item.conversion || {};
  if (c.severity === 'critical') { add('critical', c.reason); score -= 35; }
  else if (c.severity === 'attention') { add('attention', c.reason); score -= 12; }
  else if (c.severity === 'ok') add('ok', c.reason);

  const severity = reasons.some(r => r.severity === 'critical') ? 'critical' : reasons.some(r => r.severity === 'attention') ? 'attention' : 'ok';
  const verdict = severity === 'critical' ? 'Crítico' : severity === 'attention' ? 'Atenção' : 'OK';
  return { verdict, severity, score: Math.max(0, Math.min(100, score)), reasons };
}

function applyLegacyFields(item) {
  item.online = item.page.online;
  item.httpStatus = item.page.httpStatus;
  item.formDetected = item.form.detected;
  item.formProvider = item.form.provider || 'A validar';
  item.conversionTest = item.funnel.status;
  item.technicalStatus = item.verdict === 'OK' ? 'Operacional' : item.verdict;
  item.note = (item.reasons.find(r => r.severity !== 'ok') || item.reasons[0] || {}).text || '';
}

/* --------------------------------------------- resumo (regra + IA opcional) */

function ruleSummary(items) {
  const count = sev => items.filter(i => i.severity === sev).length;
  const critical = items.filter(i => i.severity === 'critical');
  const lines = [
    `${count('ok')} OK, ${count('attention')} em atenção, ${count('critical')} críticas e ${count('neutral')} não testáveis.`
  ];
  critical.slice(0, 5).forEach(item => {
    const reason = item.reasons.find(r => r.severity === 'critical');
    lines.push(`• ${item.ativo.replace(/^LP - /, '')}: ${reason ? reason.text : item.verdict}`);
  });
  return lines.join('\n');
}

async function aiSummary(items) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const compact = items
    .filter(i => i.severity !== 'ok')
    .map(i => ({ lp: i.ativo, veredito: i.verdict, score: i.score, motivos: i.reasons.filter(r => r.severity !== 'ok').map(r => r.text), leads7d: i.conversion?.leads7d ?? null }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.HEALTHCHECK_AI_MODEL || 'claude-sonnet-5-5',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content:
            'Você é o analista de Growth Ops da InvestSmart. Com base no health check abaixo, escreva em português do Brasil ' +
            'um resumo executivo de no máximo 6 linhas: primeiro o estado geral, depois as 3 a 5 ações mais urgentes, ' +
            'priorizando perda de leads (formulário que não envia, destino fora do ar, conversão parada) antes de tracking e performance. ' +
            'Cite as LPs pelo nome. Não invente dados.\n\n' +
            `Total de LPs: ${items.length}. Itens com problema:\n${JSON.stringify(compact).slice(0, 12000)}`
        }]
      }),
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) return null;
    const body = await response.json();
    const text = (body.content || []).filter(part => part.type === 'text').map(part => part.text).join('\n').trim();
    return text ? { model: body.model, text } : null;
  } catch (error) {
    return null;
  }
}

/* --------------------------------------------- histórico e alertas */

function updateHistory(items, generatedAt, touchedIds, lpIds) {
  const history = readJson(historyPath, { schema: 'growth-ops-health-history-v1', runs: [], lp: {} });
  const previous = {};
  Object.entries(history.lp || {}).forEach(([id, entries]) => { previous[id] = entries[entries.length - 1]; });

  history.runs.push({
    at: generatedAt,
    ok: items.filter(i => i.severity === 'ok').length,
    attention: items.filter(i => i.severity === 'attention').length,
    critical: items.filter(i => i.severity === 'critical').length,
    leads24h: items.reduce((total, i) => total + (i.conversion?.leads24h || 0), 0)
  });
  history.runs = history.runs.slice(-180);

  Object.keys(history.lp || {}).forEach(id => { if (!lpIds.has(id)) delete history.lp[id]; });

  items.filter(item => touchedIds.has(item.id)).forEach(item => {
    const entries = history.lp[item.id] || [];
    entries.push({ at: generatedAt, v: item.verdict, s: item.score, l24: item.conversion?.leads24h ?? null });
    history.lp[item.id] = entries.slice(-60);
    const prev = previous[item.id];
    item.previousVerdict = prev ? prev.v : null;
    const sinceEntry = [...entries].reverse().find(entry => entry.v !== item.verdict);
    const firstSame = sinceEntry ? entries[entries.indexOf(sinceEntry) + 1] : entries[0];
    item.verdictSince = firstSame ? firstSame.at : generatedAt;
  });

  return history;
}

function writeAlerts(items, payload) {
  const critical = items.filter(i => i.severity === 'critical');
  const newly = critical.filter(i => i.previousVerdict && i.previousVerdict !== 'Crítico');
  const lines = [
    `## Health Check das Landing Pages — ${new Date(payload.generatedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    '',
    `**${critical.length} LP(s) crítica(s)**${newly.length ? `, ${newly.length} nova(s) desde a última execução` : ''}.`,
    ''
  ];
  critical.forEach(item => {
    const reason = item.reasons.filter(r => r.severity === 'critical').map(r => r.text).join(' ');
    lines.push(`- ${newly.includes(item) ? '🆕 ' : ''}**${item.ativo}** — ${item.url}\n  ${reason}`);
  });
  const noConv = items.filter(i => i.conversion?.noConversionCheck?.result === 'Sem conversão');
  const notDemonstrable = items.filter(i => i.url && !i.conversion?.noConversionCheck);
  lines.push('', `### Sem conversão nos últimos ${THRESHOLDS.noConversionDays} dias (referência: ${fmtBR(payload.generatedAt)})`, '');
  if (noConv.length) {
    lines.push('| LP | Último lead | Dias sem conversão | Fonte |', '|---|---|---|---|');
    noConv.forEach(i => {
      const nc = i.conversion.noConversionCheck;
      lines.push(`| ${i.ativo} | ${nc.lastLeadAt ? fmtBR(nc.lastLeadAt) : `nenhum em ${nc.lookbackDays} dias`} | ${nc.daysWithoutConversion ?? `> ${nc.lookbackDays}`} | ${nc.source || ''} |`);
    });
  } else {
    lines.push('Nenhuma LP monitorada está sem conversão no período.');
  }
  if (notDemonstrable.length) {
    lines.push('', `⚠️ ${notDemonstrable.length} LP(s) sem fonte de leads conectada: ausência de conversão **não demonstrável** para elas (configurar N8N_API_KEY).`);
  }
  if (payload.summary?.ai) lines.push('', '### Resumo (IA)', '', payload.summary.ai.text);
  lines.push('', 'Painel: https://gestaobankrio-code.github.io/growth-ops-investsmart/');
  writeFileAtomic(alertsPath, lines.join('\n') + '\n', false);
  return { critical: critical.length, newCritical: newly.length };
}


/* ------------------------------------------------------- integridade dos dados */

const VERDICTS = { OK: 'ok', 'Atenção': 'attention', 'Crítico': 'critical', 'Não testável': 'neutral' };

// Grava em arquivo temporário, relê e valida o JSON, e só então substitui o original.
function writeFileAtomic(file, content, isJson = true) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content, 'utf8');
  if (isJson) JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.renameSync(tmp, file);
}

function validatePayload(payload, lpIds, fullRun) {
  const problems = [];
  const isIso = value => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
  if (payload.schema !== SCHEMA) problems.push(`schema inesperado: ${payload.schema}`);
  if (!isIso(payload.generatedAt)) problems.push('generatedAt inválido');
  if (!Array.isArray(payload.items)) problems.push('items não é lista');

  const items = payload.items || [];
  const ids = items.map(item => item && item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) problems.push(`ids duplicados: ${[...new Set(duplicates)].join(', ')}`);
  const unknown = ids.filter(id => !lpIds.has(id));
  if (unknown.length) problems.push(`itens fora do inventário: ${unknown.join(', ')}`);
  if (fullRun) {
    const missing = [...lpIds].filter(id => !ids.includes(id));
    if (missing.length) problems.push(`LPs sem resultado: ${missing.join(', ')}`);
  }

  items.forEach(item => {
    if (!item || !item.id) return problems.push('item sem id');
    if (VERDICTS[item.verdict] !== item.severity) problems.push(`${item.id}: veredito/severidade inconsistentes (${item.verdict}/${item.severity})`);
    if (!isIso(item.checkedAt)) problems.push(`${item.id}: checkedAt inválido`);
    if (!Array.isArray(item.reasons) || !item.reasons.length) problems.push(`${item.id}: sem diagnóstico`);
    if (item.score !== null && (typeof item.score !== 'number' || item.score < 0 || item.score > 100)) problems.push(`${item.id}: score fora de 0–100`);
    const c = item.conversion || {};
    ['leads24h', 'leads7d', 'leadsPrev7d', 'leads28d'].forEach(key => {
      if (c[key] !== undefined && c[key] !== null && !(Number.isInteger(c[key]) && c[key] >= 0)) problems.push(`${item.id}: ${key} inválido`);
    });
    if (typeof c.leads24h === 'number' && typeof c.leads7d === 'number' && c.leads24h > c.leads7d) problems.push(`${item.id}: leads24h > leads7d`);
    const nc = c.noConversionCheck;
    if (nc) {
      if (!isIso(nc.referenceAt) || !isIso(nc.windowStart)) problems.push(`${item.id}: janela de verificação inválida`);
      if (nc.result === 'Sem conversão' && (nc.leadsInWindow !== 0 || item.severity !== 'critical')) problems.push(`${item.id}: "sem conversão" sem evidência ou sem criticidade`);
      if (nc.lastLeadAt && new Date(nc.lastLeadAt) > new Date(nc.referenceAt)) problems.push(`${item.id}: último lead no futuro`);
      if (nc.result === 'Sem conversão' && nc.lastLeadAt && new Date(nc.lastLeadAt) >= new Date(nc.windowStart)) problems.push(`${item.id}: último lead dentro da janela mas marcado sem conversão`);
    }
  });

  const t = payload.totals || {};
  if (t.total !== items.length) problems.push('totals.total diferente do número de itens');
  if ((t.ok + t.attention + t.critical + t.notTestable) !== t.total) problems.push('totais por veredito não somam o total');

  if (problems.length) {
    throw new Error(`Validação de integridade falhou; dados anteriores preservados.\n- ${problems.slice(0, 20).join('\n- ')}`);
  }
}

function needsConfirmation(item) {
  return item.severity === 'critical' && (
    item.page.online === false ||
    item.page.rendered === false ||
    ['Não envia lead', 'Erro'].includes(item.funnel.status)
  );
}

/* --------------------------------------------- execução */

async function mapLimit(list, limit, worker) {
  const results = new Array(list.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (index < list.length) {
      const current = index;
      index += 1;
      results[current] = await worker(list[current], current);
    }
  }));
  return results;
}

async function main() {
  const records = readJson(recordsPath, []);
  const sources = readJson(sourcesPath, {});
  delete sources.$comment;
  delete sources.$exemplos;

  const only = (process.env.HEALTHCHECK_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
  const lps = records.filter(isLandingPage).filter(record => !only.length || only.includes(record.id));

  const sheetUsage = {};
  lps.forEach(record => {
    const id = (sources[record.id] && sources[record.id].spreadsheetId) || spreadsheetIdFrom(record);
    if (id) sheetUsage[id] = (sheetUsage[id] || 0) + 1;
  });

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.HEALTHCHECK_CHROME_PATH || undefined
  });

  const checkOne = async record => {
    let item;
    try {
      item = await checkLandingPage(browser, record);
    } catch (error) {
      item = { id: record.id, ativo: record.ativo, url: record.url, checkedAt: new Date().toISOString(), page: { online: false, error: error.message, jsErrors: [] }, form: {}, funnel: { status: 'Erro', destinations: [], endpointProbes: [], requests: [] }, tracking: { tags: [], pixels: [], pageEvents: [], submitEvents: [] } };
    }
    item.conversion = await conversionFor(record, sources, sheetUsage, item);
    Object.assign(item, verdictFor(item, record));
    applyLegacyFields(item);
    return item;
  };

  const checked = await mapLimit(lps, CONCURRENCY, async (record, index) => {
    const started = Date.now();
    const item = await checkOne(record);
    console.log(`[${index + 1}/${lps.length}] ${item.verdict.padEnd(12)} ${String(item.score ?? '—').padStart(3)}  ${item.funnel.status.padEnd(26)} ${item.conversion.status.padEnd(20)} ${record.ativo} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    return item;
  });

  // Falha grave só é publicada se se repetir numa segunda checagem (evita alarme por instabilidade momentânea).
  const toConfirm = checked.map((item, index) => ({ item, index })).filter(({ item }) => needsConfirmation(item));
  if (toConfirm.length) {
    console.log(`Confirmando ${toConfirm.length} falha(s) grave(s) em nova checagem...`);
    await sleep(15000);
    for (const { item, index } of toConfirm) {
      const second = await checkOne(lps[index]);
      second.confirmation = needsConfirmation(second)
        ? 'Falha confirmada em 2 checagens consecutivas'
        : `Instabilidade momentânea na 1ª checagem (${item.reasons.find(r => r.severity === 'critical')?.text || item.verdict}); normal na 2ª`;
      checked[index] = second;
    }
  }

  await browser.close();

  // Guarda de infraestrutura: se a maioria das LPs "caiu" ao mesmo tempo, o problema é a rede do runner.
  const testable = checked.filter(item => item.url);
  const unreachable = testable.filter(item => item.page.online === false).length;
  if (testable.length >= 5 && unreachable / testable.length > 0.5) {
    throw new Error(`${unreachable}/${testable.length} LPs inacessíveis ao mesmo tempo: provável falha de rede do runner. Dados anteriores preservados, nada foi gravado.`);
  }

  const lpIds = new Set(records.filter(isLandingPage).map(record => record.id));
  const touchedIds = new Set(checked.map(item => item.id));
  let items = checked;
  if (only.length) {
    // Rodada parcial: substitui só as LPs checadas e preserva o resultado das demais.
    const previous = readJson(outputPath, null);
    const kept = previous && String(previous.schema || '').includes('v2') && Array.isArray(previous.items)
      ? previous.items.filter(item => item && lpIds.has(item.id) && !touchedIds.has(item.id))
      : [];
    items = [...kept, ...checked];
  }

  const severityOrder = { critical: 0, attention: 1, neutral: 2, ok: 3 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || (a.score ?? 101) - (b.score ?? 101));

  const generatedAt = new Date().toISOString();
  const history = updateHistory(items, generatedAt, touchedIds, lpIds);

  const totals = {
    total: items.length,
    ok: items.filter(i => i.severity === 'ok').length,
    attention: items.filter(i => i.severity === 'attention').length,
    critical: items.filter(i => i.severity === 'critical').length,
    notTestable: items.filter(i => i.severity === 'neutral').length,
    online: items.filter(i => i.page.online === true).length,
    sendingLeads: items.filter(i => i.funnel.status === 'Envia lead').length,
    notSendingLeads: items.filter(i => i.funnel.status === 'Não envia lead').length,
    conversionMonitored: items.filter(i => i.conversion && i.conversion.leads7d !== undefined && i.conversion.leads7d !== null).length,
    converting: items.filter(i => i.conversion && i.conversion.status === 'Convertendo').length,
    conversionStopped: items.filter(i => i.conversion && i.conversion.status === 'Conversão parada').length,
    noConversion: items.filter(i => i.conversion?.noConversionCheck?.result === 'Sem conversão').length,
    conversionNotDemonstrable: items.filter(i => i.url && !i.conversion?.noConversionCheck).length,
    leads24h: items.reduce((total, i) => total + (i.conversion?.leads24h || 0), 0),
    leads7d: items.reduce((total, i) => total + (i.conversion?.leads7d || 0), 0)
  };

  const payload = {
    schema: SCHEMA,
    generatedAt,
    mode: 'dry-run-funnel',
    run: only.length ? { type: 'parcial', checked: [...touchedIds] } : { type: 'completa' },
    runUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
    googleServiceAccount: googleAccessToken.clientEmail || null,
    totals,
    summary: { rules: ruleSummary(items), ai: await aiSummary(items) },
    classificationPolicy: {
      ok: 'Página no ar e renderizada, envio simulado chega a um destino real, mensuração instalada e, quando monitorada, conversão dentro do normal.',
      atencao: 'Lentidão, erros de JavaScript, tracking ausente, teste de envio inconclusivo, queda de conversão ou sem leads recentes.',
      critico: 'Página fora do ar ou em branco, formulário que não envia, destino do lead inativo ou conversão parada de forma estatisticamente anômala.',
      naoTestavel: 'Sem URL pública HTTP/HTTPS cadastrada.'
    },
    conversionTestPolicy: 'Envio simulado: as requisições de envio e os pixels são interceptados e respondidos localmente. Nenhum lead ou evento chega à produção.',
    thresholds: THRESHOLDS,
    items
  };

  const alerts = writeAlerts(items, payload);
  payload.alerts = alerts;

  validatePayload(payload, lpIds, !only.length);
  writeFileAtomic(historyPath, JSON.stringify(history) + '\n');
  writeFileAtomic(outputPath, JSON.stringify(payload, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `critical=${alerts.critical}\nnew_critical=${alerts.newCritical}\n`);
  }
  console.log(`Health Check concluído: ${items.length} LPs — ${totals.ok} OK, ${totals.attention} atenção, ${totals.critical} críticas.`);
}

module.exports = { validatePayload, analyseConversion, parseDate, timestampsFromRows, classifyLeadDestination, verdictFor, isLandingPage };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
