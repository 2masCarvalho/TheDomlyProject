import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrabalhos } from '@/context/TrabalhosContext';
import { useTecnicos } from '@/context/TecnicosContext';
import { useCondominios } from '@/context/CondominiosContext';
import { Trabalho, Candidatura, EstadoTrabalho, trabalhosApi } from '@/api/trabalhos';
import { Tecnico, tecnicosApi } from '@/api/tecnicos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Star, Phone, Mail, MapPin, UserCheck, Wrench, Link2, Copy, MessageCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const urgenciaConfig: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border-green-300' },
};

const estadoConfig: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  atribuido: 'bg-purple-100 text-purple-700',
  em_progresso: 'bg-orange-100 text-orange-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-600',
};

const estadoLabels: Record<string, string> = {
  aberto: 'Aberto', atribuido: 'Atribuído', em_progresso: 'Em Progresso',
  concluido: 'Concluído', cancelado: 'Cancelado',
};

const disponibilidadeColor: Record<string, string> = {
  disponivel: 'text-green-600', ocupado: 'text-orange-500', indisponivel: 'text-gray-400',
};

export const TrabalhoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trabalhos, updateTrabalho } = useTrabalhos();
  const { tecnicos } = useTecnicos();
  const { condominios } = useCondominios();
  const { toast } = useToast();

  const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [sugestoes, setSugestoes] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEstado, setNewEstado] = useState<EstadoTrabalho>('aberto');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const idNum = parseInt(id || '0');
    const found = trabalhos.find((t) => t.id_trabalho === idNum);

    const load = async () => {
      try {
        const t = found || await trabalhosApi.getById(idNum);
        setTrabalho(t);
        if (t) {
          setNewEstado(t.estado);
          const [cands, suggested] = await Promise.all([
            trabalhosApi.getCandidaturas(idNum),
            tecnicosApi.getAvailableBySpecialty(t.categoria),
          ]);
          setCandidaturas(cands);
          setSugestoes(suggested);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, trabalhos]);

  const handleAssign = async (tecnicoId: number) => {
    if (!trabalho) return;
    setSaving(true);
    try {
      const updated = await trabalhosApi.assignTecnico(trabalho.id_trabalho, tecnicoId);
      setTrabalho(updated);
      setNewEstado('atribuido');
      toast({ title: 'Sucesso', description: 'Técnico atribuído ao trabalho' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEstado = async () => {
    if (!trabalho) return;
    setSaving(true);
    try {
      await updateTrabalho(trabalho.id_trabalho, { estado: newEstado });
      setTrabalho({ ...trabalho, estado: newEstado });
    } finally {
      setSaving(false);
    }
  };

  const handleTecnicoCancelou = async () => {
    if (!trabalho) return;
    setSaving(true);
    try {
      const updated = await trabalhosApi.marcarCancelamentoPorTecnico(trabalho.id_trabalho);
      setTrabalho(updated);
      setNewEstado('aberto');
      toast({ title: 'Registado', description: 'Trabalho voltou a aberto e marcado como urgente.' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getTecnicoLink = () =>
    trabalho?.token_tecnico
      ? `${window.location.origin}/t/${trabalho.token_tecnico}`
      : null;

  const handleCopyLink = () => {
    const link = getTecnicoLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: 'Link copiado!', description: 'Cole no WhatsApp ou SMS do técnico.' });
    }
  };

  const handleWhatsApp = () => {
    const link = getTecnicoLink();
    const nome = tecnicoAtribuido?.nome ? `Olá ${tecnicoAtribuido.nome}, ` : 'Olá, ';
    const msg = encodeURIComponent(
      `${nome}tem um trabalho de manutenção atribuído a si: ${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) return <LoadingSpinner />;
  if (!trabalho) return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate('/trabalhos')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>
      <p className="text-muted-foreground">Trabalho não encontrado.</p>
    </div>
  );

  const condominioNome = condominios.find((c) => c.id_comdominio === trabalho.id_condominio)?.nome || '—';
  const tecnicoAtribuido = trabalho.id_tecnico_atribuido
    ? tecnicos.find((t) => t.id_tecnico === trabalho.id_tecnico_atribuido)
    : null;
  const urgCfg = urgenciaConfig[trabalho.urgencia];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/trabalhos')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar aos Trabalhos
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={urgCfg?.color}>{urgCfg?.label}</Badge>
            <Badge variant="secondary" className={estadoConfig[trabalho.estado]}>{estadoLabels[trabalho.estado]}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{trabalho.categoria}</span>
          </div>
          <h1 className="text-2xl font-bold">{trabalho.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {condominioNome} · {format(new Date(trabalho.created_at), 'dd MMMM yyyy', { locale: pt })}
          </p>
        </div>
      </div>

      {trabalho.descricao && (
        <Card>
          <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{trabalho.descricao}</p></CardContent>
        </Card>
      )}

      {/* Estado management */}
      <Card>
        <CardHeader><CardTitle className="text-base">Atualizar Estado</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={newEstado} onValueChange={(v) => setNewEstado(v as EstadoTrabalho)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="atribuido">Atribuído</SelectItem>
                <SelectItem value="em_progresso">Em Progresso</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveEstado} disabled={saving || newEstado === trabalho.estado}>
            {saving ? 'A guardar...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>

      {/* Urgent flag banner */}
      {trabalho.is_urgente && trabalho.estado === 'aberto' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Trabalho urgente — o técnico anterior cancelou. Atribua um novo técnico.</span>
        </div>
      )}

      {/* Assigned technician */}
      {tecnicoAtribuido && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600" /> Técnico Atribuído</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="font-semibold">{tecnicoAtribuido.nome}</p>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              {tecnicoAtribuido.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tecnicoAtribuido.telefone}</span>}
              {tecnicoAtribuido.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tecnicoAtribuido.email}</span>}
            </div>
            {trabalho.estado === 'atribuido' && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={handleTecnicoCancelou}
                disabled={saving}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Técnico Cancelou
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Link do Técnico */}
      {trabalho.token_tecnico && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link do Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Partilhe este link com o técnico. Ele pode aceitar ou cancelar sem precisar de login.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <code className="text-xs flex-1 truncate text-muted-foreground">
                {getTecnicoLink()}
              </code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-green-700 border-green-300 hover:bg-green-50" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested technicians */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Técnicos Sugeridos
            <span className="text-xs text-muted-foreground font-normal">
              (disponíveis com especialidade em {trabalho.categoria})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sugestoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum técnico disponível com esta especialidade.</p>
          ) : (
            <div className="space-y-3">
              {sugestoes.map((tecnico) => (
                <div key={tecnico.id_tecnico} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium">{tecnico.nome}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {tecnico.avaliacao_media?.toFixed(1) || '—'}
                      </span>
                      <span>{tecnico.total_trabalhos_concluidos} trabalhos</span>
                      {tecnico.zona && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tecnico.zona}</span>}
                      <span className={disponibilidadeColor[tecnico.estado_disponibilidade] || ''}>
                        {tecnico.estado_disponibilidade}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(tecnico.especialidades || []).map((e) => (
                        <Badge key={e} variant="outline" className="text-xs capitalize">{e}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={trabalho.id_tecnico_atribuido === tecnico.id_tecnico ? 'default' : 'outline'}
                    onClick={() => handleAssign(tecnico.id_tecnico)}
                    disabled={saving}
                  >
                    {trabalho.id_tecnico_atribuido === tecnico.id_tecnico ? 'Atribuído' : 'Atribuir'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications */}
      {candidaturas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Candidaturas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {candidaturas.map((c) => {
              const tec = tecnicos.find((t) => t.id_tecnico === c.id_tecnico);
              return (
                <div key={c.id_candidatura} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tec?.nome || `Técnico #${c.id_tecnico}`}</p>
                      {c.mensagem && <p className="text-sm text-muted-foreground mt-1">{c.mensagem}</p>}
                      {c.preco_proposto && <p className="text-sm font-medium mt-1">{c.preco_proposto.toFixed(2)}€</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.estado === 'aceite' ? 'default' : c.estado === 'rejeitado' ? 'destructive' : 'secondary'}>
                        {c.estado}
                      </Badge>
                      {c.estado === 'pendente' && (
                        <Button size="sm" onClick={() => handleAssign(c.id_tecnico)} disabled={saving}>
                          Aceitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
