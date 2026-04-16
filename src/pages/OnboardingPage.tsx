import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classifyOccurrence from '@/lib/classifyOccurrence';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabase-client';
import { useAuth } from '@/context/AuthContext';
import { ocorrenciasApi } from '@/api/ocorrencias';
import { tecnicosApi, type Tecnico } from '@/api/tecnicos';
import { getExpiryStatus } from '@/api/ativos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Star, CheckCircle2, Loader2, Building2, ChevronRight, Check, Eye, EyeOff, MapPin, FileUp, Sparkles, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type QuickWinPath = 'ocorrencia' | 'documento';

type StepData = {
  condominioId: number | null;
  condominioNome: string;
  quickWinPath: QuickWinPath | null;
  createdItemId: number | null;
  createdItemData: any;
};

const categoriaLabels: Record<string, string> = {
  estrutural: 'Estrutural',
  'canalização': 'Canalização',
  eletricidade: 'Eletricidade',
  elevador: 'Elevador',
  zona_comum: 'Zona Comum',
  seguranca_incendio: 'Seg. Incêndio',
  outro: 'Outro',
};

const tipoAtivoLabels: Record<string, string> = {
  extintor: 'Extintor',
  sadi: 'SADI',
  sadc: 'SADC',
  inspecao_gas: 'Inspeção de Gás',
  painel_solar: 'Painel Solar',
  seguro: 'Seguro',
  licenca_elevador: 'Licença de Elevador',
  outro: 'Outro',
};

const stepLabels = ['Plano', 'Conta', 'Pagamento', 'Propriedade', 'Ação', 'Resultado'];

const DRAFT_KEY = 'domly_onboarding_draft';

type OnboardingDraft = {
  step: number;
  plano: string;
  step1: Omit<Step1Form, 'password'> | null;
  step2: Step2Form | null;
  ocorrencia: OcorrenciaForm | null;
  selectedPath: QuickWinPath | null;
};

const step1Schema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
});

const tipoPropriedadeOptions = [
  { value: 'predio', label: 'Prédio / Condomínio' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'comercial', label: 'Comercial / Escritórios' },
  { value: 'garagem', label: 'Garagem / Parqueamento' },
] as const;

type TipoPropriedade = (typeof tipoPropriedadeOptions)[number]['value'];

const step2Schema = z.object({
  tipo_propriedade: z.enum(['predio', 'moradia', 'comercial', 'garagem'], {
    required_error: 'Selecione o tipo de propriedade',
  }),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  codigo_postal: z.string().regex(/^\d{4}-\d{3}$/, 'Formato inválido (XXXX-XXX)'),
  morada: z.string().min(3, 'Morada é obrigatória'),
  num_fracoes: z.coerce.number().int().min(1, 'Deve ter pelo menos 1 unidade'),
});

const ocorrenciaSchema = z.object({
  titulo: z.string().min(2, 'Título é obrigatório'),
  categoria: z.enum(['estrutural', 'canalização', 'eletricidade', 'elevador', 'zona_comum', 'seguranca_incendio', 'outro']),
  prioridade: z.enum(['critica', 'alta', 'media', 'baixa']),
});

const ativoSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  tipo_ativo: z.enum(['extintor', 'sadi', 'sadc', 'inspecao_gas', 'painel_solar', 'seguro', 'licenca_elevador', 'outro']),
  data_expiracao: z.string().optional(),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type OcorrenciaForm = z.infer<typeof ocorrenciaSchema>;
type AtivoForm = z.infer<typeof ativoSchema>;

const ProgressBar: React.FC<{ step: number; onStepClick: (s: number) => void; hasPreSelectedPlan: boolean }> = ({ step, onStepClick, hasPreSelectedPlan }) => {
  // Ajustamos os labels e a contagem se o plano já veio pré-selecionado (saltamos o label "Plano")
  const displayLabels = hasPreSelectedPlan ? stepLabels.slice(1) : stepLabels;
  const displayStep = hasPreSelectedPlan ? step - 1 : step;
  
  const total = displayLabels.length;
  const progressPct = ((Math.min(displayStep, total) - 1) / (total - 1)) * 100;

  return (
    <div className="relative flex items-start justify-between mb-8 hidden md:flex">
      <div className="absolute left-[18px] right-[18px] top-[18px] -translate-y-1/2 h-[2px] bg-white/20 z-0">
        <div
          className="h-full bg-blue-400 transition-all duration-700 ease-in-out"
          style={{ width: `${Math.max(0, progressPct)}%` }}
        />
      </div>

      {displayLabels.map((label, i) => {
        const visualStepNum = i + 1;
        const actualStepNum = hasPreSelectedPlan ? visualStepNum + 1 : visualStepNum;
        
        const isActive = visualStepNum === displayStep;
        const isCompleted = visualStepNum < displayStep;

        const circleNode = (
          <div className="relative w-9 h-9 flex items-center justify-center">
            {isActive && (
              <div className="absolute inset-0 rounded-full bg-blue-500/25 scale-[1.45] transition-opacity duration-300" />
            )}
            <div
              className={`absolute inset-0 rounded-full transition-colors duration-300 delay-[400ms] ${isCompleted
                  ? 'bg-green-500'
                  : isActive
                    ? 'bg-blue-500'
                    : 'bg-[#1B2A4A] ring-2 ring-white/15'
                }`}
            />
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-400/40"
                animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center text-sm font-semibold">
              {isCompleted ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <span className={isActive ? 'text-white' : 'text-white/30'}>{visualStepNum}</span>
              )}
            </span>
          </div>
        );

        return (
          <div key={actualStepNum} className="relative z-10 flex flex-col items-center flex-1">
            {isCompleted ? (
              <button
                onClick={() => onStepClick(actualStepNum)}
                className="transition-transform duration-200 hover:scale-110 cursor-pointer focus:outline-none"
                aria-label={`Voltar ao passo ${visualStepNum}: ${label}`}
              >
                {circleNode}
              </button>
            ) : (
              <div className={isActive ? '' : 'pointer-events-none'}>
                {circleNode}
              </div>
            )}
            <span
              className={`text-xs mt-1.5 hidden sm:block transition-colors duration-300 delay-[400ms] ${isCompleted
                  ? 'text-green-400 font-medium'
                  : isActive
                    ? 'text-blue-400 font-medium'
                    : 'text-white/40'
                }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Lê o plano do URL (ex: ?plan=starter, ?plan=growth, ?plan=pro)
  const urlParams = new URLSearchParams(window.location.search);
  const planFromUrl = urlParams.get('plan');
  
  const [hasPreSelectedPlan] = useState(!!planFromUrl);

  // Se tem plano no URL, começa no Passo 2 (Conta). Senão, começa no Passo 1 (Escolher Plano)
  const [step, setStep] = useState(hasPreSelectedPlan ? 2 : 1);
  
  const [formData, setFormData] = useState({
    plano: planFromUrl || '',
    step1: null as Step1Form | null,
    step2: null as Step2Form | null,
    ocorrencia: null as OcorrenciaForm | null,
    documento: null as File | null,
  });

  const [emailSent, setEmailSent] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const [stepData, setStepData] = useState<StepData>({
    condominioId: null,
    condominioNome: '',
    quickWinPath: null,
    createdItemId: null,
    createdItemData: null,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifySuccess, setClassifySuccess] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<QuickWinPath | null>(null);
  const [suggestedTecnicos, setSuggestedTecnicos] = useState<Tecnico[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const step1Form = useForm<Step1Form>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Form>({ resolver: zodResolver(step2Schema) });
  const ocorrenciaForm = useForm<OcorrenciaForm>({ resolver: zodResolver(ocorrenciaSchema) });

  const tipoPropriedade = step2Form.watch('tipo_propriedade');
  const isMoradia = tipoPropriedade === 'moradia';
  const watchedCategoria = ocorrenciaForm.watch('categoria');
  const watchedPrioridade = ocorrenciaForm.watch('prioridade');
  const watchedTitulo = ocorrenciaForm.watch('titulo');

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: OnboardingDraft = JSON.parse(raw);
      const savedStep = draft.step ?? 1;
      if (savedStep < 2) return;

      if (draft.plano && !planFromUrl) {
        setFormData(prev => ({ ...prev, plano: draft.plano }));
      }
      if (draft.step1) {
        const noPassword = { nome_completo: draft.step1.nome_completo, empresa: draft.step1.empresa, email: draft.step1.email };
        step1Form.reset({ ...noPassword, password: '' });
        setFormData(prev => ({ ...prev, step1: { ...noPassword, password: '' } }));
      }
      if (draft.step2) {
        step2Form.reset(draft.step2);
        setFormData(prev => ({ ...prev, step2: draft.step2 }));
        setStepData(prev => ({ ...prev, condominioNome: draft.step2!.nome }));
      }
      if (draft.ocorrencia) {
        ocorrenciaForm.reset(draft.ocorrencia);
        setFormData(prev => ({ ...prev, ocorrencia: draft.ocorrencia }));
      }
      if (draft.selectedPath) setSelectedPath(draft.selectedPath);

      if (savedStep >= 3) {
        setStep(Math.min(savedStep, 6));
        setDraftRestored(true);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft on every meaningful change
  useEffect(() => {
    if (step < 2 || step >= 7) return;
    const draft: OnboardingDraft = {
      step,
      plano: formData.plano,
      step1: formData.step1
        ? { nome_completo: formData.step1.nome_completo, empresa: formData.step1.empresa, email: formData.step1.email }
        : null,
      step2: formData.step2,
      ocorrencia: formData.ocorrencia,
      selectedPath,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [step, formData, selectedPath]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const isOAuthCallback = hash.includes('access_token') || params.has('code');
    if (user && step <= 2 && isOAuthCallback) {
      ensureProfileExists(user);
      setStep(3); // Vai para o Pagamento
    }
  }, [user]);

  const ensureProfileExists = async (u: any) => {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id_user')
        .eq('id_user', u.id)
        .single();
      if (!existing) {
        await supabase.from('users').insert({
          id_user: u.id,
          primeiro_nome: u.user_metadata?.primeiro_nome || u.email?.split('@')[0] || '',
          ultimo_nome: u.user_metadata?.ultimo_nome || '',
          empresa: u.user_metadata?.empresa || '',
          plano: formData.plano || 'starter'
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding' + (hasPreSelectedPlan ? `?plan=${formData.plano}` : ''),
      },
    });
    if (error) {
      step1Form.setError('email', { message: error.message || 'Erro ao iniciar sessão com Google' });
    }
  };

  const handlePlanSelection = (plano: string) => {
    setFormData(prev => ({ ...prev, plano }));
    setStep(2); 
  };

  const handleStep1Submit = async (data: Step1Form) => {
    if (user) {
      await ensureProfileExists(user);
      setStep(3);
      return;
    }
    setFormData(prev => ({ ...prev, step1: data }));
    setStep(3);
  };

  const handlePaymentSimulationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handleStep2Submit = async (data: Step2Form) => {
    setFormData(prev => ({ ...prev, step2: data }));
    setStepData(prev => ({ ...prev, condominioNome: data.nome }));
    setStep(5);
  };

  const handlePathSelect = (path: QuickWinPath) => {
    setSelectedPath(path);
  };

  const handleOcorrenciaSubmit = async (data: OcorrenciaForm) => {
    setFormData(prev => ({ ...prev, ocorrencia: data }));
    setStepData(prev => ({ ...prev, quickWinPath: 'ocorrencia' }));
    
    setLoadingTecnicos(true);
    try {
      const tecnicos = await tecnicosApi.getAll();
      const available = tecnicos.filter(t => t.estado_disponibilidade === 'disponivel').slice(0, 3);
      setSuggestedTecnicos(available);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTecnicos(false);
    }
    setStep(6);
  };

  const handleDocumentoSubmit = () => {
    setFormData(prev => ({ ...prev, documento: uploadedFile }));
    setStepData(prev => ({
      ...prev,
      quickWinPath: 'documento',
      createdItemData: uploadedFile ? { nome: uploadedFile.name } : null,
    }));
    setStep(6);
  };

  const normaliseCategoria = (raw: string): string | undefined => {
    const map: Record<string, string> = {
      'estrutural': 'estrutural',
      'canalizacao': 'canalização',
      'canalização': 'canalização',
      'eletricidade': 'eletricidade',
      'electricidade': 'eletricidade',
      'elevador': 'elevador',
      'zona comum': 'zona_comum',
      'zona_comum': 'zona_comum',
      'seg. incendio': 'seguranca_incendio',
      'seg. incêndio': 'seguranca_incendio',
      'seguranca incendio': 'seguranca_incendio',
      'segurança incêndio': 'seguranca_incendio',
      'seguranca_incendio': 'seguranca_incendio',
      'outro': 'outro',
    };
    return map[raw.toLowerCase().trim()];
  };

  const normalisePrioridade = (raw: string): string | undefined => {
    const map: Record<string, string> = {
      'critica': 'critica',
      'crítica': 'critica',
      'alta': 'alta',
      'media': 'media',
      'média': 'media',
      'baixa': 'baixa',
    };
    return map[raw.toLowerCase().trim()];
  };

  const handleClassifyClick = async () => {
    const titulo = watchedTitulo?.trim() ?? '';
    if (titulo.length < 5) return;
    setIsClassifying(true);
    setClassifySuccess(false);
    setClassifyError(null);
    try {
      const result = await classifyOccurrence(titulo);
      const cat = normaliseCategoria(result.categoria);
      const pri = normalisePrioridade(result.prioridade);

      if (!cat || !pri) {
        throw new Error(`Gemini devolveu valores inesperados — categoria: "${result.categoria}", prioridade: "${result.prioridade}"`);
      }

      ocorrenciaForm.setValue('categoria', cat as any, { shouldValidate: true });
      ocorrenciaForm.setValue('prioridade', pri as any, { shouldValidate: true });
      setClassifySuccess(true);
    } catch (err: any) {
      const raw = err?.message ?? String(err);
      const msg = raw.includes('429') || raw.includes('quota')
        ? 'Limite da API atingido. Tente novamente em breve.'
        : 'Não foi possível classificar. Preencha manualmente.';
      setClassifyError(msg);
    } finally {
      setIsClassifying(false);
    }
  };

  const finalizarOnboarding = async () => {
    setStep(7);

    try {
      let currentUserId = user?.id;

      if (!currentUserId && formData.step1) {
        const nameParts = formData.step1.nome_completo.trim().split(' ');
        const primeiro_nome = nameParts[0];
        const ultimo_nome = nameParts.slice(1).join(' ');

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: formData.step1.email,
          password: formData.step1.password,
          options: {
            data: { primeiro_nome, ultimo_nome, empresa: formData.step1.empresa ?? '' },
          },
        });
        
        if (error) throw error;
        
        if (!signUpData.session) {
          setSavedEmail(formData.step1.email);
          setEmailSent(true);
          setStep(2); 
          return; 
        }
        
        currentUserId = signUpData.user?.id;
        
        if (currentUserId) {
          await supabase.from('users').insert({
            id_user: currentUserId,
            primeiro_nome,
            ultimo_nome,
            empresa: formData.step1.empresa,
            plano: formData.plano || 'starter'
          });
        }
      }

      let newCondominioId = null;
      if (currentUserId && formData.step2) {
        const { data: condResult, error: condError } = await supabase
          .from('condominios')
          .insert([{
            nome: formData.step2.nome,
            morada: formData.step2.morada,
            num_fracoes: formData.step2.num_fracoes,
            codigo_postal: formData.step2.codigo_postal,
            id_user: currentUserId,
          }])
          .select()
          .single();

        if (condError) throw condError;
        newCondominioId = condResult.id_comdominio;
      }

      if (newCondominioId && formData.ocorrencia) {
        await ocorrenciasApi.create({
          titulo: formData.ocorrencia.titulo,
          categoria: formData.ocorrencia.categoria,
          prioridade: formData.ocorrencia.prioridade,
          id_condominio: newCondominioId,
          responsabilidade: 'condominio',
        });
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate('/dashboard?onboarding=1');

    } catch (error: any) {
      console.error("Erro no submit master:", error);
      alert("Ocorreu um erro a finalizar o registo: " + error.message);
      setStep(6); 
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftRestored(false);
    setStep(hasPreSelectedPlan ? 2 : 1);
    setFormData({ plano: planFromUrl || '', step1: null, step2: null, ocorrencia: null, documento: null });
    setSelectedPath(null);
    step1Form.reset();
    step2Form.reset();
    ocorrenciaForm.reset();
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'growth': return '99€';
      case 'pro': return '299€';
      default: return '39€';
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 animate-gradient-shift"
      style={{
        background: "linear-gradient(-45deg, #0a1128, #1B2A4A, #1a4a7a, #0d6b7a)",
        backgroundSize: "400% 400%",
      }}
    >
      <div className="w-full max-w-lg">
        {step < 7 && <ProgressBar step={step} onStepClick={setStep} hasPreSelectedPlan={hasPreSelectedPlan} />}

        {draftRestored && step < 7 && (
          <div className="mb-4 flex items-center justify-between text-xs text-white/70 bg-white/5 rounded-lg px-4 py-2.5 border border-white/10">
            <span>Sessão anterior restaurada · Os seus dados foram guardados</span>
            <button
              onClick={handleClearDraft}
              className="underline underline-offset-2 hover:text-white transition-colors ml-4 flex-shrink-0"
            >
              Recomeçar
            </button>
          </div>
        )}

        <div key={step} className="animate-slide-in-left">

          {/* PASSO 1 — Escolher Plano (Só aparece se NÃO houver plano no URL) */}
          {step === 1 && !hasPreSelectedPlan && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold mb-1">Escolha o seu plano</h2>
                <p className="text-muted-foreground text-sm">
                  Selecione o plano que melhor se adapta às suas necessidades.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handlePlanSelection('starter')}
                  className="p-5 border-2 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
                >
                  <div className="w-full flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Starter</h3>
                      <p className="text-xs text-muted-foreground">Para pequenos condomínios autogeridos</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xl">€39</span>
                      <span className="text-xs text-muted-foreground font-medium">/mês</span>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> 1 condomínio (até 10 frações)</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Gestão de Documentos</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> OCR via IA</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Dashboard Básico</li>
                  </ul>
                </button>

                <button
                  onClick={() => handlePlanSelection('growth')}
                  className="p-5 border-2 border-blue-500 bg-blue-500 text-white rounded-xl text-left hover:bg-blue-600 transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-1/2 translate-x-1/2 bg-black text-white text-[10px] font-bold px-3 py-0.5 rounded-b-md">
                    Mais Popular
                  </div>
                  <div className="w-full flex justify-between items-start mt-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Growth</h3>
                      <p className="text-xs text-blue-100">Para portfólios em crescimento</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xl">€99</span>
                      <span className="text-xs text-blue-200 font-medium">/mês</span>
                    </div>
                  </div>
                  <ul className="text-xs text-blue-50 space-y-1.5 mt-2">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-white" /> Até 3 condomínios (até 50 frações)</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-white" /> Gestão de Documentos Avançada</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-white" /> Dashboard Financeiro</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-white" /> App Mobile para Residentes</li>
                  </ul>
                </button>

                <button
                  onClick={() => handlePlanSelection('pro')}
                  className="p-5 border-2 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-full flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Pro</h3>
                      <p className="text-xs text-muted-foreground">Para gestores profissionais</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xl">€299</span>
                      <span className="text-xs text-muted-foreground font-medium">/mês</span>
                    </div>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Até 10 condomínios (até 250 frações)</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Todas as funcionalidades Growth</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Integrações Personalizadas</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-blue-500" /> Planeamento Financeiro Preditivo</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2 — Signup da Conta */}
          {step === 2 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              {emailSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Confirme o seu email</h2>
                  <p className="text-muted-foreground mb-4">
                    Enviámos um email de confirmação para <strong>{savedEmail}</strong>. Clique no link no email para ativar a sua conta.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">Verifique também a pasta de spam.</p>
                  <p className="text-sm font-medium">
                    Após confirmar, entre na sua conta em{' '}
                    <a href="/login" className="text-primary underline underline-offset-2">
                      /login
                    </a>{' '}
                    com o seu email e password.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">Crie a sua conta</h2>
                    {formData.plano && (
                      <Badge variant="secondary" className="mt-2 text-xs uppercase bg-blue-100 text-blue-800">
                        Plano: {formData.plano}
                      </Badge>
                    )}
                  </div>
                  <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                    <div>
                      <Label htmlFor="nome_completo">Nome Completo</Label>
                      <Input
                        id="nome_completo"
                        placeholder="João Silva"
                        {...step1Form.register('nome_completo')}
                      />
                      {step1Form.formState.errors.nome_completo && (
                        <p className="text-sm text-destructive mt-1">
                          {step1Form.formState.errors.nome_completo.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="empresa">Empresa</Label>
                      <Input
                        id="empresa"
                        placeholder="Gestão Lda"
                        {...step1Form.register('empresa')}
                      />
                      {step1Form.formState.errors.empresa && (
                        <p className="text-sm text-destructive mt-1">
                          {step1Form.formState.errors.empresa.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@empresa.pt"
                        {...step1Form.register('email')}
                      />
                      {step1Form.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {step1Form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          className="pr-10"
                          {...step1Form.register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {step1Form.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {step1Form.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={submitting}>
                      Continuar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </form>

                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-3"
                    onClick={handleGoogleSignIn}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar com Google
                  </Button>
                </>
              )}
            </div>
          )}

          {/* PASSO 3 — Pagamento */}
          {step === 3 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Pagamento</h2>
                <p className="text-muted-foreground text-sm">
                  Configuração de faturação para a sua subscrição.
                </p>
              </div>

              <form onSubmit={handlePaymentSimulationSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Plano {formData.plano.charAt(0).toUpperCase() + formData.plano.slice(1)}
                    </p>
                    <p className="text-xs text-blue-700/80">Faturação Mensal</p>
                  </div>
                  <p className="font-bold text-xl text-blue-700">
                    {getPlanPrice(formData.plano)}
                  </p>
                </div>

                <div>
                  <Label>Nome no Cartão</Label>
                  <Input placeholder="Ex: João Miguel Silva" required />
                </div>
                <div>
                  <Label>Número do Cartão</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="0000 0000 0000 0000" maxLength={19} className="pl-9" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Validade</Label>
                    <Input placeholder="MM/AA" maxLength={5} required />
                  </div>
                  <div>
                    <Label>CVC</Label>
                    <Input placeholder="123" maxLength={3} type="password" required />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4">
                  Confirmar Pagamento <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </div>
          )}

          {/* PASSO 4 — Condomínio */}
          {step === 4 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Adicione a sua primeira propriedade</h2>
                <p className="text-muted-foreground text-sm">
                  Vamos adicionar a sua primeira propriedade ao sistema.
                </p>
              </div>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                <div>
                  <Label htmlFor="nome_edificio">Nome da Propriedade</Label>
                  <Input
                    id="nome_edificio"
                    placeholder="Condomínio Central"
                    {...step2Form.register('nome')}
                  />
                  {step2Form.formState.errors.nome && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tipo_propriedade">Tipo de Propriedade</Label>
                  <Select
                    value={tipoPropriedade || ''}
                    onValueChange={(v) => {
                      step2Form.setValue('tipo_propriedade', v as TipoPropriedade, { shouldValidate: true });
                      if (v === 'moradia') step2Form.setValue('num_fracoes', 1);
                    }}
                  >
                    <SelectTrigger id="tipo_propriedade">
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoPropriedadeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {step2Form.formState.errors.tipo_propriedade && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.tipo_propriedade.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    placeholder="1000-001"
                    maxLength={8}
                    {...step2Form.register('codigo_postal')}
                  />
                  {step2Form.formState.errors.codigo_postal && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.codigo_postal.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="morada">Morada</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="morada"
                      className="pl-9"
                      placeholder="Rua das Flores, 123, Lisboa"
                      {...step2Form.register('morada')}
                    />
                  </div>
                  {step2Form.formState.errors.morada && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.morada.message}
                    </p>
                  )}
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${isMoradia ? 'opacity-0 max-h-0 pointer-events-none' : 'opacity-100 max-h-40'}`}>
                  <Label htmlFor="num_fracoes">Total de Unidades</Label>
                  <Input
                    id="num_fracoes"
                    type="number"
                    min="1"
                    placeholder="12"
                    {...step2Form.register('num_fracoes')}
                  />
                  {step2Form.formState.errors.num_fracoes && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.num_fracoes.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Adicionar Propriedade
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, step2: null }));
                    finalizarOnboarding(); // Salta tudo e vai gravar
                  }}
                  className="w-full mt-2 text-muted-foreground hover:text-foreground"
                >
                  Agora não, seguir em frente
                </Button>
              </form>
            </div>
          )}

          {/* PASSO 5 — Acão Rápida */}
          {step === 5 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6">
                {stepData.condominioNome && (
                  <div className="inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                    <Building2 className="h-3.5 w-3.5" />
                    {stepData.condominioNome}
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-1">
                  Qual é a sua prioridade para esta propriedade?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Escolha por onde quer começar. Pode configurar o resto mais tarde.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <button
                  type="button"
                  onClick={() => handlePathSelect('ocorrencia')}
                  className={`p-6 border-2 rounded-xl text-left transition-all group ${selectedPath === 'ocorrencia'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-border hover:border-blue-400 hover:bg-blue-50/50 hover:ring-2 hover:ring-blue-400'
                    }`}
                >
                  <ClipboardList className={`h-8 w-8 mb-3 transition-transform group-hover:scale-110 ${selectedPath === 'ocorrencia' ? 'text-blue-600' : 'text-primary'}`} />
                  <p className="font-semibold text-sm">Registar uma ocorrência</p>
                  <p className="text-xs text-muted-foreground mt-1">Avarias, reparações ou reclamações pendentes.</p>
                </button>
                <button
                  type="button"
                  onClick={() => handlePathSelect('documento')}
                  className={`p-6 border-2 rounded-xl text-left transition-all group ${selectedPath === 'documento'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-border hover:border-blue-400 hover:bg-blue-50/50 hover:ring-2 hover:ring-blue-400'
                    }`}
                >
                  <FileUp className={`h-8 w-8 mb-3 transition-transform group-hover:scale-110 ${selectedPath === 'documento' ? 'text-blue-600' : 'text-primary'}`} />
                  <p className="font-semibold text-sm">Importar um documento</p>
                  <p className="text-xs text-muted-foreground mt-1">Seguro, inspeção ou contrato — extraímos os prazos automaticamente.</p>
                </button>
              </div>

              {!selectedPath && (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => finalizarOnboarding()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Agora não, seguir em frente
                  </Button>
                </div>
              )}

              {/* Ocorrência mini-form */}
              <AnimatePresence>
                {selectedPath === 'ocorrencia' && (
                  <motion.form
                    key="ocorrencia-form"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onSubmit={ocorrenciaForm.handleSubmit(handleOcorrenciaSubmit)}
                    className="space-y-4 border-t pt-4 mt-4"
                  >
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-600" /> Nova Ocorrência
                    </p>

                    <div>
                      <Label htmlFor="oc_titulo">Nome da Ocorrência</Label>
                      <Input
                        id="oc_titulo"
                        placeholder="Ex: Infiltração no tecto da fração 101"
                        {...ocorrenciaForm.register('titulo')}
                        onChange={(e) => {
                          ocorrenciaForm.register('titulo').onChange(e);
                          setClassifySuccess(false);
                          setClassifyError(null);
                        }}
                      />
                      {ocorrenciaForm.formState.errors.titulo && (
                        <p className="text-sm text-destructive mt-1">
                          {ocorrenciaForm.formState.errors.titulo.message}
                        </p>
                      )}

                      <AnimatePresence>
                        {(watchedTitulo?.trim().length ?? 0) >= 5 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="mt-2 flex flex-col gap-1"
                          >
                            <button
                              type="button"
                              onClick={handleClassifyClick}
                              disabled={isClassifying}
                              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-400 text-blue-600 text-xs font-medium bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              {isClassifying ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  A classificar...
                                </>
                              ) : (
                                <>✦ Classificar com IA</>
                              )}
                            </button>
                            {classifySuccess && (
                              <p className="flex items-center gap-1 text-xs text-green-600">
                                <Check className="h-3.5 w-3.5" />
                                Campos preenchidos automaticamente
                              </p>
                            )}
                            {classifyError && (
                              <p className="text-xs text-destructive">
                                Erro: {classifyError}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={watchedCategoria}
                        onValueChange={(v) => ocorrenciaForm.setValue('categoria', v as any, { shouldValidate: true })}
                        disabled={isClassifying}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoriaLabels).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {ocorrenciaForm.formState.errors.categoria && (
                        <p className="text-sm text-destructive mt-1">
                          {ocorrenciaForm.formState.errors.categoria.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Prioridade</Label>
                      <Select
                        value={watchedPrioridade}
                        onValueChange={(v) => ocorrenciaForm.setValue('prioridade', v as any, { shouldValidate: true })}
                        disabled={isClassifying}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critica">Crítica</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                      {ocorrenciaForm.formState.errors.prioridade && (
                        <p className="text-sm text-destructive mt-1">
                          {ocorrenciaForm.formState.errors.prioridade.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedPath(null)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button type="submit" className="flex-1">
                        Continuar
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Documento upload mini-form */}
              {selectedPath === 'documento' && (
                <div className="space-y-4 border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-blue-600" /> Importar Documento
                  </p>

                  <label
                    htmlFor="doc_upload"
                    className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${uploadedFile
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-border hover:border-blue-400 hover:bg-blue-50/40'
                      }`}
                  >
                    <FileUp className={`h-8 w-8 ${uploadedFile ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    {uploadedFile ? (
                      <p className="text-sm font-medium text-blue-700 text-center">{uploadedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Clique para selecionar ou arraste o ficheiro</p>
                        <p className="text-xs text-muted-foreground">PDF, JPG ou PNG · máx. 10 MB</p>
                      </>
                    )}
                    <input
                      id="doc_upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                    />
                  </label>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setSelectedPath(null); setUploadedFile(null); }}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleDocumentoSubmit}
                      className="flex-1"
                      disabled={!uploadedFile}
                    >
                      Importar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 6 — Resultado (Sugestões de Técnicos ou Info de Documento) */}
          {step === 6 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              {stepData.quickWinPath === 'ocorrencia' && (
                <>
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Ocorrência pronta a gravar!</h2>
                    <p className="text-muted-foreground text-sm">
                      Sugerimos os seguintes técnicos para a sua ocorrência:
                    </p>
                  </div>

                  {loadingTecnicos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : suggestedTecnicos.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {suggestedTecnicos.map((t) => (
                        <div
                          key={t.id_tecnico}
                          className="p-4 border rounded-xl bg-muted/20 flex items-start justify-between gap-4"
                        >
                          <div>
                            <p className="font-semibold text-sm">{t.nome}</p>
                            {t.zona && (
                              <p className="text-xs text-muted-foreground">{t.zona}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {t.especialidades?.map((esp) => (
                                <Badge key={esp} variant="secondary" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {t.avaliacao_media.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-xl mb-6 text-sm text-muted-foreground">
                      Adicione técnicos na secção <strong>Técnicos</strong> para ver sugestões aqui.
                    </div>
                  )}
                </>
              )}

              {stepData.quickWinPath === 'documento' && (
                <div className="mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <FileUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Documento recebido!</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Iremos analisar o ficheiro e extrair os prazos automaticamente assim que concluir a configuração.
                  </p>
                  {stepData.createdItemData?.nome && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                      <FileUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-blue-800 truncate">{stepData.createdItemData.nome}</span>
                    </div>
                  )}
                </div>
              )}

              {/* AQUI ACIONAMOS A GRAVAÇÃO FINAL DE TUDO */}
              <Button onClick={() => finalizarOnboarding()} className="w-full mt-2 text-lg h-12">
                Concluir e ir para o Dashboard →
              </Button>
            </div>
          )}

          {/* PASSO 7 — Loading Final (Gravar na BD) */}
          {step === 7 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">A configurar o seu espaço...</h2>
              <p className="text-muted-foreground text-sm">Estamos a guardar os seus dados. Só um momento!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};