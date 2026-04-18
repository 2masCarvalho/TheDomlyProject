# MVP Feature Audit — Domly (Atualizado)

> Audit date: 2026-04-18
> Branch: `tomas-changes`
> Stack: React 18 + TypeScript · Vite · Supabase (PostgreSQL + Storage + Edge Functions) · React Hook Form + Zod · TanStack Query · jsPDF · Claude AI

---

## 1. Detailed Audit Table

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| **Phase 1 — Onboarding** ||||
| 1 | Onboarding wizard completable in <10min | 🟡 Partial | Auth signup → condominio insert → ocorrencia insert → dashboard. **Step 3 (Payment) continua simulado** — não há billing backend. |
| 2 | Onboarding progress indicator | ✅ Done | Step labels, checkmarks, animated pulse dots. |
| 3 | Ability to skip optional steps and resume later | ✅ Done | **CORRIGIDO** — `onboardingState.ts` persiste progresso no localStorage. Formulários (Step 2, ocorrência) guardam drafts no blur. Resume no step correto ao reabrir. `resetOnboardingState()` ao completar. |
| 4 | AI auto-fill of category and priority | ✅ Done | Gemini API no onboarding (`classifyOccurrence.ts`) + keyword-based `suggestFromTitulo` no formulário principal. |
| **Phase 2 — Condominium Creation & Management** ||||
| 5 | Condominium creation form | ✅ Done | Todos os campos presentes. `create()` insere no Supabase. |
| 6 | Dashboard with list of condominiums (edit, deactivate) | ✅ Done | **CORRIGIDO** — `condominiosApi.deactivate()` e `.reactivate()` implementados. Coluna `is_active` adicionada via migration. `getAll({ includeInactive })` filtra por defeito. Toggle "Mostrar desativados" no dropdown de 3 pontos. |
| 7 | Condominium detail page | ✅ Done | **NOVO** — `CondominioDetailPage` com hero/cover, quick stats (5 mini-cards), 4 tabs: Informações, Ativos, Ocorrências, Documentos. Cards clicáveis, ações rápidas, upload de imagem de capa. |
| 8 | User and permission management | 🟡 Partial | Roles (`gestor`, `residente`, `tecnico`) existem na DB. **Falta**: roles scoped por condomínio, convite de utilizadores. |
| 9 | Document upload + categorization per condominium | ✅ Done | Upload para Supabase Storage. Categorias e tipos suportados. **Rota `/condominios/:id/documentos` adicionada.** |
| 10 | Document upload with AI extraction (bulk) | ✅ Done | **NOVO** — `DocumentUploadZone` com drag & drop múltiplo. `analyzeDocument.ts` envia PDF/imagem como base64 para IA. Extrai: tipo, categoria, resumo, datas, valor, entidade, alertas sugeridos. Resultados expandíveis por ficheiro. Migration `documentos_ai_fields` adiciona colunas de extração. |
| 11 | Document generation from templates | ✅ Done | Template placeholder substitution + PDF export via jsPDF. **Rota `/templates` e `/gerar-documento` adicionadas.** |
| **Phase 3 — Asset Registration & Management** ||||
| 12 | Asset registration form per condominium | ✅ Done | Todos os campos presentes. Wired to `ativosApi.create()`. |
| 13 | Asset inventory per condominium (with status) | ✅ Done | Status `overdue`/`soon`/`ok`. Detail page com fotos, docs, manutenções. |
| 14 | 14 asset types with preventive maintenance rules | ✅ Done | **CORRIGIDO** — Todas as 14 referências legais populadas com legislação portuguesa real: DL 320/2002 (elevadores), NP 4413:2019 (extintores), Portaria 1532/2008 (SCIE), DL 97/2017 (gás), DL 118/2013 (painéis solares), NP EN 62305 (para-raios), DL 268/94 (seguro obrigatório), etc. |
| **Phase 4 — Preventive & Corrective Maintenance** ||||
| 15 | Rules engine: asset type → frequency → automatic alert | 🟡 Partial | `computeNextMaintenanceDate()` calcula datas. `AlertsPage` mostra ativos overdue/soon. **Falta**: scheduler background / notificações push. |
| 16 | Maintenance calendar per condominium | ✅ Done | **CORRIGIDO** — Calendário agora mostra manutenções registadas E ativos com `data_proxima_manutencao` futura. Eventos "AGENDADA" (azul) e "ATRASADA" (vermelho). Clicar em evento de ativo navega para a detail page. Indicador de atrasos no subtítulo. |
| 17 | Incident ticket creation (photo, description, severity) | ✅ Done | **CORRIGIDO** — `OcorrenciaForm` agora tem secção de fotografias: thumbnails com preview, máx. 5 fotos, upload para bucket `ocorrencia-fotos`. Migration `ocorrencia_fotos` adiciona coluna `foto_urls text[]` e bucket. |
| 18 | Incident photo gallery | ✅ Done | **NOVO** — `OcorrenciaDetailPage` mostra galeria de fotos com thumbnails clicáveis e lightbox fullscreen (navegação setas, contador). |
| 19 | Ticket state flow | ✅ Done | Estados: reportada → triagem → em_progresso → resolvida → fechada. Auto-sets `resolved_at`. |
| 20 | Ticket history tab | ✅ Done | **NOVO** — `OcorrenciasPage` tem tabs "Ativas" e "Histórico". Ocorrências fechadas movem-se para o Histórico. Cards clicáveis (sem botão Eye). Kanban só mostra estados ativos. |
| 21 | Automatic notifications to manager | ❌ Missing | Sem serviço de email/push. |
| **Phase 5 — Financial Automation** ||||
| 22 | Monthly invoice generation engine | ❌ Missing | Zero ficheiros, zero tabelas. |
| 23 | Billing statement export to PDF | ❌ Missing | |
| 24 | Automatic invoice emailing | ❌ Missing | |
| 25 | Financial dashboard per condominium | ❌ Missing | |

---

## 2. Infrastructure & Quality

| Item | Status | Notes |
|------|--------|-------|
| ErrorBoundary | ✅ Done | **NOVO** — `ErrorBoundary.tsx` class component. Wraps app root + AppLayout. Recovery UI com "Recarregar"/"Início". Dev-only error details. |
| Routing completeness | ✅ Done | **CORRIGIDO** — Todas as rotas adicionadas: `/condominios/:id`, `/condominios/:id/documentos`, `/templates`, `/gerar-documento`, `/utilizadores`. |
| Visual redesign | ✅ Done | **NOVO** — Sidebar (secções, glow, tooltips), TopNav (breadcrumbs, ⌘K), Dashboard (KPIs, urgent strip), CondominiosPage (search, dropdown). |
| Onboarding document upload | ✅ Done | **CORRIGIDO** — Upload real via `documentosApi.uploadCondominioDocumento()` + `documentosApi.create()`. Antes era simulado. |
| Storage policies | ✅ Done | Policies para `condominio-documents` e `ocorrencia-fotos` criadas. |

---

## 3. What Still Needs to Be Built (por prioridade)

### Prioridade 1 — Notificações por email
- **Edge Function** para envio de emails (Resend/SendGrid) — fundacional
- Alertas proativos quando manutenção expira (cron job)
- Notificação ao gestor quando ocorrência crítica é criada (database webhook)

### Prioridade 2 — Módulo financeiro
- DB tables: `faturas`, `linhas_fatura`, `pagamentos`
- Engine de geração mensal por fração
- PDF export de extracto
- Envio automático por email (depende de Prioridade 1)

### Prioridade 3 — Segurança e qualidade
- Per-condominium role scoping + convite de utilizadores
- Data isolation: verificar RLS policies no Supabase para todas as tabelas
- API key exposure: chat Edge Function tem `Access-Control-Allow-Origin: *`
- Unificar duplicate Supabase clients (`supabase-client.ts` vs `integrations/supabase/client.ts`)

### Prioridade 4 — Nice-to-have
- Payment integration (Stripe) no onboarding Step 3
- Proactive maintenance alerts (scheduled background job)

---

## 4. Red Flags Atualizados

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| RF-1 | ~~🔴 Runtime crash~~ | `deactivate()`/`reactivate()` não existiam | ✅ **Resolvido** |
| RF-2 | 🟠 Billing gap | Step 3 do onboarding continua simulado | Pendente (Stripe) |
| RF-3 | 🟠 Data isolation risk | `ocorrenciasApi.getAll()` sem filtro user — depende de RLS | Pendente (verificar RLS) |
| RF-4 | 🟠 API key exposure | Chat Edge Function com `CORS: *` | Pendente |
| RF-5 | ~~🟡 Compliance credibility~~ | Referências legais eram placeholder | ✅ **Resolvido** — 14 referências populadas |
| RF-6 | ~~🟡 No error boundaries~~ | App crashava com tela branca | ✅ **Resolvido** — ErrorBoundary implementado |
| RF-7 | 🟡 Client-side tenant filter | `condominiosApi.getAll()` filtra client-side | Pendente (confirmar RLS) |
| RF-8 | 🟡 Null safety | `c.cidade.toLowerCase()` crashava com null | ✅ **Resolvido** — adicionado `|| ''` |

---

## 5. Ficheiros Criados/Modificados nesta Sessão

### Novos ficheiros
- `src/components/ErrorBoundary.tsx`
- `src/components/DocumentUploadZone/DocumentUploadZone.tsx`
- `src/lib/analyzeDocument.ts`
- `src/pages/CondominioDetailPage.tsx`
- `src/pages/CalendarPage.tsx` (reescrito)
- `src/pages/OcorrenciasPage.tsx` (reescrito com tabs)
- `src/pages/OcorrenciaDetailPage.tsx` (reescrito com galeria)
- `src/config/assetMaintenanceRules.ts` (referências legais)
- `src/utils/onboardingState.ts` (já existia, agora usado)

### Ficheiros modificados
- `src/App.tsx` — ErrorBoundary + rotas em falta
- `src/api/condominios.ts` — `deactivate()`, `reactivate()`, `getAll({ includeInactive })`, `is_active`
- `src/api/documentos.ts` — AI fields, `update()`, `EstadoProcessamento`
- `src/api/ocorrencias.ts` — `foto_urls`, `uploadPhoto()`, `uploadPhotos()`
- `src/pages/CondominiosPage.tsx` — dropdown 3 pontos, search
- `src/pages/OnboardingPage.tsx` — upload real + localStorage persistence
- `src/pages/DashboardPage.tsx` — redesenhado
- `src/components/CondominioCard.tsx` — clicável para detail page
- `src/components/OcorrenciaForm/OcorrenciaForm.tsx` — secção de fotos
- `src/components/AppSidebar.tsx` — redesenhado
- `src/components/TopNav.tsx` — redesenhado

### SQL Migrations
- `migration_add_is_active.sql` — coluna `is_active` em condominios
- `migration_documentos_ai_fields.sql` — colunas AI na tabela documentos + coluna `categoria`
- `migration_ocorrencia_fotos.sql` — coluna `foto_urls` + bucket `ocorrencia-fotos`
- `fix_storage_policies.sql` — policies para `condominio-documents`