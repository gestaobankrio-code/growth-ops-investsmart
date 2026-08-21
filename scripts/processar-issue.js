'use strict';

const fs = require('fs');
const path = require('path');

const eventPath = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;

if (!eventPath || !fs.existsSync(eventPath)) {
  console.log('GITHUB_EVENT_PATH não encontrado. Encerrando.');
  process.exit(0);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue || {};
const body = issue.body || '';

const payload = parseRecord(body);

if (!payload) {
  console.log('Issue sem bloco GROWTH_OPS_JSON. Nada a processar.');
  process.exit(0);
}

main().catch(async (error) => {
  console.error(error);
  await comment(`❌ Falha ao processar a solicitação Growth Ops.\n\nErro: \`${error.message}\``);
  process.exit(1);
});

async function main() {
  const recordsToProcess = Array.isArray(payload) ? payload : [payload];

  if (!recordsToProcess.length) {
    throw new Error('O bloco GROWTH_OPS_JSON está vazio.');
  }

  for (const item of recordsToProcess) {
    validateRecord(item);
  }

  validateBatch(recordsToProcess);

  const recordsPath = 'data/registros.json';
  const auditPath = 'data/auditoria.json';

  const originalRecords = readJson(recordsPath, []);
  let nextRecords = Array.isArray(originalRecords) ? [...originalRecords] : [];

  const audit = readJson(auditPath, []);
  const processed = [];

  for (const item of recordsToProcess) {
    const action = normalizeAction(item.action);
    const before = nextRecords.find((record) => record.id === item.id) || null;

    nextRecords = applyAction(nextRecords, item, action);

    const after = nextRecords.find((record) => record.id === item.id) || null;

    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
      issueNumber: issue.number || null,
      action,
      recordId: item.id,
      software: item.software,
      ativo: item.ativo,
      statusBefore: before ? before.status : null,
      statusAfter: action === 'Excluir' ? 'Excluído' : (after ? after.status : null),
      actor: issue.user ? issue.user.login : 'github-actions',
      source: Array.isArray(payload) ? 'github-issue-batch' : 'github-issue'
    };

    const alreadyAudited = audit.some((auditItem) =>
      auditItem.issueNumber === auditEntry.issueNumber &&
      auditItem.action === auditEntry.action &&
      auditItem.recordId === auditEntry.recordId
    );

    if (!alreadyAudited) audit.unshift(auditEntry);

    processed.push({
      id: item.id,
      action,
      software: item.software,
      ativo: item.ativo
    });
  }

  nextRecords = sortRecords(nextRecords);

  const pendencias = buildPendencias(nextRecords);
  const landingPages = nextRecords.filter((item) =>
    item.software === 'Landing Page' ||
    item.categoria === 'Landing Page' ||
    String(item.categoria || '').startsWith('Landing Page /')
  );

  writeJson(recordsPath, nextRecords);
  writeJson(auditPath, audit);
  writeJson('data/pendencias.json', pendencias);
  writeJson('data/landing-pages.json', landingPages);

  fs.mkdirSync('exports', { recursive: true });

  fs.writeFileSync('inventario-plataformas-acessos.md', generateInventario(nextRecords), 'utf8');
  fs.writeFileSync('landing-pages-e-identificadores.md', generateLandingPages(landingPages), 'utf8');
  fs.writeFileSync('pendencias.md', generatePendencias(pendencias), 'utf8');
  fs.writeFileSync('documentacao-growth-ops.md', generateDocumentacao(nextRecords, pendencias), 'utf8');

  fs.writeFileSync('exports/growth-ops-inventario.csv', toCsv(nextRecords.map((item) => ({
    ativo: item.ativo,
    software: item.software,
    categoria: item.categoria,
    responsavel: item.responsavel,
    area: item.area,
    status: item.status,
    url: item.url,
    twofa: item.twofa,
    metodo_2fa: item.twofaMethod,
    quem_recebe_codigo: item.twofaOwner,
    risco: risk(item),
    proxima_acao: item.next
  }))), 'utf8');

  fs.writeFileSync('exports/growth-ops-seguranca-2fa.csv', toCsv(nextRecords.map((item) => ({
    ativo: item.ativo,
    software: item.software,
    twofa: item.twofa,
    metodo_2fa: item.twofaMethod,
    quem_recebe_codigo: item.twofaOwner,
    tipo_responsavel: item.twofaOwnerType,
    telefone_mascarado: item.twofaPhoneMasked,
    tipo_telefone: item.phoneType,
    segundo_admin: item.secondAdmin,
    recuperacao_validada: item.recoveryValidated,
    risco: risk(item)
  }))), 'utf8');

  fs.writeFileSync('exports/growth-ops-pendencias.csv', toCsv(pendencias.map((item) => ({
    ativo: item.ativo,
    software: item.software,
    risco: item.risco,
    pendencia: item.pendencia,
    proxima_acao: item.proximaAcao
  }))), 'utf8');

  if (processed.length === 1) {
    const item = processed[0];

    await comment(`✅ Solicitação Growth Ops processada.\n\n- Ação: **${item.action}**\n- Ativo: **${item.ativo}**\n- Software: **${item.software}**\n\nOs arquivos JSON, documentação, pendências e exportações foram atualizados no repositório.`);
  } else {
    await comment(`✅ Importação em lote Growth Ops processada.\n\n- Total de registros processados: **${processed.length}**\n\n${processed.map((item) => `- **${item.action}** — ${item.ativo} (${item.software})`).join('\n')}\n\nOs arquivos JSON, documentação, pendências e exportações foram atualizados no repositório.`);
  }

  await closeIssue();
}

function parseRecord(text) {
  const match = text.match(/<!--\s*GROWTH_OPS_JSON\s*([\s\S]*?)\s*GROWTH_OPS_JSON\s*-->/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function validateRecord(item) {
  const required = ['id', 'action', 'software', 'ativo'];

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error('Cada item do GROWTH_OPS_JSON precisa ser um objeto.');
  }

  for (const key of required) {
    if (!item[key]) {
      throw new Error(`Campo obrigatório ausente: ${key}`);
    }
  }

  const serialized = JSON.stringify(item).toLowerCase();

  const blocked = [
    'senha:',
    'password:',
    'token:',
    'secret:',
    'api key:',
    'apikey:',
    'recovery code',
    'código 2fa',
    'codigo 2fa'
  ];

  const found = blocked.find((term) => serialized.includes(term));

  if (found) {
    throw new Error(`Conteúdo sensível detectado: ${found}`);
  }
}

function validateBatch(items) {
  const ids = new Set();

  for (const item of items) {
    const id = String(item.id);

    if (ids.has(id)) {
      throw new Error(`ID duplicado no lote: "${id}". Corrija antes de importar.`);
    }

    ids.add(id);
  }
}

function normalizeAction(action) {
  const value = String(action || 'Atualizar').trim();

  if (['Criar', 'Atualizar', 'Validar', 'Reprovar', 'Arquivar', 'Excluir'].includes(value)) {
    return value;
  }

  return 'Atualizar';
}

function applyAction(records, item, action) {
  const list = Array.isArray(records) ? [...records] : [];
  const index = list.findIndex((record) => record.id === item.id);
  const cleanItem = normalizeRecord(item);

  if (action === 'Excluir') {
    return list.filter((record) => record.id !== item.id);
  }

  if (action === 'Criar' && index >= 0) {
    throw new Error(`Já existe um registro com o id "${item.id}". Para alterar esse ativo, use action: "Atualizar". Nenhum dado foi gravado.`);
  }

  if (action === 'Validar') {
    cleanItem.status = 'Validado';
    cleanItem.lastValidation = new Date().toLocaleDateString('pt-BR');
  }

  if (action === 'Reprovar') {
    cleanItem.status = 'Reprovado';
  }

  if (action === 'Arquivar') {
    cleanItem.status = 'Arquivado';
  }

  if (index >= 0) {
    list[index] = {
      ...list[index],
      ...cleanItem,
      updatedAt: new Date().toISOString()
    };
  } else {
    list.push({
      ...cleanItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return list;
}

function normalizeRecord(item) {
  return {
    schema: item.schema || 'growth-ops-record-v2',
    id: String(item.id),
    action: normalizeAction(item.action),
    software: safe(item.software),
    ativo: safe(item.ativo),
    categoria: safe(item.categoria),
    responsavel: safe(item.responsavel),
    area: safe(item.area),
    status: safe(item.status || 'A validar'),
    url: safe(item.url),
    twofa: safe(item.twofa || 'A validar'),
    twofaMethod: safe(item.twofaMethod || 'A validar'),
    twofaOwner: safe(item.twofaOwner || 'A validar'),
    twofaOwnerType: safe(item.twofaOwnerType || 'A validar'),
    twofaPhoneMasked: safe(item.twofaPhoneMasked || ''),
    phoneType: safe(item.phoneType || 'A validar'),
    secondAdmin: safe(item.secondAdmin || 'A validar'),
    recoveryValidated: safe(item.recoveryValidated || 'A validar'),
    manualRisk: safe(item.manualRisk || 'Automático'),
    lastValidation: safe(item.lastValidation || 'A validar'),
    obs: safe(item.obs || ''),
    next: safe(item.next || 'A validar'),
    extra: item.extra && typeof item.extra === 'object' ? item.extra : {}
  };
}

function safe(value) {
  return String(value ?? '').replace(/\r/g, ' ').trim();
}

function sortRecords(records) {
  return [...records].sort((a, b) =>
    String(a.software || '').localeCompare(String(b.software || ''), 'pt-BR') ||
    String(a.ativo || '').localeCompare(String(b.ativo || ''), 'pt-BR')
  );
}

function risk(item) {
  if (item.manualRisk && item.manualRisk !== 'Automático') return item.manualRisk;
  if (item.twofaOwnerType === 'Ex-colaborador' || item.twofaOwnerType === 'Desconhecido') return 'Crítico';
  if (item.twofaOwner === 'A validar' || !item.twofaOwner) return 'Crítico';
  if (item.twofa === 'Não' || item.twofa === 'A validar') return 'Alto';
  if (item.twofaMethod === 'SMS' && item.phoneType === 'Terceirizado') return 'Crítico';
  if (item.twofaMethod === 'SMS' && item.phoneType === 'Pessoal autorizado' && item.secondAdmin !== 'Sim') return 'Alto';
  if (item.secondAdmin === 'Não') return 'Alto';
  if (item.recoveryValidated === 'Não' || item.recoveryValidated === 'A validar') return 'Médio';
  if (item.twofa === 'Sim' && item.recoveryValidated === 'Sim' && item.secondAdmin === 'Sim') return 'Baixo';
  return 'Médio';
}

function isArchived(item) {
  return ['Arquivado', 'Excluído'].includes(item.status) || item.action === 'Excluir';
}

function buildPendencias(records) {
  const pendencias = [];

  for (const item of records.filter((record) => !isArchived(record))) {
    const itemRisk = risk(item);

    if (['Alto', 'Crítico'].includes(itemRisk)) {
      pendencias.push(makePendencia(item, `Risco ${itemRisk}`, itemRisk));
    }

    if (item.twofa === 'Não') {
      pendencias.push(makePendencia(item, '2FA desativado', 'Alto'));
    }

    if (item.twofaOwner === 'A validar' || !item.twofaOwner) {
      pendencias.push(makePendencia(item, 'Quem recebe o código a validar', 'Crítico'));
    }

    if (item.twofaOwnerType === 'Desconhecido') {
      pendencias.push(makePendencia(item, 'Responsável pelo código desconhecido', 'Crítico'));
    }

    if (item.secondAdmin === 'Não') {
      pendencias.push(makePendencia(item, 'Sem segundo administrador', 'Alto'));
    }

    if (['Não', 'A validar'].includes(item.recoveryValidated)) {
      pendencias.push(makePendencia(item, 'Recuperação de acesso não validada', 'Médio'));
    }
  }

  return pendencias;
}

function makePendencia(item, pendencia, riscoValue) {
  return {
    id: `${item.id}-${slug(pendencia)}`,
    recordId: item.id,
    ativo: item.ativo,
    software: item.software,
    risco: riscoValue,
    pendencia,
    proximaAcao: item.next || 'A validar'
  };
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function slug(value) {
  return String(value || 'item')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function active(records) {
  return records.filter((item) => !isArchived(item));
}

function generateInventario(records) {
  const items = active(records);

  return [
    '# Inventário de Plataformas e Acessos — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${new Date().toLocaleString('pt-BR')}.`,
    '',
    '| Ativo | Software | Categoria | Responsável | Área | Status | 2FA | Quem recebe o código | Risco | Próxima ação |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...(items.length
      ? items.map((item) => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.categoria)} | ${md(item.responsavel)} | ${md(item.area)} | ${md(item.status)} | ${md(item.twofa)} | ${md(item.twofaOwner)} | ${md(risk(item))} | ${md(item.next)} |`)
      : ['| Nenhum registro ativo | - | - | - | - | - | - | - | - | - |'])
  ].join('\n') + '\n';
}

function generateLandingPages(records) {
  return [
    '# Landing Pages e Identificadores — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${new Date().toLocaleString('pt-BR')}.`,
    '',
    '| Ativo | Identificador | Domínio público | URL Lovable/Deploy | Webhook | Destino do lead | Status |',
    '|---|---|---|---|---|---|---|',
    ...(records.length
      ? records.map((item) => `| ${md(item.ativo)} | ${md(item.extra?.identifier)} | ${md(item.extra?.publicDomain || item.url)} | ${md(item.extra?.lovableUrl || item.extra?.deployUrl)} | ${md(item.extra?.webhookUrl)} | ${md(item.extra?.leadDestination)} | ${md(item.status)} |`)
      : ['| Nenhuma landing page cadastrada | - | - | - | - | - | - |'])
  ].join('\n') + '\n';
}

function generatePendencias(pendencias) {
  return [
    '# Pendências — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${new Date().toLocaleString('pt-BR')}.`,
    '',
    '| Ativo | Software | Risco | Pendência | Próxima ação |',
    '|---|---|---|---|---|',
    ...(pendencias.length
      ? pendencias.map((item) => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.risco)} | ${md(item.pendencia)} | ${md(item.proximaAcao)} |`)
      : ['| Nenhuma pendência crítica | - | - | - | - |'])
  ].join('\n') + '\n';
}

function generateDocumentacao(records, pendencias) {
  const items = active(records);

  return `# Documentação Growth Ops InvestSmart

Atualização gerada automaticamente em ${new Date().toLocaleString('pt-BR')}.

## Resumo executivo

| Indicador | Total |
|---|---:|
| Registros ativos | ${items.length} |
| Validados | ${items.filter((item) => item.status === 'Validado').length} |
| A validar | ${items.filter((item) => item.status === 'A validar').length} |
| Risco alto/crítico | ${items.filter((item) => ['Alto', 'Crítico'].includes(risk(item))).length} |
| Sem 2FA | ${items.filter((item) => item.twofa === 'Não').length} |

## Inventário

| Ativo | Software | Categoria | Responsável | Status | Risco |
|---|---|---|---|---|---|
${items.length ? items.map((item) => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.categoria)} | ${md(item.responsavel)} | ${md(item.status)} | ${md(risk(item))} |`).join('\n') : '| Nenhum registro ativo | - | - | - | - | - |'}

## Pendências

| Ativo | Software | Pendência | Próxima ação |
|---|---|---|---|
${pendencias.length ? pendencias.map((item) => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.pendencia)} | ${md(item.proximaAcao)} |`).join('\n') : '| Nenhuma pendência crítica | - | - | - |'}
`;
}

function toCsv(rows) {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);

  return '\ufeff' + [
    headers.map(csvEscape).join(';'),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';'))
  ].join('\n') + '\n';
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

async function comment(message) {
  if (!token || !repo || !issue.number) return;

  await fetch(`https://api.github.com/repos/${repo}/issues/${issue.number}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: message })
  });
}

async function closeIssue() {
  if (!token || !repo || !issue.number) return;

  await fetch(`https://api.github.com/repos/${repo}/issues/${issue.number}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'closed' })
  });
}
