'use strict';

const repo = 'gestaobankrio-code/growth-ops-investsmart';

const softwareProfiles = {
  'Make': { category: 'Automação / Integração', url: 'https://www.make.com', description: 'Cenários, conexões, billing, origem e destino dos dados.', fields: [['organization','Organização / Team','A validar'],['scenarioName','Nome do cenário','A validar'],['scenarioStatus','Status do cenário','Ativo / Pausado / A validar'],['trigger','Gatilho','Webhook / Schedule / Manual'],['connections','Conexões utilizadas','A validar'],['sourceApp','Aplicativo de origem','A validar'],['destinationApp','Aplicativo de destino','A validar'],['billingOwner','Responsável pelo billing','A validar']] },
  'Google Ads': { category: 'Mídia paga', url: 'https://ads.google.com', description: 'Campanhas, conversões, billing, tags e permissões.', fields: [['customerId','Customer ID','000-000-0000'],['mcc','MCC vinculada?','Sim / Não / A validar'],['billing','Billing / cobrança','A validar'],['mainConversion','Conversão principal','Lead / WhatsApp / Form submit'],['linkedGtm','GTM vinculado','A validar'],['linkedGa4','GA4 vinculado','A validar'],['mediaOwner','Responsável de mídia','A validar'],['campaignStatus','Status das campanhas','Ativas / Pausadas / A validar']] },
  'Meta Ads': { category: 'Mídia paga', url: 'https://business.facebook.com', description: 'Business Manager, contas de anúncio, páginas, pixels e permissões.', fields: [['businessManagerId','Business Manager ID','A validar'],['adAccountId','Conta de anúncio ID','act_...'],['page','Página vinculada','A validar'],['instagram','Instagram vinculado','A validar'],['pixelId','Meta Pixel ID','A validar'],['domainVerified','Domínio verificado?','Sim / Não / A validar'],['events','Eventos configurados','Lead, PageView'],['bmOwner','Responsável pelo BM','A validar']] },
  'Google Tag Manager': { category: 'Tracking', url: 'https://tagmanager.google.com', description: 'Containers, workspaces, permissões de publicação e tags.', fields: [['gtmId','GTM ID','GTM-XXXXXXX'],['containerName','Nome do container','A validar'],['workspace','Workspace principal','Default Workspace'],['publishPermission','Quem pode publicar?','A validar'],['criticalTags','Tags críticas','GA4, Meta Pixel, Google Ads'],['environment','Ambiente','Web / Server-side'],['lastPublish','Última publicação','A validar'],['technicalOwner','Responsável técnico','A validar']] },
  'Google Analytics / GA4': { category: 'Analytics', url: 'https://analytics.google.com', description: 'Propriedades GA4, eventos, conversões e acessos.', fields: [['propertyId','Property ID','A validar'],['measurementId','Measurement ID','G-XXXXXXXXXX'],['streamUrl','Stream URL','A validar'],['events','Eventos principais','page_view, generate_lead'],['conversions','Conversões marcadas','A validar'],['googleAdsLink','Vínculo Google Ads?','Sim / Não / A validar'],['retention','Retenção de dados','A validar'],['analyticsOwner','Responsável Analytics','A validar']] },
  'Meta Pixel': { category: 'Tracking', url: 'https://business.facebook.com/events_manager2', description: 'Pixel, eventos, domínio verificado e integração com Meta Ads.', fields: [['pixelId','Meta Pixel ID','A validar'],['datasetId','Dataset ID','A validar'],['domain','Domínio instalado','A validar'],['events','Eventos ativos','PageView, Lead'],['capi','Conversions API ativa?','Sim / Não / A validar'],['dedup','Deduplicação configurada?','Sim / Não / A validar'],['installSource','Origem da instalação','GTM / Código / A validar'],['pixelOwner','Responsável pelo pixel','A validar']] },
  'HubSpot': { category: 'CRM / Formulários', url: 'https://app.hubspot.com', description: 'Portal, formulários, propriedades e integrações.', fields: [['portalId','Portal ID','A validar'],['formId','Form ID principal','A validar'],['properties','Propriedades críticas','firstname, email, phone, origem'],['integrationSource','Origem da integração','Lovable / n8n / Make'],['leadDestination','Destino do lead','HubSpot / Bitrix / Sheets'],['operator','Profissional responsável','Terceirizado / A validar'],['plan','Plano HubSpot','Free / Starter / Pro'],['sla','SLA de atualização','A validar']] },
  'Bitrix': { category: 'CRM', url: 'A validar', description: 'CRM oficial, distribuição de leads, origem, regras e SLA.', fields: [['portal','Portal Bitrix','A validar'],['pipeline','Pipeline/Funil','A validar'],['leadSource','Origem do lead','A validar'],['distributionRule','Regra de distribuição','A validar'],['sla','SLA de atendimento','A validar'],['requiredFields','Campos obrigatórios','Nome, telefone, e-mail, origem'],['admin','Administrador Bitrix','A validar'],['marketingAccess','Marketing possui gerência?','Não / Parcial / A validar']] },
  'n8n': { category: 'Automação / Integração', url: 'https://n8n.investsmart.com.br', description: 'Workflows, webhooks, origem, destino e responsável técnico.', fields: [['workflowName','Nome do workflow','A validar'],['webhookUrl','Webhook URL','Registrar com cuidado'],['triggerType','Tipo de gatilho','Webhook / Schedule / Manual'],['source','Origem dos dados','Lovable / API / A validar'],['destination','Destino dos dados','Bitrix / HubSpot / Sheets'],['workflowStatus','Status do workflow','Ativo / Inativo / A validar'],['technicalOwner','Responsável técnico','Tecnologia / Processos'],['lastTest','Último teste','A validar']] },
  'Lovable': { category: 'Landing pages', url: 'https://lovable.dev', description: 'Projetos, deploys, formulários, domínio e webhook.', fields: [['projectName','Nome do projeto Lovable','A validar'],['lovableUrl','URL Lovable','https://...lovable.app'],['deployUrl','URL de deploy','A validar'],['publicDomain','Domínio público','A validar'],['formFields','Campos do formulário','Nome, e-mail, telefone'],['webhookUrl','Webhook vinculado','A validar'],['tracking','Tracking instalado','GTM / GA4 / Pixel'],['lpOwner','Responsável pela LP','Marketing']] },
  'Landing Page': { category: 'Landing Page', url: 'A validar', description: 'Campanha, identificador, domínio, URL, webhook, tracking e destino do lead.', fields: [['campaignName','Campanha / Projeto','Ex.: Meu Novo Lar'],['variation','Variação','Orgânico / Marketing / Samyr'],['identifier','Identificador','UC_XXXXX'],['lovableUrl','URL Lovable / Deploy','A validar'],['publicDomain','Domínio público','A validar'],['webhookUrl','Webhook n8n / Make','A validar'],['gtmId','GTM ID','A validar'],['pixelId','Meta Pixel ID','A validar'],['ga4Id','GA4 Measurement ID','A validar'],['leadDestination','Destino do lead','Bitrix / HubSpot / Sheets']] },
  'ManyChat': { category: 'Automação social', url: 'https://app.manychat.com', description: 'Fluxos, canais, gatilhos, tags e captura de leads.', fields: [['workspace','Workspace','A validar'],['channel','Canal','Instagram / WhatsApp / Messenger'],['keyword','Palavra-chave gatilho','Ex.: Planeja'],['flowName','Nome do fluxo','A validar'],['tags','Tags aplicadas','A validar'],['collectedFields','Campos coletados','Nome, e-mail, telefone'],['leadDestination','Destino do lead','Sheets / n8n / Bitrix'],['flowStatus','Status do fluxo','Ativo / Pausado / A validar']] },
  'Google Sheets': { category: 'Planilhas', url: 'https://sheets.google.com', description: 'Planilhas, abas, proprietários, permissões e destino de leads.', fields: [['spreadsheetName','Nome da planilha','A validar'],['spreadsheetUrl','URL da planilha','A validar'],['tabs','Abas utilizadas','A validar'],['owner','Proprietário','A validar'],['permissions','Permissões','Leitor / Editor / Owner'],['dataReceived','Dados recebidos','Leads / Tracking'],['integration','Integração vinculada','n8n / Make / Manual'],['sharingRisk','Risco de compartilhamento','Baixo / Médio / Alto']] },
  'Dropbox': { category: 'Armazenamento', url: 'https://www.dropbox.com', description: 'Pastas, permissões, compartilhamentos e responsáveis.', fields: [['folderPath','Pasta principal','A validar'],['owner','Proprietário','A validar'],['sharedWith','Compartilhado com','A validar'],['contentType','Tipo de conteúdo','Criativos / Docs / Relatórios'],['permission','Permissão','Visualizar / Editar / Admin'],['publicLink','Possui link público?','Sim / Não / A validar'],['backupPolicy','Política de backup','A validar'],['folderOwner','Responsável pela pasta','A validar']] },
  'Canva': { category: 'Criativos', url: 'https://www.canva.com', description: 'Equipe, pastas, brand kit, templates e permissões.', fields: [['teamName','Equipe Canva','A validar'],['brandKit','Brand Kit configurado?','Sim / Não / A validar'],['folders','Pastas principais','A validar'],['templates','Templates principais','A validar'],['users','Usuários com acesso','A validar'],['permission','Permissão','Admin / Designer / Visualizador'],['criticalAssets','Materiais críticos','Apresentações, criativos'],['designOwner','Responsável pelos criativos','A validar']] },
  'Looker Studio': { category: 'Relatórios', url: 'https://lookerstudio.google.com', description: 'Dashboards, fontes de dados, proprietários e atualização.', fields: [['reportName','Nome do relatório','A validar'],['reportUrl','URL do relatório','A validar'],['dataSources','Fontes de dados','GA4, Sheets, Ads, Meta'],['owner','Proprietário','A validar'],['sharing','Compartilhamento','Privado / Link / Domínio'],['refreshStatus','Atualização dos dados','OK / Erro / A validar'],['kpis','KPIs principais','Leads, CPL, Conversão'],['biOwner','Responsável pelo dashboard','A validar']] },
  'Domínios / DNS': { category: 'Infraestrutura', url: 'A validar', description: 'Domínios, DNS, provedor, vencimento, registros e responsável técnico.', fields: [['domain','Domínio','exemplo.com.br'],['subdomain','Subdomínio','lp.exemplo.com.br'],['registrar','Registrador','Registro.br / Cloudflare / Outro'],['dnsProvider','Provedor DNS','Cloudflare / Registro.br'],['renewalDate','Data de renovação','A validar'],['dnsRecords','Registros DNS críticos','A, CNAME, TXT, MX'],['technicalOwner','Responsável técnico','Tecnologia / A validar'],['riskNotes','Risco ou observação','A validar']] },
  'Outro': { category: 'Outro', url: 'A validar', description: 'Cadastro genérico para ativos sem modelo específico.', fields: [['assetType','Tipo do ativo','A validar'],['purpose','Finalidade','A validar'],['referenceUrl','URL / referência','A validar'],['mainOwner','Responsável principal','A validar'],['sourceSystem','Sistema de origem','A validar'],['destinationSystem','Sistema de destino','A validar'],['dependencies','Dependências','A validar'],['technicalNote','Observação técnica','A validar']] }
};

let records = [];
let currentFilter = 'ativos';
let currentSearch = '';
let currentDetailsId = null;

function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function norm(value) { return String(value || '').trim(); }
function esc(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function md(value) { return String(value ?? '').replaceAll('|','\\|').replaceAll('\n',' '); }
function slug(value) { return String(value || 'registro').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

async function loadOfficialData(showToast = false) {
  try {
    const response = await fetch('data/registros.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    records = Array.isArray(data) ? data : (Array.isArray(data.records) ? data.records : []);
    if (showToast) toast('Dados oficiais atualizados a partir do GitHub.');
  } catch (error) {
    records = [];
    toast('Não foi possível carregar data/registros.json. Confirme o upload e o GitHub Pages.');
  }
  render();
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4200);
}

function risk(item) {
  if (item.manualRisk && item.manualRisk !== 'Automático') return item.manualRisk;
  if (item.twofaOwnerType === 'Ex-colaborador' || item.twofaOwnerType === 'Desconhecido') return 'Crítico';
  if (item.twofaOwner === 'A validar' || !norm(item.twofaOwner)) return 'Crítico';
  if (item.twofa === 'Não' || item.twofa === 'A validar') return 'Alto';
  if (item.twofaMethod === 'SMS' && item.phoneType === 'Terceirizado') return 'Crítico';
  if (item.twofaMethod === 'SMS' && item.phoneType === 'Pessoal autorizado' && item.secondAdmin !== 'Sim') return 'Alto';
  if (item.secondAdmin === 'Não') return 'Alto';
  if (item.recoveryValidated === 'Não' || item.recoveryValidated === 'A validar') return 'Médio';
  if (item.twofa === 'Sim' && item.recoveryValidated === 'Sim' && item.secondAdmin === 'Sim') return 'Baixo';
  return 'Médio';
}

function badge(text) {
  const value = norm(text) || 'A validar';
  let cls = 'neutral';
  if (['Validado','Ativo','Sim','Baixo'].includes(value)) cls = 'ok';
  if (['A validar','Incompleto','Médio'].includes(value)) cls = 'pending';
  if (['Alto','Crítico','Não','Reprovado'].includes(value)) cls = 'risk';
  if (['Não aplicável','Arquivado'].includes(value)) cls = 'info';
  return `<span class="badge ${cls}">${esc(value)}</span>`;
}

function isArchived(item) { return ['Arquivado','Excluído'].includes(item.status) || item.action === 'Excluir'; }

function initSoftwareSelect() {
  const select = document.getElementById('software');
  select.innerHTML = Object.keys(softwareProfiles).map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
}

function onSoftwareChange(existingExtra = null, keepManualValues = false) {
  const software = document.getElementById('software').value;
  const profile = softwareProfiles[software] || softwareProfiles.Outro;
  document.getElementById('specificTitle').textContent = `2. Campos específicos de ${software}`;
  document.getElementById('specificDescription').textContent = profile.description;
  if (!keepManualValues) {
    if (!norm(document.getElementById('categoria').value) || !document.getElementById('editingId').value) document.getElementById('categoria').value = profile.category;
    if (!norm(document.getElementById('url').value) || !document.getElementById('editingId').value) document.getElementById('url').value = profile.url;
    if (!norm(document.getElementById('nome').value) || !document.getElementById('editingId').value) document.getElementById('nome').value = software;
  }
  renderSpecificFields(software, existingExtra);
}

function renderSpecificFields(software, existingExtra = null) {
  const profile = softwareProfiles[software] || softwareProfiles.Outro;
  document.getElementById('specificFields').innerHTML = profile.fields.map(([key, label, placeholder]) => {
    const value = existingExtra && existingExtra[key] ? existingExtra[key] : '';
    return `<div class="field"><label>${esc(label)}</label><input data-extra-key="${esc(key)}" data-extra-label="${esc(label)}" value="${esc(value)}" placeholder="${esc(placeholder)}"></div>`;
  }).join('');
}

function extraValues() {
  const extra = {};
  document.querySelectorAll('[data-extra-key]').forEach(field => { extra[field.dataset.extraKey] = norm(field.value); });
  return extra;
}

function labelsFor(software) {
  const labels = {};
  const profile = softwareProfiles[software] || softwareProfiles.Outro;
  profile.fields.forEach(([key, label]) => labels[key] = label);
  return labels;
}

function filtered() {
  return records.filter(item => {
    const itemRisk = risk(item);
    const extraText = Object.values(item.extra || {}).join(' ');
    const searchable = [item.software,item.ativo,item.categoria,item.responsavel,item.area,item.status,item.url,item.twofa,item.twofaMethod,item.twofaOwner,item.twofaOwnerType,item.twofaPhoneMasked,item.phoneType,item.secondAdmin,item.recoveryValidated,itemRisk,item.obs,item.next,extraText].join(' ').toLowerCase();
    const matchesSearch = !currentSearch || searchable.includes(currentSearch.toLowerCase());
    let matchesFilter = true;
    if (currentFilter === 'ativos') matchesFilter = !isArchived(item);
    if (currentFilter === 'A validar') matchesFilter = item.status === 'A validar' && !isArchived(item);
    if (currentFilter === 'Validado') matchesFilter = item.status === 'Validado' && !isArchived(item);
    if (currentFilter === 'Risco alto') matchesFilter = ['Alto','Crítico'].includes(itemRisk) && !isArchived(item);
    if (currentFilter === 'Sem 2FA') matchesFilter = item.twofa === 'Não' && !isArchived(item);
    if (currentFilter === 'Código a validar') matchesFilter = (item.twofaOwner === 'A validar' || !norm(item.twofaOwner) || item.twofaOwnerType === 'A validar' || item.twofaOwnerType === 'Desconhecido') && !isArchived(item);
    if (currentFilter === 'Landing Page') matchesFilter = (item.software === 'Landing Page' || item.categoria === 'Landing Page') && !isArchived(item);
    if (currentFilter === 'Tracking') matchesFilter = (['Google Tag Manager','Google Analytics / GA4','Meta Pixel'].includes(item.software) || item.categoria === 'Tracking') && !isArchived(item);
    if (currentFilter === 'Automação') matchesFilter = (['Make','n8n','ManyChat'].includes(item.software) || String(item.categoria || '').includes('Automação')) && !isArchived(item);
    if (currentFilter === 'CRM') matchesFilter = (['Bitrix','HubSpot'].includes(item.software) || String(item.categoria || '').includes('CRM')) && !isArchived(item);
    if (currentFilter === 'Arquivado') matchesFilter = isArchived(item);
    return matchesSearch && matchesFilter;
  });
}

function render() {
  const tbody = document.getElementById('records');
  const list = filtered();
  tbody.innerHTML = list.map(item => {
    const itemRisk = risk(item);
    return `<tr class="clickable-row" onclick="openDetails('${item.id}')">
      <td><div class="asset-title"><strong>${esc(item.ativo)}</strong><span>${esc(item.url || 'Sem URL')}</span></div></td>
      <td>${esc(item.software || 'A validar')}</td>
      <td>${esc(item.categoria || 'A validar')}</td>
      <td>${esc(item.responsavel || 'A validar')}</td>
      <td>${badge(item.status)}</td>
      <td>${badge(item.twofa)}</td>
      <td><strong>${esc(item.twofaOwner || 'A validar')}</strong><br><span style="color:var(--muted);font-size:12px">${esc(item.twofaOwnerType || 'A validar')} • ${esc(item.twofaPhoneMasked || 'Telefone não informado')}</span></td>
      <td>${badge(item.twofaMethod)}</td>
      <td>${badge(itemRisk)}</td>
      <td><div class="actions">
        <button class="secondary mini" onclick="event.stopPropagation();openDetails('${item.id}')">Detalhes</button>
        <button class="secondary mini" onclick="event.stopPropagation();openDrawer('editar','${item.id}')">Editar</button>
        <button class="success mini" onclick="event.stopPropagation();requestStatusById('${item.id}','Validado')">Validar</button>
        <button class="danger mini" onclick="event.stopPropagation();requestStatusById('${item.id}','Reprovado')">Reprovar</button>
        <button class="warning mini" onclick="event.stopPropagation();requestStatusById('${item.id}','Arquivado')">Arquivar</button>
        <button class="danger mini" onclick="event.stopPropagation();requestStatusById('${item.id}','Excluir')">Excluir</button>
      </div></td>
    </tr>`;
  }).join('');
  document.getElementById('emptyState').classList.toggle('hidden', list.length !== 0);
  updateCards();
}

function updateCards() {
  const active = records.filter(item => !isArchived(item));
  const risks = active.filter(item => ['Alto','Crítico'].includes(risk(item))).length;
  const ownerPending = active.filter(item => item.twofaOwner === 'A validar' || !norm(item.twofaOwner) || item.twofaOwnerType === 'A validar' || item.twofaOwnerType === 'Desconhecido').length;
  document.getElementById('total').textContent = active.length;
  document.getElementById('validated').textContent = active.filter(item => item.status === 'Validado').length;
  document.getElementById('pending').textContent = active.filter(item => item.status === 'A validar').length;
  document.getElementById('riskCount').textContent = risks;
  document.getElementById('without2fa').textContent = active.filter(item => item.twofa === 'Não').length;
  document.getElementById('ownerPending').textContent = ownerPending;
  document.getElementById('statusText').textContent = (risks > 0 || ownerPending > 0) ? 'Atenção operacional' : 'Governança estável';
  document.getElementById('statusDescription').textContent = (risks > 0 || ownerPending > 0) ? `${risks} registro(s) em risco alto/crítico e ${ownerPending} com responsável pelo código a validar.` : 'Não há pendências críticas de 2FA ou responsável pelo código.';
}

function filterBy(filter, element) { currentFilter = filter; document.querySelectorAll('.filter').forEach(btn => btn.classList.remove('active')); element.classList.add('active'); render(); }
function applySearch() { currentSearch = document.getElementById('search').value.trim(); render(); }
function resetSearch() { currentSearch = ''; document.getElementById('search').value = ''; render(); }

function openDrawer(mode, id = null) {
  document.getElementById('drawer').classList.add('open');
  if (mode === 'editar') {
    const item = records.find(record => record.id === id);
    if (!item) return toast('Registro não encontrado.');
    document.getElementById('drawerTitle').textContent = 'Editar registro';
    setForm(item);
  } else {
    document.getElementById('drawerTitle').textContent = 'Novo registro';
    clearForm();
  }
}
function closeDrawer() { document.getElementById('drawer').classList.remove('open'); }

function clearForm() {
  document.getElementById('editingId').value = '';
  document.getElementById('acao').value = 'Criar';
  document.getElementById('software').value = 'Make';
  ['nome','categoria','responsavel','area','url','twofaOwner','twofaPhoneMasked','lastValidation','obs','next'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('status').value = 'A validar';
  document.getElementById('twofa').value = 'A validar';
  document.getElementById('twofaMethod').value = 'A validar';
  document.getElementById('twofaOwnerType').value = 'A validar';
  document.getElementById('phoneType').value = 'A validar';
  document.getElementById('secondAdmin').value = 'A validar';
  document.getElementById('recoveryValidated').value = 'A validar';
  document.getElementById('manualRisk').value = 'Automático';
  onSoftwareChange(null, false);
}

function setForm(item) {
  document.getElementById('editingId').value = item.id;
  document.getElementById('acao').value = 'Atualizar';
  document.getElementById('software').value = item.software || 'Outro';
  document.getElementById('nome').value = item.ativo || '';
  document.getElementById('categoria').value = item.categoria || '';
  document.getElementById('responsavel').value = item.responsavel || '';
  document.getElementById('area').value = item.area || '';
  document.getElementById('status').value = item.status || 'A validar';
  document.getElementById('url').value = item.url || '';
  document.getElementById('twofa').value = item.twofa || 'A validar';
  document.getElementById('twofaMethod').value = item.twofaMethod || 'A validar';
  document.getElementById('twofaOwner').value = item.twofaOwner || '';
  document.getElementById('twofaOwnerType').value = item.twofaOwnerType || 'A validar';
  document.getElementById('twofaPhoneMasked').value = item.twofaPhoneMasked || '';
  document.getElementById('phoneType').value = item.phoneType || 'A validar';
  document.getElementById('secondAdmin').value = item.secondAdmin || 'A validar';
  document.getElementById('recoveryValidated').value = item.recoveryValidated || 'A validar';
  document.getElementById('manualRisk').value = item.manualRisk || 'Automático';
  document.getElementById('lastValidation').value = item.lastValidation || 'A validar';
  document.getElementById('obs').value = item.obs || '';
  document.getElementById('next').value = item.next || '';
  onSoftwareChange(item.extra || {}, true);
}

function getForm() {
  const software = document.getElementById('software').value;
  const profile = softwareProfiles[software] || softwareProfiles.Outro;
  const action = document.getElementById('acao').value;
  return {
    schema: 'growth-ops-record-v2', id: document.getElementById('editingId').value || makeId(), action, software,
    ativo: norm(document.getElementById('nome').value) || software,
    categoria: norm(document.getElementById('categoria').value) || profile.category,
    responsavel: norm(document.getElementById('responsavel').value) || 'A validar',
    area: norm(document.getElementById('area').value) || 'A validar',
    status: document.getElementById('status').value,
    url: norm(document.getElementById('url').value) || profile.url || 'A validar',
    twofa: document.getElementById('twofa').value,
    twofaMethod: document.getElementById('twofaMethod').value,
    twofaOwner: norm(document.getElementById('twofaOwner').value) || 'A validar',
    twofaOwnerType: document.getElementById('twofaOwnerType').value,
    twofaPhoneMasked: norm(document.getElementById('twofaPhoneMasked').value),
    phoneType: document.getElementById('phoneType').value,
    secondAdmin: document.getElementById('secondAdmin').value,
    recoveryValidated: document.getElementById('recoveryValidated').value,
    manualRisk: document.getElementById('manualRisk').value,
    lastValidation: norm(document.getElementById('lastValidation').value) || 'A validar',
    obs: norm(document.getElementById('obs').value),
    next: norm(document.getElementById('next').value) || 'A validar',
    extra: extraValues()
  };
}

function containsSensitiveContent(item) {
  const content = JSON.stringify(item).toLowerCase();
  const blocked = ['senha:', 'password:', 'token:', 'secret:', 'api key:', 'apikey:', 'recovery code', 'código 2fa', 'codigo 2fa'];
  return blocked.some(term => content.includes(term));
}

function saveToGitHub() {
  const item = getForm();
  if (containsSensitiveContent(item)) return toast('Bloqueado: remova senha, token, código 2FA, recovery code ou dado sensível.');
  openIssue(item);
}

function requestStatusFromForm(status) {
  const item = getForm();
  item.status = status === 'Excluir' ? 'Excluído' : status;
  item.action = status === 'Excluir' ? 'Excluir' : (status === 'Arquivado' ? 'Arquivar' : (status === 'Validado' ? 'Validar' : (status === 'Reprovado' ? 'Reprovar' : 'Atualizar')));
  if (status === 'Validado') item.lastValidation = new Date().toLocaleDateString('pt-BR');
  if (containsSensitiveContent(item)) return toast('Bloqueado: remova conteúdo sensível.');
  openIssue(item);
}

function requestStatusById(id, status) {
  const item = clone(records.find(record => record.id === id));
  if (!item) return toast('Registro não encontrado.');
  item.status = status === 'Excluir' ? 'Excluído' : status;
  item.action = status === 'Excluir' ? 'Excluir' : (status === 'Arquivado' ? 'Arquivar' : (status === 'Validado' ? 'Validar' : (status === 'Reprovado' ? 'Reprovar' : 'Atualizar')));
  if (status === 'Validado') item.lastValidation = new Date().toLocaleDateString('pt-BR');
  const confirmText = status === 'Excluir'
    ? `Solicitar exclusão oficial de "${item.ativo}" no GitHub? Esta ação removerá o registro da base após a Action consolidar.`
    : `Solicitar alteração oficial de "${item.ativo}" para status "${status}" no GitHub?`;
  if (!confirm(confirmText)) return;
  openIssue(item);
}

function issueBody(item) {
  const labels = labelsFor(item.software);
  const extra = Object.entries(item.extra || {}).map(([key, value]) => `- ${labels[key] || key}: ${value || 'A validar'}`).join('\n');
  return `## Solicitação Growth Ops

### Dados principais
- Ação: ${item.action}
- Software / Plataforma: ${item.software}
- Ativo: ${item.ativo}
- Categoria: ${item.categoria}
- Responsável operacional: ${item.responsavel}
- Área gestora: ${item.area}
- Status: ${item.status}
- URL principal / acesso: ${item.url}

### Campos específicos de ${item.software}
${extra || '- Sem campos específicos preenchidos.'}

### Segurança e recuperação de acesso
- 2FA ativo: ${item.twofa}
- Método de 2FA: ${item.twofaMethod}
- Quem recebe o código: ${item.twofaOwner}
- Tipo de responsável pelo código: ${item.twofaOwnerType}
- Telefone mascarado: ${item.twofaPhoneMasked || 'Não informado'}
- Tipo do telefone: ${item.phoneType}
- Existe segundo administrador: ${item.secondAdmin}
- Recuperação validada: ${item.recoveryValidated}
- Risco calculado: ${risk(item)}

### Governança
- Última validação: ${item.lastValidation}
- Observações: ${item.obs || 'Sem observações'}
- Próxima ação: ${item.next}

### Confirmação de segurança
Confirmo que não inseri senhas, tokens, chaves de API, códigos 2FA, recovery codes, número completo de telefone, prints de código, dados pessoais de leads ou informações financeiras sensíveis.

<!-- GROWTH_OPS_JSON
${JSON.stringify(item, null, 2)}
GROWTH_OPS_JSON -->`;
}

function openIssue(item) {
  const title = `[Growth Ops] ${item.action} - ${item.software} - ${item.ativo}`;
  const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody(item))}&labels=growth-ops`;
  const popup = window.open(url, '_blank', 'noopener');
  if (!popup) toast('O navegador bloqueou a nova aba. Libere pop-ups para abrir a solicitação no GitHub.');
  else toast('Confirme a criação da Issue no GitHub. A Action salvará oficialmente no repositório.');
}

function openDetails(id) {
  const item = records.find(record => record.id === id);
  if (!item) return toast('Registro não encontrado.');
  currentDetailsId = id;
  const labels = labelsFor(item.software);
  const extra = Object.entries(item.extra || {}).map(([key, value]) => detailItem(labels[key] || key, value || 'A validar')).join('');
  document.getElementById('detailsTitle').textContent = item.ativo;
  document.getElementById('detailsSubtitle').textContent = `${item.software || 'Software a validar'} • ${item.categoria || 'Categoria a validar'} • ${item.status || 'Status a validar'}`;
  document.getElementById('detailsContent').innerHTML = `
    <div class="detail-section"><h4>Dados principais</h4><div class="detail-grid">${detailItem('Ativo', item.ativo)}${detailItem('Software', item.software)}${detailItem('Categoria', item.categoria)}${detailItem('Status', badge(item.status), true)}${detailItem('Responsável operacional', item.responsavel)}${detailItem('Área gestora', item.area)}${detailItem('URL principal / acesso', item.url || 'A validar', false, true)}</div></div>
    <div class="detail-section"><h4>Campos específicos de ${esc(item.software || 'software')}</h4><div class="detail-grid">${extra || detailItem('Informações específicas', 'Nenhum campo específico preenchido.', false, true)}</div></div>
    <div class="detail-section"><h4>Segurança e recuperação de acesso</h4><div class="detail-grid">${detailItem('2FA ativo', badge(item.twofa), true)}${detailItem('Método de 2FA', badge(item.twofaMethod), true)}${detailItem('Quem recebe o código', item.twofaOwner || 'A validar')}${detailItem('Tipo de responsável pelo código', item.twofaOwnerType || 'A validar')}${detailItem('Telefone vinculado', item.twofaPhoneMasked || 'Telefone não informado')}${detailItem('Tipo do telefone', item.phoneType || 'A validar')}${detailItem('Segundo administrador', badge(item.secondAdmin), true)}${detailItem('Recuperação validada', badge(item.recoveryValidated), true)}${detailItem('Risco calculado', badge(risk(item)), true, true)}</div></div>
    <div class="detail-section"><h4>Governança</h4><div class="detail-grid">${detailItem('Última validação', item.lastValidation || 'A validar')}${detailItem('Risco manual', item.manualRisk || 'Automático')}${detailItem('Observações', item.obs || 'Sem observações', false, true)}${detailItem('Próxima ação', item.next || 'A validar', false, true)}</div></div>`;
  document.getElementById('detailsDrawer').classList.add('open');
}

function detailItem(label, value, raw = false, full = false) {
  return `<div class="detail-item ${full ? 'full' : ''}"><small>${esc(label)}</small>${raw ? `<span>${value}</span>` : `<strong>${esc(value || 'A validar')}</strong>`}</div>`;
}
function closeDetails() { document.getElementById('detailsDrawer').classList.remove('open'); }
function editFromDetails() { if (!currentDetailsId) return; closeDetails(); openDrawer('editar', currentDetailsId); }
function statusFromDetails(status) { if (!currentDetailsId) return; requestStatusById(currentDetailsId, status); }

function pendingItems() {
  const items = [];
  records.filter(item => !isArchived(item)).forEach(item => {
    const itemRisk = risk(item);
    if (['Alto','Crítico'].includes(itemRisk)) items.push({ ...item, pendingReason: `Risco ${itemRisk}` });
    if (item.twofa === 'Não') items.push({ ...item, pendingReason: '2FA desativado' });
    if (item.twofaOwner === 'A validar' || !norm(item.twofaOwner)) items.push({ ...item, pendingReason: 'Quem recebe o código a validar' });
    if (item.twofaOwnerType === 'Desconhecido') items.push({ ...item, pendingReason: 'Responsável pelo código desconhecido' });
    if (item.secondAdmin === 'Não') items.push({ ...item, pendingReason: 'Sem segundo administrador' });
    if (['Não','A validar'].includes(item.recoveryValidated)) items.push({ ...item, pendingReason: 'Recuperação de acesso não validada' });
  });
  return items;
}

function exportJson() { download('growth-ops-registros.json', JSON.stringify(records, null, 2), 'application/json'); }
function exportCsv(type) {
  let rows, name;
  if (type === 'seguranca') {
    name = 'growth-ops-seguranca-2fa.csv';
    rows = records.map(item => ({ ativo:item.ativo, software:item.software, twofa:item.twofa, metodo_2fa:item.twofaMethod, quem_recebe_codigo:item.twofaOwner, tipo_responsavel:item.twofaOwnerType, telefone_mascarado:item.twofaPhoneMasked, tipo_telefone:item.phoneType, segundo_admin:item.secondAdmin, recuperacao_validada:item.recoveryValidated, risco:risk(item) }));
  } else if (type === 'pendencias') {
    name = 'growth-ops-pendencias.csv';
    rows = pendingItems().map(item => ({ ativo:item.ativo, software:item.software, risco:risk(item), pendencia:item.pendingReason, proxima_acao:item.next }));
  } else {
    name = 'growth-ops-inventario.csv';
    rows = records.map(item => ({ ativo:item.ativo, software:item.software, categoria:item.categoria, responsavel:item.responsavel, area:item.area, status:item.status, url:item.url, twofa:item.twofa, metodo_2fa:item.twofaMethod, quem_recebe_codigo:item.twofaOwner, risco:risk(item), proxima_acao:item.next }));
  }
  download(name, toCsv(rows), 'text/csv;charset=utf-8');
}
function toCsv(rows) { if (!rows.length) return ''; const headers = Object.keys(rows[0]); return '\ufeff' + [headers.join(';'), ...rows.map(row => headers.map(header => '"' + String(row[header] ?? '').replaceAll('"','""') + '"').join(';'))].join('\n'); }
function downloadDocumentation() { download('documentacao-growth-ops-investsmart.md', generateDocumentation(records), 'text/markdown'); }
function downloadCurrentMarkdown() { download('growth-ops-' + slug(getForm().ativo) + '.md', itemMarkdown(getForm()), 'text/markdown'); }
function downloadDetailsMarkdown() { const item = records.find(record => record.id === currentDetailsId); if (item) download('growth-ops-' + slug(item.ativo) + '.md', itemMarkdown(item), 'text/markdown'); }
function download(name, content, mime) { const blob = new Blob([content], { type:mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

function generateDocumentation(items) {
  const active = items.filter(item => !isArchived(item));
  const p = pendingItems();
  return `# Documentação Growth Ops InvestSmart\n\nAtualização gerada pelo painel em ${new Date().toLocaleString('pt-BR')}.\n\n## Resumo executivo\n\n| Indicador | Total |\n|---|---:|\n| Registros ativos | ${active.length} |\n| Validados | ${active.filter(item => item.status === 'Validado').length} |\n| A validar | ${active.filter(item => item.status === 'A validar').length} |\n| Risco alto/crítico | ${active.filter(item => ['Alto','Crítico'].includes(risk(item))).length} |\n| Sem 2FA | ${active.filter(item => item.twofa === 'Não').length} |\n| Código a validar | ${active.filter(item => item.twofaOwner === 'A validar' || !norm(item.twofaOwner)).length} |\n\n## Inventário\n\n| Ativo | Software | Categoria | Responsável | Status | Risco |\n|---|---|---|---|---|---|\n${active.map(item => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.categoria)} | ${md(item.responsavel)} | ${md(item.status)} | ${md(risk(item))} |`).join('\n')}\n\n## Segurança e 2FA\n\n| Ativo | 2FA | Método | Quem recebe o código | Telefone | Segundo admin | Recuperação | Risco |\n|---|---|---|---|---|---|---|---|\n${active.map(item => `| ${md(item.ativo)} | ${md(item.twofa)} | ${md(item.twofaMethod)} | ${md(item.twofaOwner)} | ${md(item.twofaPhoneMasked || 'Não informado')} | ${md(item.secondAdmin)} | ${md(item.recoveryValidated)} | ${md(risk(item))} |`).join('\n')}\n\n## Pendências\n\n| Ativo | Software | Pendência | Próxima ação |\n|---|---|---|---|\n${p.length ? p.map(item => `| ${md(item.ativo)} | ${md(item.software)} | ${md(item.pendingReason)} | ${md(item.next)} |`).join('\n') : '| Nenhuma pendência crítica | - | - | - |'}\n`;
}

function itemMarkdown(item) {
  const labels = labelsFor(item.software);
  const extra = Object.entries(item.extra || {}).map(([key, value]) => `- ${labels[key] || key}: ${value || 'A validar'}`).join('\n');
  return `## ${item.ativo}\n\n### Dados principais\n- Software: ${item.software}\n- Categoria: ${item.categoria}\n- Responsável: ${item.responsavel}\n- Área: ${item.area}\n- Status: ${item.status}\n- URL: ${item.url}\n- Risco: ${risk(item)}\n\n### Campos específicos\n${extra || '- Nenhum campo específico preenchido.'}\n\n### Segurança\n- 2FA: ${item.twofa}\n- Método: ${item.twofaMethod}\n- Quem recebe o código: ${item.twofaOwner}\n- Telefone: ${item.twofaPhoneMasked || 'Não informado'}\n- Segundo admin: ${item.secondAdmin}\n- Recuperação: ${item.recoveryValidated}\n\n### Governança\n- Última validação: ${item.lastValidation}\n- Observações: ${item.obs || 'Sem observações'}\n- Próxima ação: ${item.next}\n`;
}

function openGitHubIssues() { window.open(`https://github.com/${repo}/issues`, '_blank', 'noopener'); }

document.getElementById('search').addEventListener('keydown', event => { if (event.key === 'Enter') applySearch(); });
document.getElementById('drawer').addEventListener('click', event => { if (event.target.id === 'drawer') closeDrawer(); });
document.getElementById('detailsDrawer').addEventListener('click', event => { if (event.target.id === 'detailsDrawer') closeDetails(); });

initSoftwareSelect();
renderSpecificFields('Make');
loadOfficialData();
