import React, { useState } from 'react';
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
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AtivoForm } from '@/components/AtivoForm/AtivoForm';
import { AtivoFormData } from '@/components/AtivoForm/validation';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export const AtivoDetailPage: React.FC = () => {
  const { condominioId, ativoId } = useParams<{ condominioId: string; ativoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { condominios, loading: condominiosLoading } = useCondominios();
  const { getAtivosByCondominio, updateAtivo, loading: ativosLoading } = useAtivos();

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
  const [notificationType, setNotificationType] = useState<'info' | 'aviso' | 'urgente'>('info');

  const parsedCondominioId = parseInt(condominioId || '0');
  const parsedAtivoId = parseInt(ativoId || '0');

  const condominio = condominios.find((c) => c.id_condominio === condominioId);
  const ativos = getAtivosByCondominio(parsedCondominioId);
  const ativo = ativos.find((a) => a.id === parsedAtivoId);

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

  const handleAddPhotos = () => {
    if (selectedPhotos.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma foto',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Fotos adicionadas',
      description: `${selectedPhotos.length} foto(s) foram adicionadas com sucesso`,
    });
    setSelectedPhotos([]);
    setPhotoModalOpen(false);
  };

  const handleAddDocument = () => {
    if (!selectedDocument) {
      toast({
        title: 'Erro',
        description: 'Selecione um documento',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Documento adicionado',
      description: 'O documento foi adicionado com sucesso',
    });
    setSelectedDocument(null);
    setDocumentModalOpen(false);
  };

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

  const handleAddNotification = () => {
    if (!notificationTitle || !notificationMessage) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Notificação criada',
      description: 'A notificação foi adicionada com sucesso',
    });
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationType('info');
    setNotificationModalOpen(false);
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
                <Badge variant="outline" className={estadoColors[ativo.estado]}>
                  {ativo.estado}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">{ativo.tipo}</p>
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
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Notificações</h2>
                  {ativo.notificacoes && ativo.notificacoes.filter(n => !n.lida).length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {ativo.notificacoes.filter(n => !n.lida).length}
                    </Badge>
                  )}
                </div>
                <Button size="sm" className="gap-2" onClick={() => setNotificationModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nova
                </Button>
              </div>
              {ativo.notificacoes && ativo.notificacoes.length > 0 ? (
                <div className="space-y-3">
                  {ativo.notificacoes.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notificacao.lida ? 'bg-muted/50' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={notificationColors[notificacao.tipo]}>
                              {notificacao.tipo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notificacao.data_criacao).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1">{notificacao.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{notificacao.mensagem}</p>
                        </div>
                        {!notificacao.lida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notificacao.id)}
                          >
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
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

                  {ativo.data_aquisicao && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data de Aquisição
                      </label>
                      <p className="mt-1">{new Date(ativo.data_aquisicao).toLocaleDateString('pt-PT')}</p>
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
                  <TabsTrigger value="fotos">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Fotos ({ativo.fotos?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="documentos">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentos ({ativo.documentos?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="fotos" className="mt-4">
                  {ativo.fotos && ativo.fotos.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {ativo.fotos.map((foto, index) => (
                        <div
                          key={index}
                          className="aspect-video bg-muted rounded-lg overflow-hidden border"
                        >
                          <img
                            src={foto}
                            alt={`${ativo.nome} - Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma foto adicionada</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setPhotoModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Foto
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documentos" className="mt-4">
                  {ativo.documentos && ativo.documentos.length > 0 ? (
                    <div className="space-y-2">
                      {ativo.documentos.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.tipo} • {new Date(doc.data_upload).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum documento adicionado</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setDocumentModalOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Documento
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
                  <Badge variant="outline" className={`${estadoColors[ativo.estado]} mt-2 w-full justify-center py-2`}>
                    {ativo.estado.toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <label className="text-sm text-muted-foreground">Criado em</label>
                  <p className="text-sm mt-1">
                    {new Date(ativo.criado_em).toLocaleDateString('pt-PT')}
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
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMaintenanceModalOpen(true)}>
                  <Calendar className="h-4 w-4" />
                  Agendar Manutenção
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setEditModalOpen(true)}>
                  <Edit className="h-4 w-4" />
                  Editar Informações
                </Button>
              </div>
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
                <Button onClick={handleAddDocument}>
                  Adicionar Documento
                </Button>
              </div>
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
                <Select value={notificationType} onValueChange={(value: 'info' | 'aviso' | 'urgente') => setNotificationType(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="aviso">Aviso</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
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
