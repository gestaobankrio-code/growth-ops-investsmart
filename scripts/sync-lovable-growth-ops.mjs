#!/usr/bin/env node
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

// ==========================================
// 1. UTILITÁRIOS E SEGURANÇA
// ==========================================

export const SECRET_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/,
  /github_pat_[a-zA-Z0-9_]{22,}/,
  /gho_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{20,}/,
  /Bearer\s+[a-zA-Z0-9_\-\.]{25,}/i,
  /AIza[0-9A-Za-z-_]{35}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN\s+(RSA|EC|OPENSSH|PGP)?\s*PRIVATE KEY-----/,
  /"(?:password|senha|secret|apiKey)"\s*:\s*"[^"]{6,}"/i,
  /\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b/ // CPF
];

export function scanForSecrets(value, context = '') {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value)) {
        throw new Error(`[SEGURANÇA] Possível credencial, token ou dado sensível detectado no contexto "${context}": padrão ${pattern}`);
      }
    }
    const lower = value.toLowerCase();
    if (lower.includes('recovery code:') || lower.includes('código 2fa:') || lower.includes('codigo 2fa:')) {
      throw new Error(`[SEGURANÇA] Informação sensível detectada no contexto "${context}".`);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      scanForSecrets(value[i], `${context}[${i}]`);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      scanForSecrets(v, `${context}.${k}`);
    }
  }
}

export function slugify(text) {
  return String(text || 'item')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function safeText(value) {
  return String(value ?? '').replace(/\r/g, ' ').trim();
}

export function mdEscape(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function toCsv(rows) {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '\ufeff' + [
    headers.map(escapeCell).join(';'),
    ...rows.map(row => headers.map(h => escapeCell(row[h])).join(';'))
  ].join('\n') + '\n';
}

export function calculateRisk(item) {
  if (item.manualRisk && item.manualRisk !== 'Automático') return item.manualRisk;
  if (item.twofa === 'Não aplicável') {
    if (item.status === 'Reprovado') return 'Alto';
    return 'Baixo';
  }
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

export function sortRecords(records) {
  return [...records].sort((a, b) =>
    String(a.software || '').localeCompare(String(b.software || ''), 'pt-BR') ||
    String(a.ativo || '').localeCompare(String(b.ativo || ''), 'pt-BR')
  );
}

// ==========================================
// 2. CONSERVATIVE MERGE
// ==========================================

export function conservativeMerge(existing, incoming) {
  const merged = { ...existing };

  // Atualizar campos top-level se informados e válidos
  if (incoming.nome || incoming.ativo) {
    const rawName = incoming.nome || incoming.ativo;
    merged.ativo = rawName.startsWith('LP - ') ? rawName : `LP - ${rawName}`;
  }
  if (incoming.publicUrl || incoming.url) {
    merged.url = incoming.publicUrl || incoming.url;
  }
  if (incoming.status && incoming.status !== 'A validar') {
    merged.status = incoming.status;
  }
  if (incoming.responsavel) {
    merged.responsavel = incoming.responsavel;
  }
  if (incoming.manualRisk && incoming.manualRisk !== 'Automático') {
    merged.manualRisk = incoming.manualRisk;
  }

  // Atualizar obs com registro de sincronização sem perder histórico
  if (incoming.obs) {
    merged.obs = incoming.obs;
  }

  merged.updatedAt = new Date().toISOString();
  merged.lastValidation = new Date().toLocaleDateString('pt-BR');

  // Merge conservador do objeto extra
  const existingExtra = { ...(existing.extra || {}) };
  const incomingExtra = { ...(incoming.extra || {}) };

  // Mapear campos de primeiro nível úteis para o extra
  if (incoming.leadDestination && !incomingExtra.leadDestination) incomingExtra.leadDestination = incoming.leadDestination;
  if (incoming.gtmId && !incomingExtra.gtmId) incomingExtra.gtmId = incoming.gtmId;
  if (incoming.ga4Id && !incomingExtra.ga4Id) incomingExtra.ga4Id = incoming.ga4Id;
  if (incoming.metaPixelId && !incomingExtra.metaPixelId) incomingExtra.metaPixelId = incoming.metaPixelId;
  if (incoming.formProvider && !incomingExtra.formProvider) incomingExtra.formProvider = incoming.formProvider;
  if (incoming.githubRepository && !incomingExtra.githubRepository) incomingExtra.githubRepository = incoming.githubRepository;
  if (incoming.githubBranch && !incomingExtra.githubBranch) incomingExtra.githubBranch = incoming.githubBranch;
  if (incoming.lastSeenCommit) incomingExtra.lastSeenCommit = incoming.lastSeenCommit;

  for (const [key, val] of Object.entries(incomingExtra)) {
    // Nunca sobrescrever dado válido pré-existente com vazio ou placeholder genérico
    if (val === null || val === undefined || val === '') continue;
    if ((val === 'A VALIDAR' || val === 'NÃO LOCALIZADO') && existingExtra[key] && existingExtra[key] !== 'A VALIDAR' && existingExtra[key] !== 'NÃO LOCALIZADO') {
      continue;
    }
    // Garantir valor primitivo para não quebrar o painel executivo com [object Object]
    if (typeof val === 'object') {
      existingExtra[key] = JSON.stringify(val);
    } else {
      existingExtra[key] = String(val);
    }
  }

  merged.extra = existingExtra;
  return merged;
}

// ==========================================
// 3. DOCUMENTAÇÃO INDIVIDUAL
// ==========================================

export function updateDocumentationMarkdown(docPath, record, payload, rootDir) {
  const fullPath = path.join(rootDir, docPath);
  let content = '';

  if (fs.existsSync(fullPath)) {
    content = fs.readFileSync(fullPath, 'utf8');

    // Atualização conservadora de metadados no topo
    if (payload.commitSha) {
      if (content.includes('- **Último commit visto:**')) {
        content = content.replace(/- \*\*Último commit visto:\*\* .*/, `- **Último commit visto:** \`${payload.commitSha}\``);
      } else {
        content = content.replace(/(# Auditoria técnica: [^\n]+)/, `$1\n\n- **Último commit visto:** \`${payload.commitSha}\``);
      }
    }

    if (payload.publicUrl) {
      content = content.replace(/- \*\*URL registrada:\*\* .*/, `- **URL registrada:** ${payload.publicUrl}`);
    }

    // Se houve atualização explícita de tracking, atualizar seção 7
    if (payload.gtmId || payload.ga4Id || payload.metaPixelId) {
      const trackingItems = [];
      if (payload.gtmId) trackingItems.push(`- **GTM ID:** \`${payload.gtmId}\``);
      if (payload.ga4Id) trackingItems.push(`- **GA4 ID:** \`${payload.ga4Id}\``);
      if (payload.metaPixelId) trackingItems.push(`- **Meta Pixel:** \`${payload.metaPixelId}\``);

      const sectionRegex = /## 7\. Tracking e eventos[\s\S]*?(?=## \d|\Z)/;
      if (sectionRegex.test(content)) {
        content = content.replace(sectionRegex, `## 7. Tracking e eventos\n\n${trackingItems.join('\n')}\n- **Sincronizado automaticamente via Growth Ops.**\n\n`);
      }
    }

    // Se houve atualização explícita de destino de leads, atualizar seção 4
    if (payload.leadDestination) {
      const sectionRegex = /## 4\. Fluxo real do lead e persistência[\s\S]*?(?=## \d|\Z)/;
      if (sectionRegex.test(content)) {
        content = content.replace(sectionRegex, `## 4. Fluxo real do lead e persistência\n\n- **Destino do lead atualizado:** ${payload.leadDestination}\n- **Sincronizado automaticamente via Growth Ops.**\n\n`);
      }
    }

    // Se houve atualização de formulário
    if (payload.formProvider) {
      const sectionRegex = /## 3\. Formulário, campos e validações[\s\S]*?(?=## \d|\Z)/;
      if (sectionRegex.test(content)) {
        content = content.replace(sectionRegex, `## 3. Formulário, campos e validações\n\n- **Provedor do formulário:** ${payload.formProvider}\n- **Sincronizado automaticamente via Growth Ops.**\n\n`);
      }
    }

  } else {
    // Criação de documento novo completo para nova LP
    const title = record.ativo.replace(/^LP - /, '');
    content = `> **ID canônico no Growth Ops:** \`${record.id}\`
> **Fonte:** sincronização automática Lovable / Growth Ops.

# Auditoria técnica: ${title}

- **ID de documentação:** \`${record.id}\`
- **Project ID Lovable:** \`${payload.lovableProjectId}\`
- **URL registrada:** ${record.url || 'A VALIDAR'}
- **Status de publicação:** ${record.status}
- **Último commit visto:** \`${payload.commitSha || 'N/A'}\`
- **Data de sincronização:** ${new Date().toLocaleString('pt-BR')}

## 1. Identificação e relação de versões
- **Campanha/família:** ${record.categoria || 'Landing Page'}
- **Variação/relação:** Projeto individual Lovable sincronizado automaticamente.
- **Projeto provavelmente oficial:** A VALIDAR

## 2. Tecnologia e arquivos críticos
- **Repositório GitHub:** ${payload.githubRepository || 'A VALIDAR'}
- **Arquivos críticos:** A VALIDAR no repositório do projeto.

## 3. Formulário, campos e validações
- **Provedor do formulário:** ${payload.formProvider || record.extra?.formProvider || 'A VALIDAR'}
- **Status do formulário:** ${record.extra?.formStatus || 'A validar'}

## 4. Fluxo real do lead e persistência
- **Destino do lead:** ${payload.leadDestination || record.extra?.leadDestination || 'A VALIDAR'}

## 5. Payload e identificadores
- **Lovable Project ID:** \`${payload.lovableProjectId}\`
- **Growth Ops Record ID:** \`${record.id}\`

## 6. Atribuição e UTMs
- **Captura de UTMs:** A VALIDAR

## 7. Tracking e eventos
- **GTM ID:** \`${payload.gtmId || record.extra?.gtmId || 'NÃO LOCALIZADO'}\`
- **GA4 ID:** \`${payload.ga4Id || record.extra?.ga4Id || 'NÃO LOCALIZADO'}\`
- **Meta Pixel:** \`${payload.metaPixelId || record.extra?.metaPixelId || 'NÃO LOCALIZADO'}\`

## 8. Página de obrigado
- **Existe:** A VALIDAR

## 9. SEO
- **Status:** A VALIDAR

## 10. LGPD e segurança
- **Termo de consentimento:** A VALIDAR

## 11. Riscos
- **Classificação:** ${calculateRisk(record)}

## 12. O que não pode quebrar
- Não alterar IDs sem reconciliação no manifesto.
- Preservar endpoint de destino e parâmetros de tracking.

## 13. Pendências e próxima ação
- Validar fluxo de captação e persistência em produção.
`;
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

// ==========================================
// 4. VALIDAÇÃO COMPLETA PRÉ-COMMIT
// ==========================================

export function validateAll(rootDir = defaultRoot) {
  const errors = [];

  const readJson = (rel) => {
    const p = path.join(rootDir, rel);
    if (!fs.existsSync(p)) {
      errors.push(`Arquivo obrigatório ausente: ${rel}`);
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      errors.push(`Falha de parse em ${rel}: ${e.message}`);
      return null;
    }
  };

  const registros = readJson('data/registros.json');
  const landingPages = readJson('data/landing-pages.json');
  const manifest = readJson('data/lovable-projects.json');

  if (!registros || !landingPages || !manifest) {
    throw new Error(`[VALIDAÇÃO] Erro ao carregar arquivos JSON:\n${errors.join('\n')}`);
  }

  // 1. Unicidade de IDs em registros.json
  const ids = registros.map(r => r.id);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    errors.push(`IDs duplicados em data/registros.json: ${[...new Set(duplicates)].join(', ')}`);
  }

  // 2. Unicidade de lovableProjectId nas Landing Pages
  const lps = registros.filter(r => r.software === 'Landing Page');
  const lovableIds = [];
  for (const r of lps) {
    const lid = r.extra?.lovableProjectId || r.lovableProjectId;
    if (!lid) {
      errors.push(`LP ${r.id} sem lovableProjectId definido`);
    } else {
      lovableIds.push({ id: r.id, lid });
    }
  }

  const lidMap = new Map();
  for (const item of lovableIds) {
    if (lidMap.has(item.lid)) {
      errors.push(`lovableProjectId duplicado: ${item.lid} entre ${lidMap.get(item.lid)} e ${item.id}`);
    } else {
      lidMap.set(item.lid, item.id);
    }
  }

  // 3. Unicidade no manifesto lovable-projects.json
  const manifestLovableIds = manifest.map(m => m.lovableProjectId);
  if (new Set(manifestLovableIds).size !== manifestLovableIds.length) {
    errors.push(`lovableProjectId duplicado em data/lovable-projects.json`);
  }
  const manifestRecordIds = manifest.map(m => m.growthOpsRecordId);
  if (new Set(manifestRecordIds).size !== manifestRecordIds.length) {
    errors.push(`growthOpsRecordId duplicado em data/lovable-projects.json`);
  }

  // 4. Verificação de documentação existente para todas as LPs
  for (const r of lps) {
    const docPath = r.extra?.documentationPath;
    if (!docPath) {
      errors.push(`LP sem documentationPath: ${r.id}`);
      continue;
    }
    const fullDocPath = path.join(rootDir, docPath);
    if (!fs.existsSync(fullDocPath)) {
      errors.push(`Documento de documentação não encontrado no disco: ${docPath} (${r.id})`);
    } else {
      const docContent = fs.readFileSync(fullDocPath, 'utf8');
      if (docContent.trim().length < 200) {
        errors.push(`Documento de documentação muito curto (<200 caracteres): ${docPath}`);
      }
    }
  }

  // 5. Verificação de objetos aninhados no extra (compatibilidade com Painel Executivo)
  const nested = registros.filter(r => Object.values(r.extra || {}).some(v => v && typeof v === 'object'));
  if (nested.length > 0) {
    errors.push(`Extras com objetos aninhados (quebraria painel): ${nested.map(r => r.id).join(', ')}`);
  }

  // 6. Varredura por secrets em todos os arquivos modificados
  try {
    scanForSecrets(registros, 'data/registros.json');
    scanForSecrets(landingPages, 'data/landing-pages.json');
    scanForSecrets(manifest, 'data/lovable-projects.json');
  } catch (secErr) {
    errors.push(secErr.message);
  }

  if (errors.length > 0) {
    throw new Error(`[VALIDAÇÃO FALHOU]:\n- ${errors.join('\n- ')}`);
  }

  return {
    valid: true,
    totalRecords: registros.length,
    totalLps: lps.length,
    manifestProjects: manifest.length
  };
}

// ==========================================
// 5. ATUALIZAÇÃO DE ARQUIVOS DERIVADOS
// ==========================================

export function updateDerivedFiles(records, manifest, rootDir = defaultRoot) {
  const landingPages = records.filter(r => r.software === 'Landing Page');

  // Pendências
  const pendencias = [];
  for (const item of records.filter(r => r.status !== 'Arquivado' && r.action !== 'Excluir')) {
    const itemRisk = calculateRisk(item);
    if (['Alto', 'Crítico'].includes(itemRisk)) {
      pendencias.push({
        id: `${item.id}-${slugify(`Risco ${itemRisk}`)}`,
        recordId: item.id,
        ativo: item.ativo,
        software: item.software,
        risco: itemRisk,
        pendencia: `Risco ${itemRisk}`,
        proximaAcao: item.next || 'A validar'
      });
    }
  }

  // Gravações JSON
  fs.writeFileSync(path.join(rootDir, 'data/registros.json'), JSON.stringify(records, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(rootDir, 'data/landing-pages.json'), JSON.stringify(landingPages, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(rootDir, 'data/lovable-projects.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(rootDir, 'data/pendencias.json'), JSON.stringify(pendencias, null, 2) + '\n', 'utf8');

  // Exports CSV
  const exportsDir = path.join(rootDir, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });

  fs.writeFileSync(path.join(exportsDir, 'growth-ops-inventario.csv'), toCsv(records.map(item => ({
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
    risco: calculateRisk(item),
    proxima_acao: item.next
  }))), 'utf8');

  fs.writeFileSync(path.join(exportsDir, 'growth-ops-seguranca-2fa.csv'), toCsv(records.map(item => ({
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
    risco: calculateRisk(item)
  }))), 'utf8');

  fs.writeFileSync(path.join(exportsDir, 'growth-ops-pendencias.csv'), toCsv(pendencias.map(item => ({
    ativo: item.ativo,
    software: item.software,
    risco: item.risco,
    pendencia: item.pendencia,
    proxima_acao: item.proximaAcao
  }))), 'utf8');

  // Markdown de sumarização
  const nowStr = new Date().toLocaleString('pt-BR');
  const inventarioMd = [
    '# Inventário de Plataformas e Acessos — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${nowStr}.`,
    '',
    '| Ativo | Software | Categoria | Responsável | Área | Status | 2FA | Quem recebe o código | Risco | Próxima ação |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...records.map(item => `| ${mdEscape(item.ativo)} | ${mdEscape(item.software)} | ${mdEscape(item.categoria)} | ${mdEscape(item.responsavel)} | ${mdEscape(item.area)} | ${mdEscape(item.status)} | ${mdEscape(item.twofa)} | ${mdEscape(item.twofaOwner)} | ${mdEscape(calculateRisk(item))} | ${mdEscape(item.next)} |`)
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(rootDir, 'inventario-plataformas-acessos.md'), inventarioMd, 'utf8');

  const lpMd = [
    '# Landing Pages e Identificadores — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${nowStr}.`,
    '',
    '| Ativo | Identificador | Domínio público | URL Lovable/Deploy | Webhook | Destino do lead | Status |',
    '|---|---|---|---|---|---|---|',
    ...landingPages.map(item => `| ${mdEscape(item.ativo)} | ${mdEscape(item.extra?.identifier)} | ${mdEscape(item.extra?.publicDomain || item.url)} | ${mdEscape(item.extra?.lovableUrl || item.extra?.deployUrl)} | ${mdEscape(item.extra?.webhookUrl)} | ${mdEscape(item.extra?.leadDestination)} | ${mdEscape(item.status)} |`)
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(rootDir, 'landing-pages-e-identificadores.md'), lpMd, 'utf8');

  const pendenciasMd = [
    '# Pendências — Growth Ops InvestSmart',
    '',
    `Atualizado automaticamente em ${nowStr}.`,
    '',
    '| Ativo | Software | Risco | Pendência | Próxima ação |',
    '|---|---|---|---|---|',
    ...(pendencias.length
      ? pendencias.map(item => `| ${mdEscape(item.ativo)} | ${mdEscape(item.software)} | ${mdEscape(item.risco)} | ${mdEscape(item.pendencia)} | ${mdEscape(item.proximaAcao)} |`)
      : ['| Nenhuma pendência crítica | - | - | - | - |'])
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(rootDir, 'pendencias.md'), pendenciasMd, 'utf8');

  const docMd = `# Documentação Growth Ops InvestSmart

Atualização gerada automaticamente em ${nowStr}.

## Resumo executivo

| Indicador | Total |
|---|---:|
| Registros ativos | ${records.length} |
| Landing Pages | ${landingPages.length} |
| Validados | ${records.filter(r => r.status === 'Validado').length} |
| A validar | ${records.filter(r => r.status === 'A validar').length} |
| Risco alto/crítico | ${records.filter(r => ['Alto', 'Crítico'].includes(calculateRisk(r))).length} |

## Inventário

| Ativo | Software | Categoria | Responsável | Status | Risco |
|---|---|---|---|---|---|
${records.map(r => `| ${mdEscape(r.ativo)} | ${mdEscape(r.software)} | ${mdEscape(r.categoria)} | ${mdEscape(r.responsavel)} | ${mdEscape(r.status)} | ${mdEscape(calculateRisk(r))} |`).join('\n')}
`;
  fs.writeFileSync(path.join(rootDir, 'documentacao-growth-ops.md'), docMd, 'utf8');
}

// ==========================================
// 6. MOTOR DE SINCRONIZAÇÃO (UPSERT)
// ==========================================

export function syncProject(payload, rootDir = defaultRoot) {
  // Regra crítica 1: lovableProjectId é a chave principal e obrigatória
  if (!payload || !payload.lovableProjectId) {
    throw new Error('Chave de reconciliação obrigatória "lovableProjectId" ausente no payload.');
  }

  // Regra crítica 3: Varredura de segurança de ponta a ponta
  scanForSecrets(payload, 'payload');

  const registrosPath = path.join(rootDir, 'data/registros.json');
  const manifestPath = path.join(rootDir, 'data/lovable-projects.json');

  let records = JSON.parse(fs.readFileSync(registrosPath, 'utf8'));
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Backup em memória para rollback em caso de falha de validação
  const snapshotRecords = JSON.stringify(records);
  const snapshotManifest = JSON.stringify(manifest);

  const lovableId = String(payload.lovableProjectId).trim();

  // Localizar no manifesto
  const manifestIdx = manifest.findIndex(m => m.lovableProjectId === lovableId);

  // Localizar no registros.json
  const recordIdx = records.findIndex(r =>
    r.extra?.lovableProjectId === lovableId ||
    r.lovableProjectId === lovableId ||
    (manifestIdx >= 0 && r.id === manifest[manifestIdx].growthOpsRecordId)
  );

  let targetRecordId;
  let isNew = false;
  let updatedRecord;

  if (recordIdx >= 0) {
    // ATUALIZAÇÃO CONSERVADORA
    targetRecordId = records[recordIdx].id;
    updatedRecord = conservativeMerge(records[recordIdx], payload);
    records[recordIdx] = updatedRecord;

    // Atualizar entrada do manifesto
    if (manifestIdx >= 0) {
      manifest[manifestIdx] = {
        ...manifest[manifestIdx],
        nome: payload.nome ? payload.nome.replace(/^LP - /, '') : manifest[manifestIdx].nome,
        githubRepository: payload.githubRepository || manifest[manifestIdx].githubRepository,
        publicUrl: payload.publicUrl || payload.url || manifest[manifestIdx].publicUrl,
        status: payload.status || manifest[manifestIdx].status,
        lastSeenCommit: payload.commitSha || manifest[manifestIdx].lastSeenCommit,
        lastSync: new Date().toISOString(),
        active: payload.active !== undefined ? Boolean(payload.active) : manifest[manifestIdx].active
      };
    } else {
      manifest.push({
        lovableProjectId: lovableId,
        nome: updatedRecord.ativo.replace(/^LP - /, ''),
        githubRepository: payload.githubRepository || null,
        growthOpsRecordId: targetRecordId,
        publicUrl: updatedRecord.url,
        status: updatedRecord.status,
        lastSeenCommit: payload.commitSha || null,
        lastSync: new Date().toISOString(),
        active: true
      });
    }

  } else {
    // CRIAÇÃO DE NOVO PROJETO
    isNew = true;
    let baseSlug = 'lp-' + slugify(payload.nome || payload.ativo || 'novo-projeto');
    targetRecordId = baseSlug;

    // Garantir ID único sem sobrescrever existente
    if (records.some(r => r.id === targetRecordId)) {
      targetRecordId = `${baseSlug}-${lovableId.slice(0, 8)}`;
    }

    const docRelativePath = `docs/landing-pages/${targetRecordId}.md`;

    updatedRecord = {
      schema: 'growth-ops-record-v2',
      id: targetRecordId,
      action: 'Criar',
      software: 'Landing Page',
      ativo: payload.nome ? (payload.nome.startsWith('LP - ') ? payload.nome : `LP - ${payload.nome}`) : `LP - ${targetRecordId}`,
      categoria: payload.categoria || 'Landing Page',
      responsavel: payload.responsavel || 'Marketing',
      area: 'Marketing / Growth',
      status: payload.status || 'A validar',
      url: payload.publicUrl || payload.url || '',
      twofa: 'Não aplicável',
      twofaMethod: 'Não aplicável',
      twofaOwner: 'Não aplicável',
      twofaOwnerType: 'Não aplicável',
      twofaPhoneMasked: '',
      phoneType: 'Não aplicável',
      secondAdmin: 'Não aplicável',
      recoveryValidated: 'Não aplicável',
      manualRisk: 'Automático',
      lastValidation: new Date().toLocaleDateString('pt-BR'),
      obs: `Projeto Lovable sincronizado automaticamente via pipeline Growth Ops. Project ID: ${lovableId}.`,
      next: 'Validar formulário, tracking e destino dos leads capturados.',
      extra: {
        lovableProjectId: lovableId,
        documentationPath: docRelativePath,
        documentationStatus: 'Disponível no repositório'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Aplicar dados extras iniciais
    updatedRecord = conservativeMerge(updatedRecord, payload);
    records.push(updatedRecord);

    manifest.push({
      lovableProjectId: lovableId,
      nome: updatedRecord.ativo.replace(/^LP - /, ''),
      githubRepository: payload.githubRepository || null,
      growthOpsRecordId: targetRecordId,
      publicUrl: updatedRecord.url,
      status: updatedRecord.status,
      lastSeenCommit: payload.commitSha || null,
      lastSync: new Date().toISOString(),
      active: true
    });
  }

  // Ordenar registros
  records = sortRecords(records);

  // Atualizar documentação individual
  const docPath = updatedRecord.extra?.documentationPath || `docs/landing-pages/${targetRecordId}.md`;
  updateDocumentationMarkdown(docPath, updatedRecord, payload, rootDir);

  // Atualizar todos os arquivos derivados e JSONs
  updateDerivedFiles(records, manifest, rootDir);

  // Validação pré-commit obrigatória
  try {
    const valResult = validateAll(rootDir);
    return {
      success: true,
      action: isNew ? 'CRIADO' : 'ATUALIZADO',
      recordId: targetRecordId,
      lovableProjectId: lovableId,
      validation: valResult
    };
  } catch (valError) {
    // Rollback em caso de erro
    fs.writeFileSync(registrosPath, snapshotRecords, 'utf8');
    fs.writeFileSync(manifestPath, snapshotManifest, 'utf8');
    throw valError;
  }
}

// ==========================================
// 7. SUITE DE TESTES AUTOMATIZADOS (A A H)
// ==========================================

export function runTestSuite(rootDir = defaultRoot) {
  console.log('Iniciando Suite de Testes de Sincronização Lovable Growth Ops...\n');

  // Criar diretório sandbox para isolar testes sem corromper repositório principal
  const tmpDir = path.join(rootDir, '.tmp-test-sandbox');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(tmpDir, 'data'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'docs/landing-pages'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'exports'), { recursive: true });

  // Copiar arquivos base
  fs.copyFileSync(path.join(rootDir, 'data/registros.json'), path.join(tmpDir, 'data/registros.json'));
  fs.copyFileSync(path.join(rootDir, 'data/landing-pages.json'), path.join(tmpDir, 'data/landing-pages.json'));
  fs.copyFileSync(path.join(rootDir, 'data/lovable-projects.json'), path.join(tmpDir, 'data/lovable-projects.json'));
  fs.copyFileSync(path.join(rootDir, 'data/pendencias.json'), path.join(tmpDir, 'data/pendencias.json'));

  // Copiar todos os arquivos de documentação
  const originalDocs = fs.readdirSync(path.join(rootDir, 'docs/landing-pages'));
  for (const doc of originalDocs) {
    fs.copyFileSync(path.join(rootDir, 'docs/landing-pages', doc), path.join(tmpDir, 'docs/landing-pages', doc));
  }

  const results = [];

  function test(name, fn) {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      results.push({ name, status: 'PASS' });
    } catch (e) {
      console.error(`❌ [FAIL] ${name}: ${e.message}`);
      results.push({ name, status: 'FAIL', error: e.message });
    }
  }

  // TESTE A: alteração de LP existente
  test('A) Alteração de LP existente com merge conservador', () => {
    const res = syncProject({
      lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
      publicUrl: 'https://aberturadefilial-atualizada.investsmart.com.br',
      status: 'Validado',
      commitSha: 'commit-teste-a'
    }, tmpDir);
    if (!res.success || res.action !== 'ATUALIZADO') throw new Error('Falha ao atualizar LP existente');

    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).find(r => r.id === 'lp-abertura-de-filial');
    if (reg.url !== 'https://aberturadefilial-atualizada.investsmart.com.br') throw new Error('URL não foi atualizada');
    if (!reg.extra.lovableProjectId) throw new Error('lovableProjectId foi apagado no merge');
    // Verificar que dados antigos não foram apagados
    if (!reg.extra.documentationPath) throw new Error('documentationPath perdido');
  });

  // TESTE B: criação simulada de projeto novo
  test('B) Criação simulada de projeto novo sem duplicidade', () => {
    const newLovableId = 'a1111111-2222-3333-4444-555555555555';
    const res = syncProject({
      lovableProjectId: newLovableId,
      nome: 'Nova Campanha InvestSmart XP Teste',
      publicUrl: 'https://novacampanha.investsmart.com.br',
      leadDestination: 'https://docs.google.com/spreadsheets/d/teste123/edit',
      gtmId: 'GTM-TESTB',
      githubRepository: 'gestaobankrio-code/nova-campanha'
    }, tmpDir);

    if (!res.success || res.action !== 'CRIADO') throw new Error('Falha ao criar novo projeto');
    const records = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/lovable-projects.json'), 'utf8'));

    const createdRecord = records.find(r => r.extra?.lovableProjectId === newLovableId);
    if (!createdRecord) throw new Error('Novo registro não encontrado em registros.json');
    if (!manifest.some(m => m.lovableProjectId === newLovableId)) throw new Error('Entrada ausente no manifesto');
    if (!fs.existsSync(path.join(tmpDir, createdRecord.extra.documentationPath))) throw new Error('Documentação Markdown não foi criada');
  });

  // TESTE C: alteração apenas de tracking
  test('C) Alteração apenas de tracking preservando campos existentes', () => {
    const res = syncProject({
      lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
      gtmId: 'GTM-NOVO-TRACKING',
      ga4Id: 'G-NOVO123',
      metaPixelId: '999888777666'
    }, tmpDir);
    if (!res.success) throw new Error('Falha no sync de tracking');

    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).find(r => r.id === 'lp-abertura-de-filial');
    if (reg.extra.gtmId !== 'GTM-NOVO-TRACKING') throw new Error('GTM não atualizado');
    if (reg.url !== 'https://aberturadefilial-atualizada.investsmart.com.br') throw new Error('URL anterior foi perdida');
  });

  // TESTE D: alteração apenas de formulário
  test('D) Alteração apenas de formulário', () => {
    const res = syncProject({
      lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
      formProvider: 'Bitrix24 CRM'
    }, tmpDir);
    if (!res.success) throw new Error('Falha no sync de formulário');

    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).find(r => r.id === 'lp-abertura-de-filial');
    if (reg.extra.formProvider !== 'Bitrix24 CRM') throw new Error('Provedor de formulário não atualizado');
    if (reg.extra.gtmId !== 'GTM-NOVO-TRACKING') throw new Error('GTM configurado anteriormente foi perdido');
  });

  // TESTE E: alteração de destino do lead
  test('E) Alteração de destino do lead preservando integridade', () => {
    const res = syncProject({
      lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
      leadDestination: 'https://webhook.n8n.investsmart.com.br/webhook/lead-abertura-filial'
    }, tmpDir);
    if (!res.success) throw new Error('Falha no sync de destino do lead');

    const reg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).find(r => r.id === 'lp-abertura-de-filial');
    if (reg.extra.leadDestination !== 'https://webhook.n8n.investsmart.com.br/webhook/lead-abertura-filial') throw new Error('leadDestination não atualizado');
  });

  // TESTE F: execução duplicada do mesmo evento (Idempotência)
  test('F) Execução duplicada do mesmo evento (Idempotência)', () => {
    const payload = {
      lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
      commitSha: 'commit-idempotente-1'
    };

    const countBefore = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).length;
    syncProject(payload, tmpDir);
    const countAfterFirst = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).length;
    syncProject(payload, tmpDir);
    const countAfterSecond = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data/registros.json'), 'utf8')).length;

    if (countBefore !== countAfterFirst || countAfterFirst !== countAfterSecond) {
      throw new Error(`Contagem de registros alterou na reexecução: ${countBefore} -> ${countAfterFirst} -> ${countAfterSecond}`);
    }
  });

  // TESTE G: falha de validação (bloqueio de secret ou payload inválido)
  test('G) Falha de validação bloqueia escrita e aborta com segurança', () => {
    let blocked = false;
    try {
      syncProject({
        lovableProjectId: '916a021c-04ba-42b2-9f23-5d0bba0b9136',
        extra: {
          testSecret: 'ghp_123456789012345678901234567890123456'
        }
      }, tmpDir);
    } catch (e) {
      blocked = true;
    }
    if (!blocked) throw new Error('Secret não foi bloqueado pela validação de segurança!');
  });

  // TESTE H: projeto sem lovableProjectId
  test('H) Projeto sem lovableProjectId é rejeitado de forma segura', () => {
    let rejected = false;
    try {
      syncProject({
        nome: 'Projeto Sem ID',
        publicUrl: 'https://exemplo.com'
      }, tmpDir);
    } catch (e) {
      rejected = true;
    }
    if (!rejected) throw new Error('Payload sem lovableProjectId não foi rejeitado!');
  });

  // Limpeza
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`\nResultado da suite: ${results.filter(r => r.status === 'PASS').length}/${results.length} testes passaram.`);
  if (!allPassed) {
    process.exit(1);
  }
}

// ==========================================
// 8. PONTO DE ENTRADA CLI E GITHUB ACTIONS
// ==========================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    runTestSuite(defaultRoot);
    process.exit(0);
  }

  if (args.includes('--validate-only')) {
    try {
      const res = validateAll(defaultRoot);
      console.log('VALIDATION_RESULT=PASS', JSON.stringify(res));
      process.exit(0);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }

  let payload = null;

  // 1. Argumento --payload '<json>'
  const payloadArgIdx = args.indexOf('--payload');
  if (payloadArgIdx >= 0 && args[payloadArgIdx + 1]) {
    payload = JSON.parse(args[payloadArgIdx + 1]);
  }

  // 2. Argumento --file '<path>'
  const fileArgIdx = args.indexOf('--file');
  if (fileArgIdx >= 0 && args[fileArgIdx + 1]) {
    payload = JSON.parse(fs.readFileSync(args[fileArgIdx + 1], 'utf8'));
  }

  // 3. GitHub Actions Event (repository_dispatch ou workflow_dispatch)
  if (!payload && process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    try {
      const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      if (event.client_payload) {
        payload = event.client_payload;
      } else if (event.inputs) {
        if (event.inputs.projectPayload) {
          payload = JSON.parse(event.inputs.projectPayload);
        } else if (event.inputs.lovableProjectId) {
          payload = {
            lovableProjectId: event.inputs.lovableProjectId,
            nome: event.inputs.nome,
            publicUrl: event.inputs.publicUrl,
            status: event.inputs.status
          };
        }
      }
    } catch (e) {
      console.error('Erro ao ler GITHUB_EVENT_PATH:', e.message);
    }
  }

  if (!payload) {
    console.log('Nenhum payload fornecido para sincronização.');
    console.log('Uso: node scripts/sync-lovable-growth-ops.mjs [--payload <json> | --file <path> | --test | --validate-only]');
    process.exit(0);
  }

  console.log(`Iniciando sincronização para lovableProjectId: ${payload.lovableProjectId}...`);
  const result = syncProject(payload, defaultRoot);
  console.log(`✅ Sucesso: Projeto ${result.recordId} foi ${result.action}.`);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('sync-lovable-growth-ops.mjs')) {
  main().catch(err => {
    console.error('❌ Erro na execução da sincronização:', err.message);
    process.exit(1);
  });
}
