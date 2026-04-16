# MVP Feature Audit — Domly

> Audit date: 2026-04-16
> Branch: `tomas-changes`
> Stack: React 18 + TypeScript · Vite · Supabase (PostgreSQL + Storage + Edge Functions) · React Hook Form + Zod · TanStack Query · jsPDF · Gemini AI

---

## 1. Detailed Audit Table

| # | Feature | Status | Evidence (file paths) | Notes / What's missing |
|---|---------|--------|-----------------------|------------------------|
| **Phase 1 — Onboarding** |||||
| 1 | Onboarding wizard completable in <10min (account → condominium → initial setup) | 🟡 Partial | `src/pages/OnboardingPage.tsx:396–472` (`finalizarOnboarding`) | Auth signup → condominio insert → ocorrencia insert → navigate to dashboard is fully wired. **However**, Step 3 (Payment) is a UI simulation — no billing backend exists. A paying customer cannot actually complete the wizard. |
| 2 | Onboarding progress indicator | ✅ Done | `src/pages/OnboardingPage.tsx:98–181` (`ProgressBar` component) | Step labels, completed checkmarks, and animated pulse dots rendered correctly. |
| 3 | Ability to skip optional steps and resume later | 🟡 Partial | `src/pages/OnboardingPage.tsx:862–872` (skip Step 4), `src/pages/OnboardingPage.tsx:922–932` (skip Step 5) | Skip buttons exist and call `finalizarOnboarding()` directly. **"Resume later" does not exist** — `formData` is React in-memory state only. Closing the tab mid-flow loses all progress; nothing is persisted to DB or localStorage. |
| 4 | AI auto-fill of category and priority when creating a ticket | ✅ Done | `src/pages/OnboardingPage.tsx:367–394` (`handleClassifyClick`), `src/lib/classifyOccurrence.ts`, `src/components/OcorrenciaForm/OcorrenciaForm.tsx:70–85` (`suggestFromTitulo`) | Two independent implementations: Gemini API (`classifyOccurrence.ts`) in the onboarding wizard; local keyword-based `suggestFromTitulo` in the main `OcorrenciaForm`. Both populate `categoria` + `prioridade`. |
| **Phase 2 — Condominium Creation & Management** |||||
| 5 | Condominium creation form (name, address, units, NIF) | ✅ Done | `src/components/CondominioForm/CondominioForm.tsx`, `src/api/condominios.ts:61–69` | All required fields present (nome, morada, codigo_postal, nif, num_fracoes). `create()` inserts to Supabase. |
| 6 | Dashboard with list of condominiums (edit, deactivate) | 🟡 Partial | `src/pages/CondominiosPage.tsx:45–87`, `src/context/CondominiosContext.tsx:67–87`, `src/api/condominios.ts` | Edit works. `deactivateCondominio` (line 69) and `reactivateCondominio` (line 80) are called in the context but **neither method exists in `condominiosApi`** — will throw a TypeError at runtime. |
| 7 | User and permission management (manager, resident, technician) | 🟡 Partial | `src/pages/UtilizadoresPage.tsx`, `src/api/userProfiles.ts`, `supabase/migrations/20260304_mvp_condos_roles_docs_templates.sql` | Roles (`gestor`, `residente`, `tecnico`) exist in DB and can be changed per user. **Missing**: roles are global to the company account, not scoped per condominium. No resident/technician invite or self-registration flow exists. |
| 8 | Document upload + categorization per condominium | ✅ Done | `src/pages/CondominioDocumentosPage.tsx`, `src/api/documentos.ts` | Upload to Supabase bucket `condominio-documents`. Categories (legal, financeiro, manutencao, comunicacao, outro) and types (contrato, ata, aviso, seguro, outro) supported. |
| 9 | Document generation from templates (with auto-filled data) | ✅ Done | `src/pages/GerarDocumentoPage.tsx`, `src/api/documentTemplates.ts` | Template placeholder substitution (`{{condominio.nome}}`, `{{dataHoje}}`). PDF export via jsPDF. Auto-saves to condominium documents. |
| **Phase 3 — Asset Registration & Management** |||||
| 10 | Asset registration form per condominium (type, brand, installation date, next maintenance) | ✅ Done | `src/components/AtivoForm/AtivoForm.tsx`, `src/api/ativos.ts:71–90` | All required fields present. Fully wired to `ativosApi.create()`. |
| 11 | Asset inventory per condominium (with status) | ✅ Done | `src/components/AtivosList/AtivosList.tsx`, `src/api/ativos.ts:108–117` (`getExpiryStatus`) | Status computed as `overdue` / `soon` / `ok` from `data_expiracao` or `data_proxima_manutencao`. Detail page at `src/pages/AtivoDetailPage.tsx`. |
| 12 | At least 10 asset types with preventive maintenance rules (frequency + legal reference) | 🟡 Partial | `src/config/assetMaintenanceRules.ts:24–98` | 14 asset types defined with correct `frequencyMonths`. **Every single `legalReference` is the placeholder string `"Referência legal a confirmar (...)"` — no actual legal citations are populated.** |
| **Phase 4 — Preventive & Corrective Maintenance** |||||
| 13 | Rules engine: asset type → frequency → automatic alert | 🟡 Partial | `src/config/assetMaintenanceRules.ts`, `src/utils/maintenanceDates.ts` (`computeNextMaintenanceDate`), `src/pages/AlertsPage.tsx` | `computeNextMaintenanceDate()` computes `data_proxima_manutencao` from config. `AlertsPage` displays overdue/soon assets. **Missing**: alerts are query-on-load only — no background scheduler or push notification when a date is crossed without a user opening the app. |
| 14 | Maintenance calendar per condominium (upcoming + overdue alerts) | 🟡 Partial | `src/pages/CalendarPage.tsx:17–42` | Fetches real data from `manutencoesApi.getAllMaintenances()` and renders events. **Scoped to logged maintenance records only** — assets with a future `data_proxima_manutencao` that have no logged record do not appear. No overdue visual distinction in the calendar itself. |
| 15 | Incident ticket creation (photo, description, severity) | 🟡 Partial | `src/components/OcorrenciaForm/OcorrenciaForm.tsx`, `src/api/ocorrencias.ts:67–74` | Title, description, category, and priority (severity) are fully implemented. **Photo upload is missing** — the form schema and insert payload contain no image/attachment field. |
| 16 | Ticket state flow: Reported → Assigned → In Resolution → Resolved | ✅ Done | `src/api/ocorrencias.ts:6` (type), `src/api/ocorrencias.ts:77–90` (update with auto `resolved_at`) | States: `reportada → triagem → em_progresso → resolvida → fechada`. Auto-sets `resolved_at` on transition to `resolvida`. Parallel `trabalhos` flow handles assignment via `assignTecnico()` in `src/api/trabalhos.ts`. |
| 17 | Automatic notifications to manager (preventive + overdue tickets) | ❌ Missing | — | No email/push notification service exists. The only Edge Function (`supabase/functions/chat/index.ts`) is a support chatbot. `email_geral` is stored on condominiums but never used programmatically. |
| **Phase 5 — Financial Automation** |||||
| 18 | Monthly invoice generation engine per unit (configurable rules) | ❌ Missing | — | No invoice-related pages, API files, or DB tables found anywhere in the codebase. |
| 19 | Billing statement export to PDF | ❌ Missing | — | jsPDF is used for document templates only. No invoice/billing PDF generator exists. |
| 20 | Automatic invoice emailing to owners | ❌ Missing | — | No email sending integration (SendGrid, Resend, SMTP, etc.) exists anywhere. |
| 21 | Financial dashboard per condominium (total billed, paid, outstanding) — *optional* | ❌ Missing | — | `DashboardPage.tsx` shows aggregate maintenance cost (`Investimento`) from the `manutencoes` table — this is cost tracking, not billing. No billing data model exists. |

---

## 2. Action List — What Still Needs to Be Built

### Phase 1 — Onboarding

**1.1 — Payment integration**
- **What**: Replace the simulated Step 3 with a real payment processor (Stripe Checkout or Stripe Elements).
- **Where**: New `src/lib/stripe.ts` + update `OnboardingPage.tsx` `handlePaymentSimulationSubmit`. Requires a new Supabase Edge Function (`supabase/functions/create-checkout/`) for session creation and a webhook handler for subscription status.
- **Dependencies**: Stripe account, `stripe` npm package, new Edge Function, Stripe webhook endpoint.

**1.2 — Onboarding resume / state persistence**
- **What**: Persist partial onboarding state so a user who closes the tab can resume where they left off.
- **Where**: Write `formData` to `localStorage` on each step advance (simplest), or create an `onboarding_sessions` DB table and upsert on each step (more robust).
- **Dependencies**: None for localStorage approach. New DB table + migration for server-side.

---

### Phase 2 — Condominium Management

**2.1 — Implement `deactivate` and `reactivate` API methods** *(blocks existing UI — fix first)*
- **What**: Add `deactivate(id)` and `reactivate(id)` to `condominiosApi`.
- **Where**: `src/api/condominios.ts` — implement soft-delete via an `ativo: boolean` column (or `deleted_at` timestamp). Update `getAll()` to filter by active status.
- **Dependencies**: DB migration to add `ativo`/`deleted_at` column to `condominios` table.

**2.2 — Per-condominium role scoping + user invite flow**
- **What**: Allow a manager to invite residents/technicians scoped to a specific condominium. Add an email invite flow (link or code).
- **Where**: New tab in `src/pages/CondominioDetailPage.tsx` or a new `src/pages/CondominioUtilizadoresPage.tsx`. New DB table `condominio_memberships(id_condominio, id_user, role)`. New Edge Function for invite email.
- **Dependencies**: New DB migration, email sending capability (see 4.1).

---

### Phase 3 — Asset Management

**3.1 — Populate legal references for all 14 asset types**
- **What**: Replace every `"Referência legal a confirmar"` string with a real Portuguese legal citation.
- **Where**: `src/config/assetMaintenanceRules.ts:26–97` — edit each `legalReference` value (e.g., DL 320/2002 for elevators, Portaria 1276/2002 for extintores).
- **Dependencies**: Legal/compliance review only — no code architecture changes.

---

### Phase 4 — Maintenance

**4.1 — Email notification service** *(foundational — other tasks depend on this)*
- **What**: Send email alerts to the condominium manager when: (a) a maintenance date is crossed, (b) an incident is created with `critica` or `alta` priority, (c) a ticket becomes overdue.
- **Where**: New `supabase/functions/send-notification/index.ts`. Triggered via Supabase Database Webhooks on `ocorrencias` insert/update, and a scheduled cron job for maintenance date checks.
- **Dependencies**: Email provider (Resend or SendGrid), API key env var in Supabase, Database Webhook or `pg_cron` configuration.

**4.2 — Photo upload on incident tickets**
- **What**: Add a file input to `OcorrenciaForm` that uploads to Supabase Storage and stores the URL on the record.
- **Where**: `src/components/OcorrenciaForm/OcorrenciaForm.tsx` + DB migration to add `foto_url text` to `ocorrencias` table. Can reuse the `condominio-documents` bucket or create `ocorrencia-fotos`.
- **Dependencies**: DB migration, Supabase Storage bucket.

**4.3 — Proactive maintenance alerts (scheduled)**
- **What**: A background job that scans `ativos` for overdue `data_proxima_manutencao` and fires notifications without requiring the user to open the app.
- **Where**: Extend the Edge Function from 4.1 with a cron trigger, or use `pg_cron` to query and call the notification function.
- **Dependencies**: Depends on **4.1**.

---

### Phase 5 — Financial Automation

**5.1 — Invoicing data model** *(must be built first — everything else in this phase depends on it)*
- **What**: New DB tables: `faturas` (invoice per unit per month), `linhas_fatura` (line items), `pagamentos` (payment records).
- **Where**: New Supabase migration file.
- **Dependencies**: None — foundational.

**5.2 — Invoice generation engine**
- **What**: Configurable rules engine that generates monthly `faturas` per unit (quota de condomínio, extraordinary expenses, etc.).
- **Where**: New `src/api/faturas.ts` + new `src/pages/FinanceiroPage.tsx`. Business logic can live client-side or in a scheduled Edge Function for automatic monthly runs.
- **Dependencies**: Depends on **5.1**.

**5.3 — Billing statement PDF export**
- **What**: Generate a per-unit or per-condominium PDF billing statement.
- **Where**: New export action in `src/pages/FinanceiroPage.tsx` using jsPDF (already installed). Follow the existing pattern in `src/pages/GerarDocumentoPage.tsx`.
- **Dependencies**: Depends on **5.1** and **5.2**.

**5.4 — Automatic invoice emailing**
- **What**: Email each unit owner their monthly statement as a PDF attachment.
- **Where**: Supabase Edge Function — can extend the notification function from 4.1.
- **Dependencies**: Depends on **4.1** (email service), **5.2** (invoice generation), **5.3** (PDF export).

---

## 3. Red Flags

| # | Severity | Description |
|---|----------|-------------|
| RF-1 | 🔴 **Runtime crash** | `src/context/CondominiosContext.tsx:69,80` calls `condominiosApi.deactivate()` and `condominiosApi.reactivate()`. These methods do not exist in `src/api/condominios.ts`. Any UI element triggering deactivate will throw a `TypeError`. |
| RF-2 | 🟠 **Billing gap** | `OnboardingPage.tsx` Step 3 collects card number, expiry, and CVV into local state but never transmits them anywhere. `handlePaymentSimulationSubmit` simply advances the step. Users complete "paid" onboarding without any actual payment. |
| RF-3 | 🟠 **Data isolation risk** | `ocorrenciasApi.getAll()` (`src/api/ocorrencias.ts:37–43`) runs `select('*')` with no `id_user` or company filter. All tenant isolation relies entirely on RLS. If the `ocorrencias` RLS policy is misconfigured, all incidents across all companies are visible to any authenticated user. Verify RLS is enforced server-side. |
| RF-4 | 🟠 **API key exposure** | `supabase/functions/chat/index.ts:3` sets `"Access-Control-Allow-Origin": "*"`. If this function is not also validated against a Supabase JWT, the `ANTHROPIC_API_KEY` is effectively callable from any origin and can be abused for cost. |
| RF-5 | 🟡 **Compliance credibility** | All 14 `legalReference` values in `src/config/assetMaintenanceRules.ts` are the placeholder `"Referência legal a confirmar"`. Shipping with these stubs while marketing compliance management as a feature is a credibility issue. |
| RF-6 | 🟡 **No error boundaries** | No `ErrorBoundary` component exists in the component tree. A runtime error in any context provider (e.g., the deactivate crash in RF-1) will unmount the entire React tree with a white screen and no recovery path for the user. |
| RF-7 | 🟡 **Client-side tenant filter** | `condominiosApi.getAll()` manually filters `.eq('id_user', userId)` in the client (`src/api/condominios.ts:48–58`). This is defence-in-depth only if an equivalent RLS policy exists. Confirm the `condominios` table has a server-side RLS policy enforcing the same filter. |
