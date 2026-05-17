import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { useTrabalhos } from '@/context/TrabalhosContext';
import { documentosApi, type Documento } from '@/api/documentos';
import { condominiosApi } from '@/api/condominios';
import { getExpiryStatus } from '@/api/ativos';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CondominioForm } from '@/components/CondominioForm/CondominioForm';
import { CondominioFormData } from '@/components/CondominioForm/validation';
import { AtivoForm } from '@/components/AtivoForm/AtivoForm';
import { AtivoFormData } from '@/components/AtivoForm/validation';
import { OcorrenciaForm } from '@/components/OcorrenciaForm/OcorrenciaForm';
import { CreateOcorrenciaData } from '@/api/ocorrencias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { computeNextMaintenanceDate } from '@/utils/maintenanceDates';
import { DocumentUploadZone } from '@/components/DocumentUploadZone/DocumentUploadZone';
import { MembrosTab } from '@/components/MembrosTab/MembrosTab';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Hash,
  Mail,
  Phone,
  Users,
  Calendar,
  Pencil,
  Plus,
  Package,
  ClipboardList,
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Euro,
  Landmark,
  ShieldCheck,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';

const tipoDocOptions = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'ata', label: 'Ata' },
  { value: 'aviso', label: 'Aviso' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'outro', label: 'Outro' },
];

const categoriaDocOptions = [
  { value: 'legal', label: 'Legal' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'outro', label: 'Outro' },
];

const prioridadeConfig: Record<string, { label: string; dotColor: string }> = {
  critica: { label: 'Crítica', dotColor: 'bg-red-500' },
  alta: { label: 'Alta', dotColor: 'bg-orange-500' },
  media: { label: 'Média', dotColor: 'bg-amber-400' },
  baixa: { label: 'Baixa', dotColor: 'bg-emerald-500' },
};

export const CondominioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const condominioId = parseInt(id || '0');

  const { condominios, loading: condoLoading, updateCondominio } = useCondominios();
  const { ativos, getAtivosByCondominio, createAtivo, loading: ativosLoading } = useAtivos();
  const { ocorrencias, createOcorrencia } = useOcorrencias();
  const { trabalhos } = useTrabalhos();

  const condominio = useMemo(() => condominios.find((c) => c.id_comdominio === condominioId), [condominios, condominioId]);
  const condoAtivos = useMemo(() => getAtivosByCondominio(condominioId), [condominioId, ativos]);
  const condoOcorrencias = useMemo(() => ocorrencias.filter((o) => o.id_condominio === condominioId), [ocorrencias, condominioId]);
  const condoTrabalhos = useMemo(() => trabalhos.filter((t) => t.id_condominio === condominioId), [trabalhos, condominioId]);
  const openOcorrencias = useMemo(() => condoOcorrencias.filter((o) => !['resolvida', 'fechada'].includes(o.estado)), [condoOcorrencias]);

  // Documents
  const [docs, setDocs] = useState<Documento[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTipo, setDocTipo] = useState('contrato');
  const [docCategoria, setDocCategoria] = useState('legal');

  // Modals
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [ativoFormOpen, setAtivoFormOpen] = useState(false);
  const [ocorrenciaFormOpen, setOcorrenciaFormOpen] = useState(false);

  useEffect(() => {
    if (!condominioId || condominioId <= 0) return;
    const loadDocs = async () => {
      try {
        setDocsLoading(true);
        const data = await documentosApi.listByCondominio(condominioId);
        setDocs(data);
      } catch { /* ignore */ } finally {
        setDocsLoading(false);
      }
    };
    loadDocs();
  }, [condominioId]);

  if (condoLoading || ativosLoading) return <LoadingSpinner />;

  if (!condominio) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Condomínio não encontrado</h1>
          <Button onClick={() => navigate('/condominios')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Handlers
  const handleEditSubmit = async (data: CondominioFormData) => {
    await updateCondominio(condominioId, {
      nome: data.nome || '', cidade: data.cidade || '', morada: data.morada || '',
      codigo_postal: data.codigo_postal || '', nif: data.nif ?? null,
      image_url: data.image_url, iban: data.iban, banco: data.banco,
      num_fracoes: data.num_fracoes, num_pisos: data.num_pisos,
      ano_construcao: data.ano_construcao, tem_elevador: data.tem_elevador,
      email_geral: data.email_geral, telefone: data.telefone,
    });
  };

  const handleNewAtivo = async (data: AtivoFormData) => {
    const nextMaint = computeNextMaintenanceDate({
      dataInstalacao: data.data_instalacao, ultimaManutencao: data.ultima_manutencao,
      frequencyMonths: data.frequencia_manutencao,
    });
    await createAtivo({
      id_condominio: condominioId, nome: data.nome, categoria: data.categoria,
      marca: data.marca, modelo: data.modelo, num_serie: data.num_serie,
      localizacao: data.localizacao, estado: data.estado, descricao: data.descricao,
      valor: data.valor, data_instalacao: data.data_instalacao,
      ultima_manutencao: data.ultima_manutencao, frequencia_manutencao: data.frequencia_manutencao,
      data_proxima_manutencao: nextMaint || undefined, tipo_ativo: data.tipo_ativo,
      data_expiracao: data.data_expiracao, data_ultima_manutencao: data.data_ultima_manutencao,
      empresa_responsavel: data.empresa_responsavel, contacto_empresa: data.contacto_empresa,
      estado_licenca: data.estado_licenca,
    });
  };

  const handleNewOcorrencia = async (data: CreateOcorrenciaData) => {
    await createOcorrencia(data);
  };

  const handleDocUpload = async () => {
    if (!docFile) return;
    try {
      setUploading(true);
      const storagePath = await documentosApi.uploadCondominioDocumento(condominioId, docFile);
      const created = await documentosApi.create({
        id_condominio: condominioId, nome: docFile.name,
        tipo_documento: docTipo, categoria: docCategoria, url: storagePath,
      });
      setDocs((prev) => [created, ...prev]);
      setDocFile(null);
      toast({ title: 'Sucesso', description: 'Documento carregado.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Falha no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDocDownload = async (doc: Documento) => {
    try {
      const signed = await documentosApi.getSignedDownloadUrl(doc.url, 60);
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Falha ao gerar link', variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await condominiosApi.uploadImage(file);
      await updateCondominio(condominioId, { image_url: url });
      toast({ title: 'Sucesso', description: 'Imagem atualizada.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Falha no upload', variant: 'destructive' });
    }
  };

  // Stats
  const ativosOverdue = condoAtivos.filter(a => getExpiryStatus(a.data_expiracao, a.data_proxima_manutencao) === 'overdue').length;
  const ativosSoon = condoAtivos.filter(a => getExpiryStatus(a.data_expiracao, a.data_proxima_manutencao) === 'soon').length;
  const trabalhosAbertos = condoTrabalhos.filter(t => t.estado === 'aberto' || t.estado === 'atribuido').length;

  const infoItems = [
    condominio.morada && { icon: MapPin, label: 'Morada', value: `${condominio.morada}${condominio.cidade ? `, ${condominio.cidade}` : ''}` },
    condominio.codigo_postal && { icon: Hash, label: 'Código Postal', value: condominio.codigo_postal },
    condominio.nif && { icon: Hash, label: 'NIF', value: String(condominio.nif) },
    condominio.num_fracoes && { icon: Users, label: 'Frações', value: String(condominio.num_fracoes) },
    condominio.num_pisos && { icon: Layers, label: 'Pisos', value: String(condominio.num_pisos) },
    condominio.ano_construcao && { icon: Calendar, label: 'Ano de construção', value: String(condominio.ano_construcao) },
    condominio.telefone && { icon: Phone, label: 'Telefone', value: condominio.telefone },
    condominio.email_geral && { icon: Mail, label: 'Email', value: condominio.email_geral },
    condominio.iban && { icon: Landmark, label: 'IBAN', value: condominio.iban },
    condominio.banco && { icon: Landmark, label: 'Banco', value: condominio.banco },
    condominio.apolice_seguro && { icon: ShieldCheck, label: 'Apólice', value: condominio.apolice_seguro },
    condominio.companhia_seguro && { icon: ShieldCheck, label: 'Seguradora', value: condominio.companhia_seguro },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-[#fafbfc]">

      {/* ── Hero / Header ──────────────────────────────── */}
      <div className="relative">
        {/* Cover image or gradient fallback */}
        <div className="h-48 lg:h-56 overflow-hidden" style={{
          background: condominio.image_url ? undefined : 'linear-gradient(135deg, #0f1729 0%, #1a2a4a 50%, #1a4a7a 100%)',
        }}>
          {condominio.image_url && (
            <img src={condominio.image_url} alt={condominio.nome} className="w-full h-full object-cover" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/10 gap-1.5 z-10"
          onClick={() => navigate('/condominios')}
        >
          <ArrowLeft className="h-4 w-4" /> Condomínios
        </Button>

        {/* Change image button */}
        <label className="absolute top-4 right-4 z-10 cursor-pointer">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white/80 hover:text-white text-xs font-medium transition-colors backdrop-blur-sm">
            <ImageIcon className="h-3.5 w-3.5" />
            {condominio.image_url ? 'Alterar foto' : 'Adicionar foto'}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-8 pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                {condominio.nome}
              </h1>
              {condominio.morada && (
                <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {condominio.morada}{condominio.cidade ? `, ${condominio.cidade}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {condominio.tem_elevador && (
                <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm text-[10px]">Elevador</Badge>
              )}
              <Button size="sm" variant="secondary" className="text-xs gap-1.5 shadow-lg" onClick={() => setEditFormOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ────────────────────────────────── */}
      <div className="px-6 lg:px-8 -mt-1">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 py-5">
          {[
            { label: 'Ativos', value: condoAtivos.length, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Ocorrências', value: openOcorrencias.length, icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-50' },
            { label: 'Trabalhos', value: trabalhosAbertos, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Documentos', value: docs.length, icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50' },
            { label: 'A expirar', value: ativosOverdue + ativosSoon, icon: AlertTriangle, color: ativosOverdue > 0 ? 'text-red-500' : 'text-emerald-500', bg: ativosOverdue > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/60 bg-white">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-none">{s.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="px-6 lg:px-8 pb-8">
        <Tabs defaultValue="info" className="space-y-5">
          <TabsList className="bg-white border border-slate-200/60 p-1 rounded-xl">
            <TabsTrigger value="info" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">Informações</TabsTrigger>
            <TabsTrigger value="ativos" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Ativos <span className="ml-1 text-[10px] opacity-60">{condoAtivos.length}</span>
            </TabsTrigger>
            <TabsTrigger value="ocorrencias" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Ocorrências <span className="ml-1 text-[10px] opacity-60">{condoOcorrencias.length}</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Documentos <span className="ml-1 text-[10px] opacity-60">{docs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="membros" className="text-xs rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Membros
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Informações ────────────────────────── */}
          <TabsContent value="info">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Details card */}
              <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" /> Dados do condomínio
                  </h3>
                  <button onClick={() => setEditFormOpen(true)} className="text-xs font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    Editar <Pencil className="h-3 w-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {infoItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <item.icon className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-400">{item.label}</p>
                        <p className="text-sm font-medium text-slate-800 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                  {infoItems.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">Sem informações adicionais. Clique em editar para completar.</div>
                  )}
                </div>
              </div>

              {/* Quick actions card */}
              <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[15px] font-semibold text-slate-800">Ações rápidas</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Novo ativo', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100', action: () => setAtivoFormOpen(true) },
                    { label: 'Nova ocorrência', icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-50 hover:bg-violet-100', action: () => setOcorrenciaFormOpen(true) },
                    { label: 'Novo trabalho', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100', action: () => navigate(`/trabalhos?condominio=${condominioId}`) },
                    { label: 'Ver ativos', icon: Eye, color: 'text-teal-500', bg: 'bg-teal-50 hover:bg-teal-100', action: () => navigate(`/condominios/${condominioId}/ativos`) },
                  ].map((a) => (
                    <button key={a.label} onClick={a.action} className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border border-slate-100 transition-colors cursor-pointer ${a.bg}`}>
                      <a.icon className={`h-5 w-5 ${a.color}`} />
                      <span className="text-xs font-medium text-slate-700">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Ativos ─────────────────────────────── */}
          <TabsContent value="ativos">
            <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" /> Ativos e equipamentos
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/condominios/${condominioId}/ativos`)} className="text-xs font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    Ver todos <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <Button size="sm" className="text-xs gap-1.5" onClick={() => setAtivoFormOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Novo ativo
                  </Button>
                </div>
              </div>

              {condoAtivos.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sem ativos registados</p>
                  <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => setAtivoFormOpen(true)}>Adicionar primeiro ativo</Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {condoAtivos.slice(0, 10).map((a) => {
                    const status = getExpiryStatus(a.data_expiracao, a.data_proxima_manutencao);
                    return (
                      <div
                        key={a.id_ativo}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/condominios/${condominioId}/ativos/${a.id_ativo}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{a.nome}</p>
                          <p className="text-xs text-slate-400">{a.categoria}{a.localizacao ? ` · ${a.localizacao}` : ''}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{a.estado}</Badge>
                        {status === 'overdue' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Expirado</span>}
                        {status === 'soon' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">Em breve</span>}
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                      </div>
                    );
                  })}
                  {condoAtivos.length > 10 && (
                    <div className="p-3 text-center">
                      <Button variant="link" size="sm" className="text-xs" onClick={() => navigate(`/condominios/${condominioId}/ativos`)}>
                        Ver todos os {condoAtivos.length} ativos
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Ocorrências ────────────────────────── */}
          <TabsContent value="ocorrencias">
            <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-violet-500" /> Ocorrências
                </h3>
                <Button size="sm" className="text-xs gap-1.5" onClick={() => setOcorrenciaFormOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Nova ocorrência
                </Button>
              </div>

              {condoOcorrencias.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sem ocorrências registadas</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {condoOcorrencias.slice(0, 10).map((o) => (
                    <div
                      key={o.id_ocorrencia}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${prioridadeConfig[o.prioridade]?.dotColor || 'bg-slate-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{o.titulo}</p>
                        <p className="text-[11px] text-slate-400 capitalize">{o.categoria} · {o.responsabilidade}</p>
                      </div>
                      <Badge variant={['resolvida', 'fechada'].includes(o.estado) ? 'secondary' : 'outline'} className="text-[10px]">
                        {o.estado === 'em_progresso' ? 'Em progresso' : o.estado}
                      </Badge>
                      <span className="text-[11px] text-slate-400">{format(new Date(o.created_at), 'dd MMM', { locale: pt })}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Documentos ─────────────────────────── */}
          <TabsContent value="documentos">
            <div className="space-y-5">
              {/* Bulk upload with AI */}
              <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-violet-50">
                      <Upload className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-800">Importar documentos</h3>
                      <p className="text-[11px] text-slate-400">Arraste ficheiros — a IA extrai datas, valores e tipo automaticamente</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <DocumentUploadZone
                    condominioId={condominioId}
                    onDocumentsProcessed={(newDocs) => {
                      // Reload the full list
                      documentosApi.listByCondominio(condominioId).then(setDocs).catch(() => {});
                    }}
                  />
                </div>
              </div>

              {/* Existing documents list */}
              <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-500" /> Documentos guardados ({docs.length})
                  </h3>
                </div>
                {docsLoading ? (
                  <div className="p-8"><LoadingSpinner size="sm" /></div>
                ) : docs.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Sem documentos — use a zona acima para importar</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {docs.map((d) => {
                      const hasExpiry = !!d.data_expiracao;
                      const isExpired = hasExpiry && new Date(d.data_expiracao!) < new Date();
                      return (
                        <div key={d.id_documento} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors ${isExpired ? 'bg-red-50/30' : ''}`}>
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${d.estado_processamento === 'concluido' ? 'bg-emerald-50' : d.estado_processamento === 'erro' ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <FileText className={`h-3.5 w-3.5 ${d.estado_processamento === 'concluido' ? 'text-emerald-500' : d.estado_processamento === 'erro' ? 'text-red-400' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{d.nome}</p>
                            <p className="text-[11px] text-slate-400">
                              {d.tipo_documento}{d.categoria ? ` · ${d.categoria}` : ''}
                              {d.entidade && <> · {d.entidade}</>}
                            </p>
                            {d.resumo && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{d.resumo}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {d.valor_monetario != null && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{d.valor_monetario}€</span>
                            )}
                            {hasExpiry && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {isExpired ? 'Expirado' : d.data_expiracao}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {new Date(d.data_upload || d.created_at || Date.now()).toLocaleDateString('pt-PT')}
                            </span>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDocDownload(d)}>
                              <Download className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Membros ────────────────────────────── */}
          <TabsContent value="membros">
            <MembrosTab condominioId={condominio.id_comdominio} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      <CondominioForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        initialData={condominio}
        onSubmit={handleEditSubmit}
      />

      <AtivoForm
        open={ativoFormOpen}
        onOpenChange={setAtivoFormOpen}
        onSubmit={handleNewAtivo}
        initialData={null}
      />

      <OcorrenciaForm
        open={ocorrenciaFormOpen}
        onOpenChange={setOcorrenciaFormOpen}
        onSubmit={handleNewOcorrencia}
        initialData={null}
        prefillCondominioId={condominioId}
      />
    </div>
  );
};