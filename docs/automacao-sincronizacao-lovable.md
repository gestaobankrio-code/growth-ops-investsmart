# Automação de Sincronização Lovable ↔ Growth Ops InvestSmart

## 1. Visão Geral da Arquitetura

Esta esteira garante que qualquer alteração ou criação de Landing Pages e projetos Lovable utilizados pelo Marketing seja sincronizada automaticamente com o repositório central `gestaobankrio-code/growth-ops-investsmart` e refletida no Painel Executivo sem intervenção manual.

```
Lovable Platform
   │  (Git Sync automático da Lovable)
   ▼
Repositório GitHub da Landing Page
   │  (Push na branch main / master / lovable-sync*)
   ▼
Workflow: .github/workflows/notify-growth-ops.yml
   │  (Dispara repository_dispatch com token seguro GROWTH_OPS_PAT)
   ▼
Repositório Central: gestaobankrio-code/growth-ops-investsmart
   │  (Workflow: .github/workflows/sync-lovable-growth-ops.yml)
   ▼
Script: scripts/sync-lovable-growth-ops.mjs
   ├── 1. Validação de segurança (Zero secrets / Zero PII)
   ├── 2. Reconciliação estrita por lovableProjectId
   ├── 3. Upsert com Merge Conservador (preserva histórico)
   ├── 4. Atualização de documentação individual (docs/landing-pages/<id>.md)
   ├── 5. Atualização de data/lovable-projects.json e data/registros.json
   ├── 6. Atualização de arquivos derivados e CSVs
   └── 7. Validação pré-commit de integridade e compatibilidade com o Painel
   ▼
Commit automático seguro ([skip ci] para evitar loops)
```

---

## 2. Regras Críticas de Negócio

1. **Chave Primária Obrigatória:**  
   A reconciliação é realizada estritamente por `lovableProjectId` (UUID do projeto Lovable). Nunca se deve sobrescrever ou agrupar projetos distintos apenas pela semelhança de nome.
2. **Merge Conservador:**  
   Campos técnicos previamente levantados por auditorias manuais ou validações anteriores (ex: URLs de planilhas de leads, webhooks, IDs de tracking, credenciais de 2FA e histórico de riscos) **nunca são apagados** caso uma sincronização nova traga campos vazios ou marcados como "A VALIDAR".
3. **Segurança Absoluta (Zero Secrets & Zero PII):**  
   O sincronizador possui um scanner nativo via expressões regulares que rejeita imediatamente qualquer payload que contenha tokens de API (`ghp_`, `sk-`, `Bearer`), chaves privadas, senhas ou dados pessoais de leads (ex: CPFs, e-mails reais de formulários).
4. **Proteção Contra Loop Infinito:**  
   Os commits gerados pela esteira utilizam a tag `[skip ci]` e são assinados pelo `growth-ops-bot`. Os workflows verificam e ignoram commits com essa marcação.
5. **Fallback por Agendamento:**  
   O workflow central executa a cada 6 horas (`0 */6 * * *`) para reconciliar eventuais eventos que não tenham sido disparados em tempo real.

---

## 3. Manifesto de Projetos (`data/lovable-projects.json`)

O manifesto central registra o mapeamento completo e atualizado entre o ecossistema Lovable e o Growth Ops:

- `lovableProjectId`: UUID canônico na plataforma Lovable.
- `nome`: Nome do ativo ou campanha.
- `githubRepository`: Repositório GitHub correspondente (ex: `gestaobankrio-code/aberturadefilial02`).
- `growthOpsRecordId`: ID único canônico no Growth Ops (ex: `lp-abertura-de-filial`).
- `publicUrl`: URL de produção ou preview da LP.
- `status`: Situação operacional (`Validado`, `A validar`, etc.).
- `lastSeenCommit`: Hash SHA do último commit sincronizado.
- `lastSync`: Data/hora ISO da última reconciliação.
- `active`: Booleano que indica se o projeto está ativo.

---

## 4. Como Configurar um Novo Repositório de Landing Page

Para que um novo projeto Lovable envie atualizações automáticas para o Growth Ops:

1. No repositório da Landing Page (ex: `gestaobankrio-code/lp-nova-campanha`), adicione a secret:
   - **Nome:** `GROWTH_OPS_PAT`
   - **Valor:** GitHub Personal Access Token (Fine-grained ou Classic) com permissão `contents: write` ou `repo` no repositório `gestaobankrio-code/growth-ops-investsmart`.
2. Adicione o arquivo de workflow `.github/workflows/notify-growth-ops.yml` utilizando o modelo disponível em:
   `.github/workflows/notify-growth-ops.template.yml`
3. Se o repositório não contiver o arquivo `.lovable` com o UUID do projeto, configure também a secret:
   - **Nome:** `LOVABLE_PROJECT_ID`
   - **Valor:** UUID do projeto Lovable.

---

## 5. Suíte de Testes Automatizados

O script de sincronização inclui uma suíte completa de testes unitários e de integração cobrindo todos os cenários críticos:

- **Teste A:** Alteração de LP existente com merge conservador.
- **Teste B:** Criação simulada de projeto novo sem duplicidade.
- **Teste C:** Alteração apenas de tracking (GTM, GA4, Pixel) preservando os demais dados.
- **Teste D:** Alteração apenas de formulário preservando tracking e destinos.
- **Teste E:** Alteração de destino do lead (Sheets/Webhook/CRM).
- **Teste F:** Execução duplicada do mesmo evento (idempotência).
- **Teste G:** Tentativa de injeção de credencial ou secret (bloqueio seguro).
- **Teste H:** Tentativa de sincronização sem `lovableProjectId` (rejeição segura).

Para rodar a suíte localmente ou no CI:
```bash
node scripts/sync-lovable-growth-ops.mjs --test
```
