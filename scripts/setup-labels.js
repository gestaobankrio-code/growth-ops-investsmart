'use strict';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

const labels = [
  ['growth-ops', '111827', 'Registro operacional Growth Ops'],
  ['a-validar', 'f59e0b', 'Pendente de validação'],
  ['validado', '16a34a', 'Validado'],
  ['reprovado', 'dc2626', 'Reprovado'],
  ['arquivar', 'd97706', 'Arquivar registro'],
  ['excluir', '991b1b', 'Excluir registro'],
  ['automacao', '2563eb', 'Automação'],
  ['tracking', '7c3aed', 'Tracking'],
  ['landing-page', '0891b2', 'Landing page'],
  ['crm', '4b5563', 'CRM'],
  ['seguranca', 'ef4444', 'Segurança e 2FA']
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  for (const [name, color, description] of labels) {
    await upsertLabel(name, color, description);
  }
}

async function upsertLabel(name, color, description) {
  const endpoint = `https://api.github.com/repos/${repo}/labels/${encodeURIComponent(name)}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  const payload = JSON.stringify({ name, color, description });
  const update = await fetch(endpoint, { method: 'PATCH', headers, body: payload });
  if (update.status === 404) {
    await fetch(`https://api.github.com/repos/${repo}/labels`, { method: 'POST', headers, body: payload });
  }
}
