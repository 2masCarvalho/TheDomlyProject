# MVP Feature Audit — Domly (Atualizado)

> Audit date: 2026-04-18 (rev. 2)
> Branch: `goncalo`
> Stack: React 18 + TypeScript · Vite · Supabase (PostgreSQL + Storage + Edge Functions) · React Hook Form + Zod · TanStack Query · jsPDF · Claude AI

---

## 1. Detailed Audit Table

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| **Phase 1 — Onboarding** ||||
| 1 | Onboarding wizard completable in <10min | 🟡 Partial | Auth signup → condominio insert → ocorrencia insert → dashboard. **Step 3 (Payment) continua simulado** — não há billing backend. |
| 2 | Onboarding progress indicator | ✅ Done | Step labels, checkmarks, animated pulse dots. |
| 3 | Ability to skip optional steps and resume later | ✅ Done | `onboardingState.ts` persiste progresso no localStorage. Formulários guardam drafts no blur. Resume no step correto. `resetOnboardingState()` ao completar. |
| 4 | AI auto-fill of category and priority | ✅ Done | Gemini API no onboarding (`classifyOccurrence.ts`) + keyword-based `suggestFromTitulo` no formulário principal. |
| **Phase 2 — Condominium Creation & Management** ||||
| 5 | Condominium creation form | ✅ Done | Todos os campos presentes. `create()` insere no Supabase. |
| 6 | Dashboard with list of condominiums (edit, deactivate) | ✅ Done | `condominiosApi.deactivate()` e `.reactivate()` implementados. Coluna `is_active`. Toggle "Mostrar desativados". |
| 7 | Condominium detail page | ✅ Done | `CondominioDetailPage` com hero/cover, quick stats (5 mini-cards), 4 tabs: Informações, Ativos, Ocorrências, Documentos. |
| 8 | User and permission management | 🟡 Partial | `memberships.ts` implementado: `createInviteToken()`, `claimInvite()`, `getByCondominio()`, `removeMember()`. DB tables `invite_tokens` + `condominio_memberships` existem. `JoinPage.tsx` funciona. `UtilizadoresPage.tsx` gere roles globais. **Falta**: roles scoped por condomínio (são globais agora). |
| 9 | Document upload + categorization per condominium | ✅ Done | Upload para Supabase Storage. Categorias e tipos suportados. Rota `/condominios/:id/documentos` adicionada. |
| 10 | Document upload with AI extraction (bulk) | ✅ Done | `DocumentUploadZone` com drag & drop múltiplo. `analyzeDocument.ts` envia PDF/imagem como base64 para IA. Extrai: tipo, categoria, resumo, datas, valor, entidade, alertas sugeridos. |
| 11 | Document generation from templates | ✅ Done | Template placeholder substitution + PDF export via jsPDF. Rotas `/templates` e `/gerar-documento` adicionadas. |
| **Phase 3 — Asset Registration & Management** ||||
| 12 | Asset registration form per condominium | ✅ Done | Todos os campos presentes. Wired to `ativosApi.create()`. |
| 13 | Asset inventory per condominium (with status) | ✅ Done | Status `overdue`/`soon`/`ok`. Detail page com fotos, docs, manutenções. |
| 14 | 14 asset types with preventive maintenance rules | ✅ Done | Todas as 14 referências legais populadas com legislação portuguesa real: DL 320/2002 (elevadores), NP 4413:2019 (extintores), Portaria 1532/2008 (SCIE), DL 97/2017 (gás), DL 118/2013 (painéis solares), NP EN 62305 (para-raios), DL 268/94 (seguro obrigatório), etc. |
| **Phase 4 — Preventive & Corrective Maintenance** ||||
| 15 | Rules engine: asset type → frequency → automatic alert | 🟡 Partial | `computeNextMaintenanceDate()` calcula datas. `AlertsPage` mostra ativos overdue/soon. **Falta**: scheduler background / notificações push. |
| 16 | Maintenance calendar per condominium | ✅ Done | Calendário mostra manutenções registadas E ativos com `data_proxima_manutencao` futura. Eventos "AGENDADA" (azul) e "ATRASADA" (vermelho). Clicar em evento navega para detail page. |
| 17 | Incident ticket creation (photo, description, severity) | ✅ Done | `OcorrenciaForm` tem secção de fotografias: thumbnails com preview, máx. 5 fotos, upload para bucket `ocorrencia-fotos`. |
| 18 | Incident photo gallery | ✅ Done | `OcorrenciaDetailPage` mostra galeria de fotos com thumbnails clicáveis e lightbox fullscreen (navegação setas, contador). |
| 19 | Ticket state flow | ✅ Done | Estados: reportada → triagem → em_progresso → resolvida → fechada. Auto-sets `resolved_at`. |
| 20 | Ticket history tab | ✅ Done | `OcorrenciasPage` tem tabs "Ativas" e "Histórico". Ocorrências fechadas movem-se para o Histórico. Kanban só mostra estados ativos. |
| 21 | Automatic notifications to manager | ❌ Missing | Sem serviço de email/push. Nenhuma Edge Function de email. Sem Resend/SendGrid. |
| **Phase 5 — Financial Automation** ||||
| 22 | Monthly invoice generation engine | ❌ Missing | Zero ficheiros, zero tabelas (`faturas`, `linhas_fatura`, `pagamentos` não existem). |
| 23 | Billing statement export to PDF | ❌ Missing | |
| 24 | Automatic invoice emailing | ❌ Missing | Depende de #21 e #22. |
| 25 | Financial dashboard per condominium | ❌ Missing | Nenhuma página financeira existe. |

---

## 2. Infrastructure & Quality

| Item | Status | Notes |
|------|--------|-------|
| ErrorBoundary | ✅ Done | `ErrorBoundary.tsx` class component. Wraps app root + AppLayout. Recovery UI com "Recarregar"/"Início". Dev-only error details. |
| Routing completeness | ✅ Done | Todas as rotas adicionadas: `/condominios/:id`, `/condominios/:id/documentos`, `/templates`, `/gerar-documento`, `/utilizadores`, `/condominios/:id/ativos`, `/condominios/:condominioId/ativos/:ativoId`, `/trabalhos/:id`, `/ocorrencias/:id`. |
| Visual redesign | ✅ Done | Sidebar (secções, glow, tooltips), TopNav (breadcrumbs, ⌘K), Dashboard (KPIs, urgent strip), CondominiosPage (search, dropdown). |
| Onboarding document upload | ✅ Done | Upload real via `documentosApi.uploadCondominioDocumento()` + `documentosApi.create()`. |
| Storage policies | ✅ Done | Policies para `condominio-documents` e `ocorrencia-fotos` criadas. |
| Invite / membership system | ✅ Done | `memberships.ts` + `invite_tokens` + `condominio_memberships` tables + `JoinPage.tsx`. |
| Duplicate Supabase clients | ❌ Not fixed | `src/supabase-client.ts` tem **credenciais hardcoded** e é o ficheiro importado por todos os `src/api/*`. `src/integrations/supabase/client.ts` usa env vars mas não é utilizado. Risco de segurança ativo. |
| Chat Edge Function CORS | ❌ Not fixed | `supabase/functions/chat/index.ts` tem `Access-Control-Allow-Origin: *`. Qualquer origem pode chamar a Edge Function. |
| RLS em tabelas core | ⚠️ Inconsistente | `users`, `condominios`, `documentos`, `condominio_memberships`, `invite_tokens` têm RLS adequado. `ocorrencias`, `trabalhos_manutencao`, `tecnicos`, `candidaturas_trabalho`, `ativos` têm RLS permissivo (`USING (true)`) — qualquer utilizador autenticado pode ler/editar todos os registos. |

---

## 3. O Que Falta Construir (por prioridade)

### Prioridade 1 — Notificações por email ❌ BLOQUEADOR
- **Edge Function** para envio de emails (Resend/SendGrid) — sem isto #21, #24 são impossíveis
- Alertas proativos quando manutenção expira (cron job no Supabase)
- Notificação ao gestor quando ocorrência crítica é criada (database webhook)

### Prioridade 2 — Módulo financeiro ❌ ZERO IMPLEMENTADO
- DB tables: `faturas`, `linhas_fatura`, `pagamentos`
- Engine de geração mensal por fração
- PDF export de extracto (pode reutilizar jsPDF já presente)
- Envio automático por email (depende de Prioridade 1)
- Dashboard financeiro por condomínio

### Prioridade 3 — Segurança ⚠️ RISCOS ATIVOS
- **Unificar Supabase clients**: migrar todos os `src/api/*` de `@/supabase-client` para `@/integrations/supabase/client` e remover credenciais hardcoded
- **RLS**: adicionar policies de ownership em `ocorrencias`, `ativos`, `trabalhos_manutencao`, `tecnicos` para isolar dados por condomínio/gestor
- **CORS**: restringir `Access-Control-Allow-Origin` na chat Edge Function para o domínio da app
- Per-condominium role scoping: actualmente os roles (`gestor`, `residente`, `tecnico`) são globais — falta associar role ao par `(user, condominio)` na tabela `condominio_memberships`

### Prioridade 4 — Nice-to-have
- Payment integration (Stripe) no onboarding Step 3
- Proactive maintenance alerts (scheduled background job)
- Scheduler: Supabase cron ou pg_cron para notificações automáticas de manutenção

---

## 4. Red Flags Atualizados

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| RF-1 | ~~🔴 Runtime crash~~ | `deactivate()`/`reactivate()` não existiam | ✅ **Resolvido** |
| RF-2 | 🟠 Billing gap | Step 3 do onboarding continua simulado | Pendente (Stripe) |
| RF-3 | 🔴 API key hardcoded | `src/supabase-client.ts` contém anon key e URL hardcoded — é o ficheiro que toda a app usa | **Pendente — risco activo** |
| RF-4 | 🟠 CORS aberto | Chat Edge Function com `Access-Control-Allow-Origin: *` | Pendente |
| RF-5 | ~~🟡 Compliance credibility~~ | Referências legais eram placeholder | ✅ **Resolvido** — 14 referências populadas |
| RF-6 | ~~🟡 No error boundaries~~ | App crashava com tela branca | ✅ **Resolvido** — ErrorBoundary implementado |
| RF-7 | 🟠 RLS permissivo | `ocorrencias`, `ativos`, `trabalhos_manutencao` usam `USING (true)` — sem isolamento real por utilizador | Pendente |
| RF-8 | ~~🟡 Null safety~~ | `c.cidade.toLowerCase()` crashava com null | ✅ **Resolvido** — adicionado `\|\| ''` |
| RF-9 | 🟡 Roles globais | `condominio_memberships` existe mas role não está associado por condomínio — roles são globais na tabela `users` | Pendente |

---

## 5. Ficheiros Existentes (estado actual)

### Páginas (`src/pages/`)
- `DashboardPage.tsx`, `CondominiosPage.tsx`, `CondominioDetailPage.tsx`
- `CondominioDocumentosPage.tsx`, `AtivosPage.tsx`, `AtivoDetailPage.tsx`
- `CalendarPage.tsx`, `AlertsPage.tsx`, `MaintenancePage.tsx`
- `OcorrenciasPage.tsx`, `OcorrenciaDetailPage.tsx`
- `TrabalhosPage.tsx`, `TrabalhoDetailPage.tsx`, `TecnicosPage.tsx`
- `TemplatesPage.tsx`, `GerarDocumentoPage.tsx`
- `UtilizadoresPage.tsx` ✅ (gere roles globais)
- `JoinPage.tsx` ✅ (claim de invite token)
- `ConformidadePage.tsx`, `SettingsPage.tsx`, `SuportePage.tsx`, `OnboardingPage.tsx`

### APIs (`src/api/`)
- `ativos.ts`, `condominios.ts`, `documentos.ts`, `documentTemplates.ts`
- `memberships.ts` ✅ (invite tokens + condominio memberships)
- `ocorrencias.ts`, `tecnicos.ts`, `trabalhos.ts`, `userProfiles.ts`

### Edge Functions (`supabase/functions/`)
- `chat/index.ts` — IA conversacional (Claude Haiku). CORS aberto.
- ❌ Sem função de email

### SQL Migrations aplicadas
- `migration_add_is_active.sql`
- `migration_documentos_ai_fields.sql`
- `migration_ocorrencia_fotos.sql`
- `fix_storage_policies.sql`
- `20260416_condominio_memberships.sql` — invite_tokens + condominio_memberships
- `20260416_condominios_member_select.sql` — RLS para membros verem condomínios
- `20260416_condominios_rls_restore.sql` — **desactiva RLS em condominios** (filtro client-side)
