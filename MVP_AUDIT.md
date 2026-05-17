# MVP Feature Audit — Domly (Atualizado)

> Audit date: 2026-05-17 (rev. 3)
> Branch: `fix/ai-edge-functions`
> Stack: React 18 + TypeScript · Vite · Supabase (PostgreSQL + Storage + Edge Functions) · React Hook Form + Zod · TanStack Query · jsPDF · Claude AI · Gemini AI

---

## 1. Detailed Audit Table

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| **Phase 1 — Onboarding** ||||
| 1 | Onboarding wizard completable in <10min | 🟡 Partial | Auth signup → condomínio insert → ocorrência insert → dashboard. Confetti agora dispara no fim do passo + na chegada ao dashboard. **Step 3 (Payment) continua simulado** — sem billing backend. |
| 2 | Onboarding progress indicator | ✅ Done | Step labels, checkmarks, animated pulse dots. Cópia do step 7 melhorada ("A preparar o seu espaço de trabalho..."). |
| 3 | Skip optional steps and resume later | ✅ Done | `onboardingState.ts` persiste no localStorage. Resume no step correto. Draft notification visível. |
| 4 | AI auto-fill of category and priority | ✅ Done | Gemini no onboarding (`classifyOccurrence.ts`) + keyword fallback `suggestFromTitulo`. Edge function `classify-occurrence` para uso server-side. |
| **Phase 2 — Condominium Creation & Management** ||||
| 5 | Condominium creation form | ✅ Done | Todos os campos presentes. `condominiosApi.create()` insere com `id_user` do auth. |
| 6 | Dashboard with list of condominiums (edit, deactivate) | ✅ Done | `deactivate()`/`reactivate()`. Coluna `is_active`. Toggle "Mostrar desativados". Empty state agora usa componente partilhado. |
| 7 | Condominium detail page | ✅ Done | `CondominioDetailPage` com hero/cover, quick stats, 5 tabs: Informações, Ativos, Ocorrências, Documentos, **Membros**. |
| 8 | User and permission management | ✅ Done | `memberships.ts` + `JoinPage.tsx` + `UtilizadoresPage.tsx`. **Tab Membros agora renderizada** em CondominioDetailPage (estava órfã até 2026-05-17). Roles globais; scoping por-condomínio ainda pendente (ver RF-9). |
| 9 | Document upload + categorization per condominium | ✅ Done | Upload para Supabase Storage. Categorias e tipos suportados. Rota `/condominios/:id/documentos`. |
| 10 | Document upload with AI extraction (bulk) | ✅ Done | `DocumentUploadZone` drag & drop. Edge function `analyze-document` envia base64 para Claude vision. Extrai tipo, categoria, resumo, datas, valor, entidade, alertas sugeridos. |
| 11 | Document generation from templates | ✅ Done | Template placeholder substitution + PDF export via jsPDF. Rotas `/templates` e `/gerar-documento`. |
| **Phase 3 — Asset Registration & Management** ||||
| 12 | Asset registration form per condominium | ✅ Done | `ativosApi.create()`. Empty state passa a usar `<EmptyState>` partilhado. |
| 13 | Asset inventory per condominium (with status) | ✅ Done | Status `overdue`/`soon`/`ok`. Detail page com fotos, docs, manutenções. |
| 14 | 14 asset types with preventive maintenance rules | ✅ Done | Referências legais portuguesas reais (DL 320/2002, NP 4413:2019, Portaria 1532/2008, DL 97/2017, DL 118/2013, NP EN 62305, DL 268/94, etc.). |
| **Phase 4 — Preventive & Corrective Maintenance** ||||
| 15 | Rules engine: asset type → frequency → automatic alert | 🟡 Partial | `computeNextMaintenanceDate()` calcula. `AlertsPage` mostra overdue/soon. **Falta**: scheduler/push (depende de #21). |
| 16 | Maintenance calendar per condominium | ✅ Done | Calendário mostra manutenções + ativos com `data_proxima_manutencao` futura. Eventos AGENDADA/ATRASADA. Clicar navega para detail. |
| 17 | Incident ticket creation (photo, description, severity) | ✅ Done | `OcorrenciaForm` com galeria de fotos (até 5), upload para bucket `ocorrencia-fotos`. |
| 18 | Incident photo gallery | ✅ Done | `OcorrenciaDetailPage` com thumbnails + lightbox fullscreen (setas, contador). |
| 19 | Ticket state flow | ✅ Done | reportada → triagem → em_progresso → resolvida → fechada. Auto-sets `resolved_at`. |
| 20 | Ticket history tab | ✅ Done | Tabs "Ativas" e "Histórico". Fechadas movem para Histórico. Kanban só estados ativos. Empty states unificados. |
| 21 | Automatic notifications to manager | ❌ Missing | Sem edge function de email. Sem Resend/SendGrid. |
| **Phase 5 — Financial Automation** ||||
| 22 | Monthly invoice generation engine | ❌ Missing | Zero ficheiros, zero tabelas (`faturas`, `linhas_fatura`, `pagamentos` não existem). |
| 23 | Billing statement export to PDF | ❌ Missing | |
| 24 | Automatic invoice emailing | ❌ Missing | Depende de #21 e #22. |
| 25 | Financial dashboard per condominium | ❌ Missing | Nenhuma página financeira existe. |
| **Phase 6 — AI & Reporting (novo desde rev. 2)** ||||
| 26 | Monthly executive reports per condominium | ✅ Done | `RelatoriosPage` + `RelatorioDetailPage` + `GenerateRelatorioModal`. Edge function `generate-monthly-report` redige resumo via Claude Haiku. KPIs, gráficos (pizza/barras), PDF download via jsPDF. Polling enquanto `pending`/`generating`. Migration `20260516_relatorios_mensais.sql`. |
| 27 | Conversational AI assistant | ✅ Done | `SuportePage` + edge function `chat` (Claude Haiku) com 7 tools: counts, list_buildings, list_open_ocorrencias, next_maintenance, list_expiring_assets, generate_monthly_report, request_building_pdf. Suggestion chips, typing dots, action buttons embed. |
| 28 | AI occurrence classification (Gemini) | ✅ Done | Edge function `classify-occurrence` retorna `{categoria, prioridade}` em JSON. Usado no onboarding e formulário principal. |

---

## 2. Infrastructure & Quality

| Item | Status | Notes |
|------|--------|-------|
| ErrorBoundary | ✅ Done | `ErrorBoundary.tsx` wraps root + AppLayout. Recovery UI. Dev-only error details. |
| Routing completeness | ✅ Done | Todas as rotas registadas, incluindo `/relatorios`, `/relatorios/:id`, `/join/:token`. |
| Visual redesign | ✅ Done | Sidebar (secções, glow, tooltips, online dot pulse), TopNav, Dashboard (greeting personalizado, get-started CTA, animações slide-in). |
| Shared empty states | ✅ Done (2026-05-17) | `<EmptyState>` aplicado em Condomínios, Ocorrências, Trabalhos, Técnicos, Ativos, Relatórios. |
| Shared loading skeletons | ✅ Done (2026-05-17) | `<CardListSkeleton>` + `<KpiGridSkeleton>` em Condomínios, Ocorrências, Trabalhos, Dashboard. |
| Landing page PT consistency | ✅ Done (2026-05-17) | Testimonials, DemoBookingModal, partner carousel deduplicado. |
| OG/Twitter meta | 🟡 Partial | Imagem Lovable removida. `/og-image.png` referenciado — ficheiro real a adicionar antes de partilhar URL. |
| Onboarding document upload | ✅ Done | `documentosApi.uploadCondominioDocumento()` + `documentosApi.create()`. |
| Storage policies | ✅ Done | `condominio-documents` e `ocorrencia-fotos`. |
| Invite / membership system | ✅ Done | `memberships.ts` + `invite_tokens` + `condominio_memberships` + `JoinPage` + **Membros tab agora exposta** em CondominioDetailPage. |
| RLS em tabelas core | ⚠️ Inconsistente | `users`, `condominios`, `documentos`, `memberships`, `invite_tokens` OK. `ocorrencias` agora com scope para residentes (`20260516_ocorrencias_resident_scope.sql`). `trabalhos_manutencao`, `tecnicos`, `candidaturas_trabalho`, `ativos` continuam com `USING (true)`. |
| Duplicate Supabase clients | ❌ Not fixed | `src/supabase-client.ts` continua com **credenciais hardcoded** (URL `uszdiqdlwempkjqjlvaq` — atenção: diferente da que está em `.env`!). É o ficheiro importado por todos os `src/api/*`. `src/integrations/supabase/client.ts` permanece não utilizado. |
| Chat Edge Function CORS | ❌ Not fixed | `supabase/functions/chat/index.ts:29` ainda com `Access-Control-Allow-Origin: *`. |
| ANTHROPIC_API_KEY exposure | ⚠️ Acção pendente | Removido de `.env` em 2026-05-17 (estava em plaintext). **Necessário rotar a chave no Anthropic console** e adicionar nos Supabase Edge Function secrets. |

---

## 3. O Que Falta Construir (por prioridade)

### Prioridade 1 — Notificações por email ❌ BLOQUEADOR
- Edge function de envio (Resend/SendGrid) — sem isto #21 e #24 são impossíveis
- Alertas proativos quando manutenção expira (cron Supabase)
- Notificação ao gestor quando ocorrência crítica é criada (database webhook)

### Prioridade 2 — Módulo financeiro ❌ ZERO IMPLEMENTADO
- DB tables: `faturas`, `linhas_fatura`, `pagamentos`
- Engine de geração mensal por fração
- PDF export de extracto (reutilizar jsPDF já presente)
- Envio automático por email (depende de Prioridade 1)
- Dashboard financeiro por condomínio

### Prioridade 3 — Segurança ⚠️ RISCOS ATIVOS
- **Unificar Supabase clients**: migrar todos os `src/api/*` de `@/supabase-client` para `@/integrations/supabase/client` e remover credenciais hardcoded. Atenção que os dois ficheiros apontam para projetos Supabase diferentes — confirmar qual é o correto antes de migrar.
- **RLS**: adicionar ownership em `ativos`, `trabalhos_manutencao`, `tecnicos` (ocorrências já feito em 2026-05-16).
- **CORS**: restringir `Access-Control-Allow-Origin` na chat edge function para o domínio da app.
- **Per-condominium role scoping**: actualmente roles são globais — falta associar role ao par `(user, condominio)` em `condominio_memberships`.
- **Rotar ANTHROPIC_API_KEY** (estava em plaintext em `.env`) e mover apenas para Supabase Edge Function secrets.

### Prioridade 4 — Nice-to-have
- Payment integration (Stripe) no onboarding Step 3.
- Scheduler: Supabase cron ou pg_cron para notificações de manutenção.
- Markdown rendering nos relatórios mensais (atualmente split por parágrafos plain text).
- PDF caching dos relatórios (atualmente regenera no cliente a cada download).

---

## 4. Red Flags Atualizados

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| RF-1 | ~~🔴 Runtime crash~~ | `deactivate()`/`reactivate()` não existiam | ✅ **Resolvido** |
| RF-2 | 🟠 Billing gap | Step 3 do onboarding continua simulado | Pendente (Stripe) |
| RF-3 | 🔴 API key hardcoded | `src/supabase-client.ts` contém anon key e URL hardcoded — aponta para projeto diferente do `.env` | **Pendente — risco activo** |
| RF-4 | 🟠 CORS aberto | Chat edge function com `Access-Control-Allow-Origin: *` | Pendente |
| RF-5 | ~~🟡 Compliance credibility~~ | Referências legais eram placeholder | ✅ **Resolvido** |
| RF-6 | ~~🟡 No error boundaries~~ | App crashava com tela branca | ✅ **Resolvido** |
| RF-7 | 🟠 RLS permissivo | `ativos`, `trabalhos_manutencao`, `tecnicos` usam `USING (true)` | Pendente (ocorrências já resolvido em 2026-05-16) |
| RF-8 | ~~🟡 Null safety~~ | `c.cidade.toLowerCase()` crashava com null | ✅ **Resolvido** |
| RF-9 | 🟡 Roles globais | `condominio_memberships` existe mas role não está scoped por condomínio | Pendente |
| RF-10 | ~~🟡 Lovable OG image leak~~ | `index.html` apontava para `lovable.dev/opengraph-image` | ✅ **Resolvido em 2026-05-17** — meta tags atualizadas para `/og-image.png`; ficheiro a adicionar |
| RF-11 | ~~🟡 Orphan invite UI~~ | `MembrosTab` existia mas não estava renderizada em lado nenhum | ✅ **Resolvido em 2026-05-17** — adicionada como tab em CondominioDetailPage |
| RF-12 | 🔴 Anthropic key in .env | `ANTHROPIC_API_KEY` estava em plaintext em `.env` | ⚠️ **Removido localmente em 2026-05-17 — chave precisa de ser rotada no Anthropic console** |

---

## 5. Ficheiros Existentes (estado actual)

### Páginas (`src/pages/`)
- `DashboardPage.tsx`, `CondominiosPage.tsx`, `CondominioDetailPage.tsx`
- `CondominioDocumentosPage.tsx`, `AtivosPage.tsx`, `AtivoDetailPage.tsx`
- `CalendarPage.tsx`, `AlertsPage.tsx`, `MaintenancePage.tsx`
- `OcorrenciasPage.tsx`, `OcorrenciaDetailPage.tsx`
- `TrabalhosPage.tsx`, `TrabalhoDetailPage.tsx`, `TecnicosPage.tsx`
- `TemplatesPage.tsx`, `GerarDocumentoPage.tsx`
- `UtilizadoresPage.tsx`, `JoinPage.tsx`
- **`RelatoriosPage.tsx`, `RelatorioDetailPage.tsx`** ✅ (novos — relatórios mensais)
- `ConformidadePage.tsx`, `SettingsPage.tsx`, `SuportePage.tsx`, `OnboardingPage.tsx`
- `LandingPage.tsx`, `LoginPage.tsx`, `SignupPage.tsx`

### APIs (`src/api/`)
- `ativos.ts`, `condominios.ts`, `documentos.ts`, `documentTemplates.ts`
- `memberships.ts`, `ocorrencias.ts`, `tecnicos.ts`, `trabalhos.ts`, `userProfiles.ts`
- **`relatorios.ts`** ✅ (novo)

### Edge Functions (`supabase/functions/`)
- `chat/index.ts` — IA conversacional (Claude Haiku) com 7 tools. ⚠️ CORS aberto.
- **`analyze-document/index.ts`** ✅ (novo) — Claude vision para extração de documentos
- **`classify-occurrence/index.ts`** ✅ (novo) — Gemini para categoria/prioridade
- **`generate-monthly-report/index.ts`** ✅ (novo) — Claude Haiku para narrativa dos relatórios
- ❌ Sem função de email

### Componentes partilhados (novos em 2026-05-17)
- `src/components/EmptyState.tsx`
- `src/components/skeletons/CardListSkeleton.tsx` (exporta `CardListSkeleton` + `KpiGridSkeleton`)

### SQL Migrations aplicadas
- `migration_add_is_active.sql`
- `migration_documentos_ai_fields.sql`
- `migration_ocorrencia_fotos.sql`
- `fix_storage_policies.sql`
- `20260416_condominio_memberships.sql` — invite_tokens + condominio_memberships
- `20260416_condominios_member_select.sql` — RLS para membros verem condomínios
- `20260416_condominios_rls_restore.sql` — desactiva RLS em condomínios (filtro client-side)
- **`20260516_relatorios_mensais.sql`** ✅ (novo) — tabela `relatorios_mensais` + função `compute_monthly_report_data`
- **`20260516_ocorrencias_resident_scope.sql`** ✅ (novo) — RLS de scope por residente em ocorrências
- **`20260516_users_rls_recursion_fix.sql`** ✅ (novo) — fix de recursão em policies de users
