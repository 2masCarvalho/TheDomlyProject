import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Upload,
  FileText,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Euro,
  AlertCircle,
  Download,
  X,
  Bell,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AtivoForm } from '@/components/AtivoForm/AtivoForm';
import { AtivoFormData } from '@/components/AtivoForm/validation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alerta, ativosApi, manutencoesApi } from '@/api/ativos';
import { MaintenanceForm } from '@/components/MaintenanceForm/MaintenanceForm';

const estadoColors = {
  excelente: 'bg-green-500/10 text-green-500 border-green-500/20',
  bom: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  regular: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  mau: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const notificationColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  aviso: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  urgente: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const alertCategories = [
  { value: 'avaria', label: 'Avaria/Falha Técnica', color: 'text-red-500' },
  { value: 'manutencao', label: 'Manutenção Necessária', color: 'text-orange-500' },
  { value: 'limpeza', label: 'Limpeza/Conservação', color: 'text-blue-500' },
  { value: 'inspecao', label: 'Inspeção Periódica', color: 'text-purple-500' },
  { value: 'outro', label: 'Outra Informação', color: 'text-gray-500' },
];

export const AtivoDetailPage: React.FC = () => {
  const { condominioId, ativoId } = useParams<{ condominioId: string; ativoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { condominios, loading: condominiosLoading } = useCondominios();
  const { getAtivosByCondominio, updateAtivo, refreshAtivos, loading: ativosLoading } = useAtivos();
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [notificationType, setNotificationType] = useState<Alerta['tipo_alerta']>('outro');
  const parsedCondominioId = parseInt(condominioId || '0');
  const parsedAtivoId = parseInt(ativoId || '0');

  const [assetMaintenances, setAssetMaintenances] = useState<any[]>([]);
  const [maintenancesLoading, setMaintenancesLoading] = useState(true);

  const condominio = condominios.find((c) => c.id_comdominio === parsedCondominioId);
  const ativos = getAtivosByCondominio(parsedCondominioId);
  const ativo = ativos.find((a) => a.id_ativo === parsedAtivoId);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  if (condominiosLoading || ativosLoading) {
    return <LoadingSpinner />;
  }

  if (!condominio || !ativo) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Ativo não encontrado</h1>
          <Button onClick={() => navigate(`/condominios/${condominioId}/ativos`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Ativos
          </Button>
        </div>
      </div>
    );
  }

  const handleEditAtivo = async (data: AtivoFormData) => {
    await updateAtivo(parsedAtivoId, data);
    setEditModalOpen(false);
  };

  const loadAssetMaintenances = async () => {
    try {
      setMaintenancesLoading(true);
      // Filtramos as manutenções para mostrar apenas as deste ativo
      const all = await manutencoesApi.getAllMaintenances();
      const filtered = all.filter(m => m.id_ativo === parsedAtivoId);
      setAssetMaintenances(filtered);
    } catch (error) {
      console.error("Erro ao carregar manutenções:", error);
    } finally {
      setMaintenancesLoading(false);
    }
  };

  useEffect(() => {
    loadAssetMaintenances();
  }, [parsedAtivoId]);

  const handleReportIncident = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({ title: 'Erro', description: 'Preencha o título e a descrição', variant: 'destructive' });
      return;
    }

    try {
      // Agora gravamos na tabela de ALERTAS que viste no esquema
      await ativosApi.createAlert({
        id_ativo: parsedAtivoId,
        titulo: notificationTitle,
        mensagem: notificationMessage,
        tipo_alerta: notificationType, // avaria, manutencao, etc.
        estado: 'pendente'
      });

      toast({ title: 'Ocorrência Registada', description: 'O alerta foi criado com sucesso.' });
      setNotificationModalOpen(false);
      if (refreshAtivos) await refreshAtivos();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddPhotos = async () => {
    if (selectedPhotos.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos uma foto', variant: 'destructive' });
      return;
    }

    try {
      setUploadingPhotos(true);

      // Faz o upload de todas as fotos selecionadas em paralelo
      const uploadPromises = selectedPhotos.map(async (file) => {
        const url = await ativosApi.uploadPhoto(parsedAtivoId, file);
        return ativosApi.savePhoto(parsedAtivoId, url);
      });

      await Promise.all(uploadPromises);

      toast({ title: 'Sucesso', description: `${selectedPhotos.length} fotos adicionadas` });
      setSelectedPhotos([]);
      setPhotoModalOpen(false);

      if (refreshAtivos) await refreshAtivos();
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleNextPhoto = () => {
    if (!ativo.fotos) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % ativo.fotos!.length);
  };

  const alertColors = {
    avaria: 'bg-red-500/10 text-red-500 border-red-500/20',
    manutencao: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    limpeza: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    inspecao: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    outro: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const handlePrevPhoto = () => {
    if (!ativo.fotos) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + ativo.fotos!.length) % ativo.fotos!.length);
  };

  const handleAddDocument = async () => {
    if (!selectedDocument) {
      toast({
        title: 'Erro',
        description: 'Selecione um documento primeiro',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingDoc(true);

      // 1. Upload do ficheiro para o Storage
      const publicUrl = await ativosApi.uploadDocument(parsedAtivoId, selectedDocument);

      // 2. Grava os dados na tabela de documentos
      await ativosApi.saveDocument({
        id_ativo: parsedAtivoId,
        nome: selectedDocument.name,
        tipo_documento: selectedDocument.name.split('.').pop()?.toUpperCase() || 'DOC',
        url: publicUrl,
      });

      toast({
        title: 'Sucesso',
        description: 'O documento foi guardado com sucesso',
      });

      // 3. Limpa e fecha
      setSelectedDocument(null);
      setDocumentModalOpen(false);

      // 4. Atualiza a lista global para o documento aparecer no ecrã
      if (refreshAtivos) await refreshAtivos();

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível guardar o documento',
        variant: 'destructive',
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleResolveAlert = async (id_alerta: number) => {
    try {
      // 1. Chama a API para atualizar na base de dados
      await ativosApi.updateAlertStatus(id_alerta, 'resolvido');

      // 2. Feedback visual para o utilizador
      toast({
        title: 'Alerta Resolvido',
        description: 'O estado da ocorrência foi atualizado com sucesso.'
      });

      // 3. REFRESH: Isto é vital para o contador da Sidebar e o Badge diminuírem
      if (refreshAtivos) await refreshAtivos();

    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      });
    }
  }

  const handleScheduleMaintenance = () => {
    if (!maintenanceDate) {
      toast({
        title: 'Erro',
        description: 'Selecione uma data',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Manutenção agendada',
      description: `Manutenção agendada para ${new Date(maintenanceDate).toLocaleDateString('pt-PT')}`,
    });
    setMaintenanceDate('');
    setMaintenanceModalOpen(false);
  };

  const handleAddNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      // CHAMADA REAL À API PARA GRAVAR NA BASE DE DADOS
      await ativosApi.createAlert({
        id_ativo: parsedAtivoId,
        titulo: notificationTitle,
        mensagem: notificationMessage,
        tipo_alerta: notificationType,
        estado: 'pendente'
      });

      toast({
        title: 'Notificação criada',
        description: 'A notificação foi adicionada com sucesso',
      });

      // Limpar campos e fechar modal
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationType('outro');
      setNotificationModalOpen(false);

      // REFRESH para os dados aparecerem no ecrã e na sidebar
      if (refreshAtivos) await refreshAtivos();

    } catch (error: any) {
      toast({
        title: 'Erro ao criar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    toast({
      title: 'Notificação marcada como lida',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/condominios/${condominioId}/ativos`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Ativos
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{ativo.nome}</h1>
                {ativo.alertas?.some(a => a.tipo_alerta === 'avaria' && a.estado === 'pendente') && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" /> Avaria Reportada
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-lg">{ativo.categoria}</p>
              <p className="text-sm text-muted-foreground mt-1">{condominio.nome}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setNotificationModalOpen(true)}>
                <Bell className="h-4 w-4" />
                Nova Notificação
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setDocumentModalOpen(true)}>
                <Upload className="h-4 w-4" />
                Adicionar Documento
              </Button>
              <Button className="gap-2 shadow-elegant" onClick={() => setEditModalOpen(true)}>
                <Edit className="h-4 w-4" />
                Editar Ativo
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notificações */}
            {/* Notificações (Alertas) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Alertas e Ocorrências</h2>
                  {/* Contador de Alertas Pendentes */}
                  {ativo.alertas && ativo.alertas.filter(a => a.estado === 'pendente').length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {ativo.alertas.filter(a => a.estado === 'pendente').length}
                    </Badge>
                  )}
                </div>
                <Button size="sm" className="gap-2" onClick={() => setNotificationModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </div>

              {ativo.alertas && ativo.alertas.length > 0 ? (
                <div className="space-y-3">
                  {ativo.alertas.map((alerta) => (
                    <div
                      key={alerta.id_alerta}
                      className={`p-4 border rounded-lg transition-colors ${alerta.estado === 'resolvido' ? 'bg-muted/50 opacity-70' : 'bg-background'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={alertColors[alerta.tipo_alerta]}>
                              {alerta.tipo_alerta.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alerta.data_alerta).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{alerta.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
                        </div>
                        {alerta.estado === 'pendente' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
                            onClick={() => handleResolveAlert(alerta.id_alerta)} // <--- LIGAÇÃO AQUI
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Marcar resolvido
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma ocorrência registada</p>
                </div>
              )}
            </Card>
            {/* Informações Gerais */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informações Gerais</h2>
              <div className="space-y-4">
                {ativo.descricao && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="mt-1">{ativo.descricao}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {ativo.valor && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Valor
                      </label>
                      <p className="mt-1 font-semibold">{ativo.valor.toLocaleString('pt-PT')}€</p>
                    </div>
                  )}

                  {ativo.data_instalacao && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Instalação
                      </label>
                      <p className="mt-1">{new Date(ativo.data_instalacao).toLocaleDateString('pt-PT')}</p>
                    </div>
                  )}

                  {ativo.localizacao && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Localização
                      </label>
                      <p className="mt-1">{ativo.localizacao}</p>
                    </div>
                  )}

                  {ativo.data_proxima_manutencao && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Próxima Manutenção
                      </label>
                      <p className="mt-1">
                        {new Date(ativo.data_proxima_manutencao).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  )}
                </div>

                {ativo.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <p className="mt-1">{ativo.observacoes}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Tabs: Fotos e Documentos */}
            <Card className="p-6">
              <Tabs defaultValue="fotos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fotos" className="flex-1">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {/* Contador de Fotos real */}
                    Fotos ({ativo.fotos?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="documentos">
                    <FileText className="h-4 w-4 mr-2" />
                    {/* Contador de Documentos real */}
                    Documentos ({ativo.documentos?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fotos" className="pt-4">
                  {ativo.fotos && ativo.fotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {ativo.fotos.map((foto, index) => ( // Adicionamos o index aqui
                        <div
                          key={foto.id}
                          className="aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer group relative"
                          onClick={() => {
                            setCurrentPhotoIndex(index);
                            setViewerOpen(true);
                          }}
                        >
                          <img
                            src={foto.url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            alt="Ativo"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="text-white h-6 w-6" />
                          </div>
                        </div>
                      ))}
                      {/* ... botão de adicionar */}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Nenhuma foto adicionada</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setPhotoModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" /> Carregar Foto
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documentos" className="mt-4">
                  {ativo.documentos && ativo.documentos.length > 0 ? (
                    <div className="space-y-2">
                      {ativo.documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{doc.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.tipo_documento} • {new Date(doc.data_upload || doc.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => window.open(doc.url, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p>Nenhum documento.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Plano de Manutenção</h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Agendar
                </Button>
              </div>

              {maintenancesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
              ) : assetMaintenances.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3 text-right">Custo</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assetMaintenances.map((m) => (
                        <tr key={m.id_manutencao} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">
                            {m.data_conclusao ? new Date(m.data_conclusao).toLocaleDateString('pt-PT') : '---'}
                          </td>
                          <td className="p-3 text-muted-foreground truncate max-w-[200px]">{m.descricao}</td>
                          <td className="p-3 text-right font-mono">
                            {m.custo ? `${m.custo.toFixed(2)}€` : '0.00€'}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={m.estado === 'concluido' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {m.estado.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-muted-foreground">Sem manutenções registadas.</p>
                </div>
              )}
            </Card>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Estado do Ativo</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Condição Atual</label>
                  <Badge variant="outline" className={`${ativo.estado ? estadoColors[ativo.estado] : ''} mt-2 w-full justify-center py-2`}>
                    {ativo.estado ? ativo.estado.toUpperCase() : 'SEM ESTADO'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <label className="text-sm text-muted-foreground">Criado em</label>
                  <p className="text-sm mt-1">
                    {ativo.created_at ? new Date(ativo.created_at).toLocaleDateString('pt-PT') : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Ações Rápidas */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPhotoModalOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Adicionar Foto
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setDocumentModalOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Adicionar Documento
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2 shadow-sm"
                  onClick={() => {
                    setNotificationType('avaria'); // Pré-seleciona Avaria
                    setNotificationModalOpen(true);
                  }}
                >
                  <AlertCircle className="h-4 w-4" />
                  Reportar Avaria
                </Button>
                <Separator className="my-2" />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsMaintenanceModalOpen(true)} // Abre o modal
                >
                  <Calendar className="h-4 w-4" /> Agendar Manutenção
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setEditModalOpen(true)}>
                  <Edit className="h-4 w-4" />
                  Editar Informações
                </Button>
              </div>

              <MaintenanceForm
                open={isMaintenanceModalOpen}
                onOpenChange={setIsMaintenanceModalOpen}
                ativos={[]} // Não precisa da lista completa aqui
                fixedAtivoId={ativo.id_ativo} // Passa o ID deste ativo específico
                onSuccess={() => {
                  // Lógica para recarregar os dados do ativo ou mostrar toast de sucesso
                }}
              />
            </Card>
          </div>
        </div>

        {/* Modals */}
        <AtivoForm
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleEditAtivo}
          initialData={ativo}
        />

        {/* Photo Upload Modal */}
        <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Fotos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="photos">Selecionar Fotos</Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setSelectedPhotos(Array.from(e.target.files || []))}
                  className="mt-2"
                />
              </div>
              {selectedPhotos.length > 0 && (
                <div className="space-y-2">
                  <Label>Fotos Selecionadas ({selectedPhotos.length})</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPhotos.map((file, index) => (
                      <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setPhotoModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddPhotos}>
                  Adicionar Fotos
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Upload Modal */}
        <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document">Selecionar Documento</Label>
                <Input
                  id="document"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setSelectedDocument(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </div>
              {selectedDocument && (
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedDocument.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedDocument.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDocument(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDocumentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddDocument} disabled={uploadingDoc || !selectedDocument}>
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A carregar...
                    </>
                  ) : (
                    'Adicionar Documento'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Lightbox */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center overflow-hidden">
            <DialogHeader className="absolute top-4 left-4 z-50">
              <DialogTitle className="text-white opacity-70 font-normal">
                Foto {currentPhotoIndex + 1} de {ativo.fotos?.length}
              </DialogTitle>
            </DialogHeader>

            {/* Close Button Custom (opcional, o Dialog já traz um por defeito, mas este fica melhor em dark) */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Navigation Buttons */}
              {ativo.fotos && ativo.fotos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                    onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                    onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* The Image */}
              {ativo.fotos && (
                <img
                  src={ativo.fotos[currentPhotoIndex]?.url}
                  alt={`Foto ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>


        {/* Maintenance Schedule Modal */}
        <Dialog open={maintenanceModalOpen} onOpenChange={setMaintenanceModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Agendar Manutenção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenance-date">Data da Próxima Manutenção</Label>
                <Input
                  id="maintenance-date"
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setMaintenanceModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleScheduleMaintenance}>
                  Agendar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Modal */}
        <Dialog open={notificationModalOpen} onOpenChange={setNotificationModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Notificação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-type">Tipo de Notificação</Label>
                <Select
                  value={notificationType}
                  onValueChange={(value: Alerta['tipo_alerta']) => setNotificationType(value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avaria">Avaria</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="limpeza">Limpeza</SelectItem>
                    <SelectItem value="inspecao">Inspeção</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notification-title">Título</Label>
                <Input
                  id="notification-title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Ex: Manutenção Agendada"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="notification-message">Mensagem</Label>
                <Textarea
                  id="notification-message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Descreva a notificação..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setNotificationModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNotification}>
                  Criar Notificação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
