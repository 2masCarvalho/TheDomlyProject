import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { useCondominios } from '@/context/CondominiosContext';
import { Ocorrencia, EstadoOcorrencia, ocorrenciasApi } from '@/api/ocorrencias';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, ClipboardList, Wrench, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border-green-300' },
};

const categoriaLabels: Record<string, string> = {
  estrutural: 'Estrutural',
  'canalização': 'Canalização',
  eletricidade: 'Eletricidade',
  elevador: 'Elevador',
  zona_comum: 'Zona Comum',
  seguranca_incendio: 'Segurança Incêndio',
  outro: 'Outro',
};

export const OcorrenciaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ocorrencias, updateOcorrencia } = useOcorrencias();
  const { condominios } = useCondominios();
  const { toast } = useToast();

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState('');
  const [newEstado, setNewEstado] = useState<EstadoOcorrencia>('reportada');
  const [saving, setSaving] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const found = ocorrencias.find((o) => o.id_ocorrencia === parseInt(id || '0'));
    if (found) {
      setOcorrencia(found);
      setNotas(found.notas || '');
      setNewEstado(found.estado);
      setLoading(false);
    } else {
      ocorrenciasApi.getById(parseInt(id || '0')).then((data) => {
        setOcorrencia(data);
        if (data) {
          setNotas(data.notas || '');
          setNewEstado(data.estado);
        }
        setLoading(false);
      });
    }
  }, [id, ocorrencias]);

  const handleSave = async () => {
    if (!ocorrencia) return;
    setSaving(true);
    try {
      await updateOcorrencia(ocorrencia.id_ocorrencia, {
        estado: newEstado,
        notas,
      });
      setOcorrencia({ ...ocorrencia, estado: newEstado, notas });
      toast({ title: 'Sucesso', description: 'Ocorrência atualizada' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTrabalho = () => {
    if (!ocorrencia) return;
    navigate(`/trabalhos/novo?ocorrencia=${ocorrencia.id_ocorrencia}&condominio=${ocorrencia.id_condominio}&titulo=${encodeURIComponent(ocorrencia.titulo)}`);
  };

  const fotos = ocorrencia?.foto_urls?.filter(Boolean) || [];

  const handlePrevPhoto = () => setLightboxIndex((i) => (i > 0 ? i - 1 : fotos.length - 1));
  const handleNextPhoto = () => setLightboxIndex((i) => (i < fotos.length - 1 ? i + 1 : 0));

  if (loading) return <LoadingSpinner />;
  if (!ocorrencia) return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate('/ocorrencias')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>
      <p className="text-muted-foreground">Ocorrência não encontrada.</p>
    </div>
  );

  const condominioNome = condominios.find((c) => c.id_comdominio === ocorrencia.id_condominio)?.nome || '—';
  const priorCfg = prioridadeConfig[ocorrencia.prioridade];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate('/ocorrencias')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar às Ocorrências
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${priorCfg?.color}`}>{priorCfg?.label}</Badge>
            <Badge variant="secondary">{categoriaLabels[ocorrencia.categoria] || ocorrencia.categoria}</Badge>
            <Badge variant="outline">{ocorrencia.responsabilidade === 'condominio' ? 'Condomínio' : 'Fração'}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{ocorrencia.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {condominioNome} · {format(new Date(ocorrencia.created_at), 'dd MMMM yyyy', { locale: pt })}
            {ocorrencia.reportado_por && ` · Reportado por: ${ocorrencia.reportado_por}`}
          </p>
        </div>
        {ocorrencia.estado !== 'fechada' && (
          <Button onClick={handleCreateTrabalho} variant="outline">
            <Wrench className="h-4 w-4 mr-2" />
            Criar Trabalho
          </Button>
        )}
      </div>

      {ocorrencia.descricao && (
        <Card>
          <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{ocorrencia.descricao}</p></CardContent>
        </Card>
      )}

      {/* ── Fotografias ────────────────────────────────── */}
      {fotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Fotografias ({fotos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ocorrencia.id_trabalho_manutencao && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <Wrench className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Trabalho de manutenção vinculado</p>
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate(`/trabalhos/${ocorrencia.id_trabalho_manutencao}`)}>
                Ver trabalho #{ocorrencia.id_trabalho_manutencao}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Atualizar Estado e Notas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={newEstado} onValueChange={(v) => setNewEstado(v as EstadoOcorrencia)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reportada">Reportada</SelectItem>
                <SelectItem value="triagem">Triagem</SelectItem>
                <SelectItem value="em_progresso">Em Progresso</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              placeholder="Adicione notas sobre o acompanhamento desta ocorrência..."
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Lightbox ───────────────────────────────────── */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center overflow-hidden">
          <DialogHeader className="absolute top-4 left-4 z-50">
            <DialogTitle className="text-white/70 font-normal text-sm">
              Foto {lightboxIndex + 1} de {fotos.length}
            </DialogTitle>
          </DialogHeader>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {fotos.length > 1 && (
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

            <img
              src={fotos[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};