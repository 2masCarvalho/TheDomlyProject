import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ClipboardList, Package, Star, CheckCircle2, Loader2, Building2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type QuickWinPath = 'ocorrencia' | 'ativo';

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

const stepLabels = ['Conta', 'Edifício', 'Ação', 'Resultado', 'Dashboard'];

const step1Schema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  email: z.string().email('Email inválido'),
});

const step2Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  morada: z.string().min(3, 'Morada é obrigatória'),
  num_fracoes: z.coerce.number().int().min(1, 'Deve ter pelo menos 1 fração'),
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

const ProgressBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {stepLabels.map((label, i) => {
      const stepNum = i + 1;
      const isActive = stepNum === step;
      const isCompleted = stepNum < step;
      return (
        <React.Fragment key={stepNum}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
            <span
              className={`text-xs mt-1 hidden sm:block ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>
          {i < stepLabels.length - 1 && (
            <div className={`h-0.5 flex-1 max-w-16 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const AtivoCard: React.FC<{ ativo: any }> = ({ ativo }) => {
  const status = getExpiryStatus(ativo.data_expiracao);
  const borderClass =
    status === 'overdue'
      ? 'border-red-400'
      : status === 'soon'
      ? 'border-orange-400'
      : 'border-green-400';
  const badgeClass =
    status === 'overdue'
      ? 'bg-red-100 text-red-700'
      : status === 'soon'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-green-100 text-green-700';
  const badgeLabel = status === 'overdue' ? 'Expirado' : status === 'soon' ? 'Em breve' : 'OK';

  return (
    <div className={`p-4 border-2 rounded-xl mb-4 ${borderClass} bg-white`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{ativo.nome}</p>
          {ativo.tipo_ativo && (
            <Badge variant="secondary" className="text-xs mt-1">
              {tipoAtivoLabels[ativo.tipo_ativo] || ativo.tipo_ativo}
            </Badge>
          )}
          {ativo.data_expiracao && (
            <p className="text-xs text-muted-foreground mt-1">
              Expira em: {format(new Date(ativo.data_expiracao), 'dd MMM yyyy', { locale: pt })}
            </p>
          )}
        </div>
        {status && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
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
  const [selectedPath, setSelectedPath] = useState<QuickWinPath | null>(null);
  const [suggestedTecnicos, setSuggestedTecnicos] = useState<Tecnico[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);

  const step1Form = useForm<Step1Form>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Form>({ resolver: zodResolver(step2Schema) });
  const ocorrenciaForm = useForm<OcorrenciaForm>({ resolver: zodResolver(ocorrenciaSchema) });
  const ativoForm = useForm<AtivoForm>({ resolver: zodResolver(ativoSchema) });

  // Auto-detect authenticated user → skip to step 2
  useEffect(() => {
    if (user && step === 1) {
      ensureProfileExists(user);
      setStep(2);
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
          ultimo_nome: '',
          empresa: u.user_metadata?.empresa || '',
        });
      }
    } catch {
      // Ignore — profile may already exist
    }
  };

  const handleStep1Submit = async (data: Step1Form) => {
    setSubmitting(true);
    try {
      const nameParts = data.nome_completo.trim().split(' ');
      const primeiro_nome = nameParts[0];
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          data: { primeiro_nome, empresa: data.empresa },
          emailRedirectTo: window.location.origin + '/onboarding',
        },
      });
      if (error) throw error;
      setSavedEmail(data.email);
      setEmailSent(true);
    } catch (err: any) {
      step1Form.setError('email', { message: err.message || 'Erro ao enviar email' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Submit = async (data: Step2Form) => {
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const { data: result, error } = await supabase
        .from('condominios')
        .insert([{
          nome: data.nome,
          morada: data.morada,
          num_fracoes: data.num_fracoes,
          cidade: '',
          codigo_postal: '',
          id_user: userId,
        }])
        .select()
        .single();
      if (error) throw error;
      setStepData(prev => ({
        ...prev,
        condominioId: result.id_comdominio,
        condominioNome: result.nome,
      }));
      setStep(3);
    } catch (err: any) {
      step2Form.setError('nome', { message: err.message || 'Erro ao criar edifício' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePathSelect = (path: QuickWinPath) => {
    setSelectedPath(path);
  };

  const handleOcorrenciaSubmit = async (data: OcorrenciaForm) => {
    if (!stepData.condominioId) return;
    setSubmitting(true);
    try {
      const result = await ocorrenciasApi.create({
        titulo: data.titulo,
        categoria: data.categoria,
        prioridade: data.prioridade,
        id_condominio: stepData.condominioId,
        responsabilidade: 'condominio',
      });
      setStepData(prev => ({
        ...prev,
        quickWinPath: 'ocorrencia',
        createdItemId: result.id_ocorrencia,
        createdItemData: result,
      }));
      setLoadingTecnicos(true);
      try {
        const tecnicos = await tecnicosApi.getAll();
        const available = tecnicos.filter(t => t.estado_disponibilidade === 'disponivel').slice(0, 3);
        setSuggestedTecnicos(available);
      } finally {
        setLoadingTecnicos(false);
      }
      setStep(4);
    } catch (err: any) {
      ocorrenciaForm.setError('titulo', { message: err.message || 'Erro ao criar ocorrência' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAtivoSubmit = async (data: AtivoForm) => {
    if (!stepData.condominioId) return;
    setSubmitting(true);
    try {
      const { data: result, error } = await supabase
        .from('ativos')
        .insert([{
          nome: data.nome,
          tipo_ativo: data.tipo_ativo,
          data_expiracao: data.data_expiracao || null,
          id_condominio: stepData.condominioId,
          categoria: 'compliance',
          estado: 'bom',
        }])
        .select()
        .single();
      if (error) throw error;
      setStepData(prev => ({
        ...prev,
        quickWinPath: 'ativo',
        createdItemId: result.id_ativo,
        createdItemData: result,
      }));
      setStep(4);
    } catch (err: any) {
      ativoForm.setError('nome', { message: err.message || 'Erro ao criar ativo' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    setStep(5);
    setTimeout(() => {
      navigate('/dashboard?onboarding=1');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hero-gradient-start to-hero-gradient-end flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step < 5 && <ProgressBar step={step} />}

        <div key={step} className="animate-slide-in-left">
          {/* Step 1 — Magic Link Signup */}
          {step === 1 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              {emailSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Email enviado!</h2>
                  <p className="text-muted-foreground mb-4">
                    Enviámos um link mágico para <strong>{savedEmail}</strong>. Clique no link para continuar.
                  </p>
                  <p className="text-sm text-muted-foreground">Verifique também a pasta de spam.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">Crie a sua conta gratuita</h2>
                    <p className="text-muted-foreground text-sm">Sem cartão de crédito. Sem compromissos.</p>
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
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Continuar com Email
                    </Button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Step 2 — First Condominium */}
          {step === 2 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">O seu primeiro edifício</h2>
                <p className="text-muted-foreground text-sm">
                  Vamos criar o seu primeiro condomínio no sistema.
                </p>
              </div>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                <div>
                  <Label htmlFor="nome_edificio">Nome do Edifício</Label>
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
                  <Label htmlFor="morada">Morada</Label>
                  <Input
                    id="morada"
                    placeholder="Rua das Flores, 123, Lisboa"
                    {...step2Form.register('morada')}
                  />
                  {step2Form.formState.errors.morada && (
                    <p className="text-sm text-destructive mt-1">
                      {step2Form.formState.errors.morada.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="num_fracoes">Total de Frações</Label>
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
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Criar Edifício
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </div>
          )}

          {/* Step 3 — Quick Win Path Selection */}
          {step === 3 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                  <Building2 className="h-3.5 w-3.5" />
                  {stepData.condominioNome}
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  Qual é o maior problema neste edifício agora?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Vamos registar o seu primeiro item em 30 segundos.
                </p>
              </div>

              {!selectedPath && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <button
                    onClick={() => handlePathSelect('ocorrencia')}
                    className="p-6 border-2 border-border rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <ClipboardList className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-sm">Registar uma ocorrência em aberto</p>
                    <p className="text-xs text-muted-foreground mt-1">Avaria, reclamação ou incidente</p>
                  </button>
                  <button
                    onClick={() => handlePathSelect('ativo')}
                    className="p-6 border-2 border-border rounded-xl text-left hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <Package className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-sm">Adicionar um ativo crítico</p>
                    <p className="text-xs text-muted-foreground mt-1">Licença, seguro ou equipamento</p>
                  </button>
                </div>
              )}

              {/* Ocorrência mini-form */}
              {selectedPath === 'ocorrencia' && (
                <form
                  onSubmit={ocorrenciaForm.handleSubmit(handleOcorrenciaSubmit)}
                  className="space-y-4 border-t pt-4"
                >
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" /> Nova Ocorrência
                  </p>
                  <div>
                    <Label htmlFor="oc_titulo">Título</Label>
                    <Input
                      id="oc_titulo"
                      placeholder="Ex: Infiltração no tecto do corredor"
                      {...ocorrenciaForm.register('titulo')}
                    />
                    {ocorrenciaForm.formState.errors.titulo && (
                      <p className="text-sm text-destructive mt-1">
                        {ocorrenciaForm.formState.errors.titulo.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select onValueChange={(v) => ocorrenciaForm.setValue('categoria', v as any)}>
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
                    <Select onValueChange={(v) => ocorrenciaForm.setValue('prioridade', v as any)}>
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
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Registar
                    </Button>
                  </div>
                </form>
              )}

              {/* Ativo mini-form */}
              {selectedPath === 'ativo' && (
                <form
                  onSubmit={ativoForm.handleSubmit(handleAtivoSubmit)}
                  className="space-y-4 border-t pt-4"
                >
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Novo Ativo
                  </p>
                  <div>
                    <Label htmlFor="ativo_nome">Nome do Ativo</Label>
                    <Input
                      id="ativo_nome"
                      placeholder="Ex: Extintor Piso 1"
                      {...ativoForm.register('nome')}
                    />
                    {ativoForm.formState.errors.nome && (
                      <p className="text-sm text-destructive mt-1">
                        {ativoForm.formState.errors.nome.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Tipo de Ativo</Label>
                    <Select onValueChange={(v) => ativoForm.setValue('tipo_ativo', v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoAtivoLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ativoForm.formState.errors.tipo_ativo && (
                      <p className="text-sm text-destructive mt-1">
                        {ativoForm.formState.errors.tipo_ativo.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="data_exp">Data de Expiração (opcional)</Label>
                    <Input id="data_exp" type="date" {...ativoForm.register('data_expiracao')} />
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
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Adicionar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Step 4 — Magic Resolution */}
          {step === 4 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8">
              {stepData.quickWinPath === 'ocorrencia' && (
                <>
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Ocorrência registada!</h2>
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

              {stepData.quickWinPath === 'ativo' && stepData.createdItemData && (
                <>
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Ativo adicionado!</h2>
                    <p className="text-muted-foreground text-sm">
                      Aqui está o estado do seu ativo:
                    </p>
                  </div>
                  <AtivoCard ativo={stepData.createdItemData} />
                </>
              )}

              <Button onClick={handleGoToDashboard} className="w-full mt-2">
                Ver o meu Dashboard →
              </Button>
            </div>
          )}

          {/* Step 5 — Loading → Dashboard */}
          {step === 5 && (
            <div className="bg-card rounded-2xl border shadow-lg p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">A preparar o seu painel...</h2>
              <p className="text-muted-foreground text-sm">Só um momento!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
