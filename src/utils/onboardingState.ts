export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export type OnboardingDraft = {
  step2?: {
    nome?: string;
    morada?: string;
    num_fracoes?: number | null;
  };
  selectedPath?: 'ocorrencia' | 'ativo' | null;
  ocorrencia?: {
    titulo?: string;
    categoria?: string;
    prioridade?: string;
  };
  ativo?: {
    nome?: string;
    tipo_ativo?: string;
    data_expiracao?: string | null;
  };
};

export type OnboardingState = {
  userId?: string | null;
  hasAccount?: boolean;
  hasCondominio?: boolean;
  didQuickWin?: boolean;
  draft?: OnboardingDraft;
  skipped?: {
    step2?: boolean;
    step3?: boolean;
    step4?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY = 'domly:onboarding:v1';

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function sanitize(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;

  const skippedRaw = (r.skipped && typeof r.skipped === 'object' ? (r.skipped as Record<string, unknown>) : {}) ?? {};
  const draftRaw = (r.draft && typeof r.draft === 'object' ? (r.draft as Record<string, unknown>) : {}) ?? {};
  const step2Raw =
    (draftRaw.step2 && typeof draftRaw.step2 === 'object' ? (draftRaw.step2 as Record<string, unknown>) : {}) ?? {};
  const ocorrenciaRaw =
    (draftRaw.ocorrencia && typeof draftRaw.ocorrencia === 'object'
      ? (draftRaw.ocorrencia as Record<string, unknown>)
      : {}) ?? {};
  const ativoRaw =
    (draftRaw.ativo && typeof draftRaw.ativo === 'object' ? (draftRaw.ativo as Record<string, unknown>) : {}) ?? {};

  return {
    userId: typeof r.userId === 'string' || r.userId === null ? (r.userId as string | null) : undefined,
    hasAccount: typeof r.hasAccount === 'boolean' ? r.hasAccount : undefined,
    hasCondominio: typeof r.hasCondominio === 'boolean' ? r.hasCondominio : undefined,
    didQuickWin: typeof r.didQuickWin === 'boolean' ? r.didQuickWin : undefined,
    draft: {
      step2: {
        nome: typeof step2Raw.nome === 'string' ? step2Raw.nome : undefined,
        morada: typeof step2Raw.morada === 'string' ? step2Raw.morada : undefined,
        num_fracoes:
          typeof step2Raw.num_fracoes === 'number' ? step2Raw.num_fracoes : step2Raw.num_fracoes === null ? null : undefined,
      },
      selectedPath:
        draftRaw.selectedPath === 'ocorrencia' || draftRaw.selectedPath === 'ativo' || draftRaw.selectedPath === null
          ? (draftRaw.selectedPath as 'ocorrencia' | 'ativo' | null)
          : undefined,
      ocorrencia: {
        titulo: typeof ocorrenciaRaw.titulo === 'string' ? ocorrenciaRaw.titulo : undefined,
        categoria: typeof ocorrenciaRaw.categoria === 'string' ? ocorrenciaRaw.categoria : undefined,
        prioridade: typeof ocorrenciaRaw.prioridade === 'string' ? ocorrenciaRaw.prioridade : undefined,
      },
      ativo: {
        nome: typeof ativoRaw.nome === 'string' ? ativoRaw.nome : undefined,
        tipo_ativo: typeof ativoRaw.tipo_ativo === 'string' ? ativoRaw.tipo_ativo : undefined,
        data_expiracao:
          typeof ativoRaw.data_expiracao === 'string'
            ? ativoRaw.data_expiracao
            : ativoRaw.data_expiracao === null
              ? null
              : undefined,
      },
    },
    skipped: {
      step2: typeof skippedRaw.step2 === 'boolean' ? skippedRaw.step2 : undefined,
      step3: typeof skippedRaw.step3 === 'boolean' ? skippedRaw.step3 : undefined,
      step4: typeof skippedRaw.step4 === 'boolean' ? skippedRaw.step4 : undefined,
    },
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
  };
}

export function loadOnboardingState(expectedUserId?: string | null): OnboardingState {
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const state = sanitize(raw);

  if (expectedUserId && state.userId && state.userId !== expectedUserId) {
    return {};
  }

  return state;
}

export function saveOnboardingState(next: OnboardingState, expectedUserId?: string | null) {
  const prev = loadOnboardingState(expectedUserId);
  const merged: OnboardingState = {
    ...prev,
    ...next,
    userId: expectedUserId ?? next.userId ?? prev.userId ?? null,
    skipped: { ...(prev.skipped ?? {}), ...(next.skipped ?? {}) },
    draft: {
      ...(prev.draft ?? {}),
      ...(next.draft ?? {}),
      step2: { ...(prev.draft?.step2 ?? {}), ...(next.draft?.step2 ?? {}) },
      ocorrencia: { ...(prev.draft?.ocorrencia ?? {}), ...(next.draft?.ocorrencia ?? {}) },
      ativo: { ...(prev.draft?.ativo ?? {}), ...(next.draft?.ativo ?? {}) },
    },
    createdAt: prev.createdAt ?? next.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function patchOnboardingState(patch: Partial<OnboardingState>, expectedUserId?: string | null) {
  saveOnboardingState(patch, expectedUserId);
}

export function markSkipped(step: 2 | 3 | 4, expectedUserId?: string | null) {
  const skipped: NonNullable<OnboardingState['skipped']> = {};
  if (step === 2) skipped.step2 = true;
  if (step === 3) skipped.step3 = true;
  if (step === 4) skipped.step4 = true;
  patchOnboardingState({ skipped }, expectedUserId);
}

export function resetOnboardingState() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function patchOnboardingDraft(patch: Partial<OnboardingDraft>, expectedUserId?: string | null) {
  patchOnboardingState({ draft: patch }, expectedUserId);
}

