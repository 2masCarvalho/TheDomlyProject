import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTrabalhos } from '@/context/TrabalhosContext';
import { useCondominios } from '@/context/CondominiosContext';
import { Trabalho, CreateTrabalhoData } from '@/api/trabalhos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TrabalhoForm } from '@/components/TrabalhoForm/TrabalhoForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Wrench, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const urgenciaConfig: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-300' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border-green-300' },
};

const estadoConfig: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  atribuido: { label: 'Atribuído', color: 'bg-purple-100 text-purple-700' },
  em_progresso: { label: 'Em Progresso', color: 'bg-orange-100 text-orange-700' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' },
};

const categoriaLabels: Record<string, string> = {
  'canalização': 'Canalização', eletricidade: 'Eletricidade', serralharia: 'Serralharia',
  pintura: 'Pintura', avac: 'AVAC', geral: 'Geral',
};

export const TrabalhosPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trabalhos, loading, createTrabalho, deleteTrabalho } = useTrabalhos();
  const { condominios } = useCondominios();

  // Pre-fill from URL params (when redirected from OcorrenciaDetailPage)
  const prefillCondominioId = searchParams.get('condominio') ? parseInt(searchParams.get('condominio')!) : undefined;
  const prefillTitulo = searchParams.get('titulo') ? decodeURIComponent(searchParams.get('titulo')!) : undefined;
  const prefillOcorrenciaId = searchParams.get('ocorrencia') ? parseInt(searchParams.get('ocorrencia')!) : undefined;

  const [isFormOpen, setIsFormOpen] = useState(!!prefillCondominioId);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTrabalho, setSelectedTrabalho] = useState<Trabalho | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterUrgencia, setFilterUrgencia] = useState('all');
  const [filterCondominio, setFilterCondominio] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');

  const filtered = useMemo(() => {
    return trabalhos.filter((t) => {
      if (searchTerm && !t.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterEstado !== 'all' && t.estado !== filterEstado) return false;
      if (filterUrgencia !== 'all' && t.urgencia !== filterUrgencia) return false;
      if (filterCondominio !== 'all' && String(t.id_condominio) !== filterCondominio) return false;
      if (filterCategoria !== 'all' && t.categoria !== filterCategoria) return false;
      return true;
    });
  }, [trabalhos, searchTerm, filterEstado, filterUrgencia, filterCondominio, filterCategoria]);

  const handleCreate = () => { setIsFormOpen(true); };
  const handleDelete = (t: Trabalho) => { setSelectedTrabalho(t); setIsDeleteOpen(true); };

  const handleFormSubmit = async (data: CreateTrabalhoData) => {
    await createTrabalho(data);
  };

  const handleConfirmDelete = async () => {
    if (selectedTrabalho) {
      await deleteTrabalho(selectedTrabalho.id_trabalho);
      setIsDeleteOpen(false);
      setSelectedTrabalho(null);
    }
  };

  const getCondominioNome = (id: number) => condominios.find((c) => c.id_comdominio === id)?.nome || '—';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Trabalhos de Manutenção
          </h1>
          <p className="text-muted-foreground text-sm">
            {trabalhos.filter((t) => t.estado === 'aberto').length} trabalhos em aberto
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Trabalho
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Pesquisar por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="atribuido">Atribuído</SelectItem>
            <SelectItem value="em_progresso">Em Progresso</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Urgência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCondominio} onValueChange={setFilterCondominio}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Condomínio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {condominios.map((c) => (
              <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(categoriaLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
          <Wrench className="h-12 w-12 mb-3 opacity-50" />
          <h3 className="text-lg font-medium">Sem trabalhos encontrados</h3>
          <Button variant="link" onClick={handleCreate} className="mt-1">Criar primeiro trabalho</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const urgCfg = urgenciaConfig[t.urgencia];
            const estadoCfg = estadoConfig[t.estado];
            return (
              <Card key={t.id_trabalho} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${urgCfg?.color}`}>{urgCfg?.label}</Badge>
                        <Badge variant="secondary" className={`text-xs ${estadoCfg?.color}`}>{estadoCfg?.label}</Badge>
                        <span className="text-xs text-muted-foreground">{categoriaLabels[t.categoria] || t.categoria}</span>
                      </div>
                      <p className="font-semibold truncate">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getCondominioNome(t.id_condominio)} · {format(new Date(t.created_at), 'dd MMM yyyy', { locale: pt })}
                        {t.id_ocorrencia && ` · Ocorrência #${t.id_ocorrencia}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/trabalhos/${t.id_trabalho}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(t)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TrabalhoForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        prefillCondominioId={prefillCondominioId}
        prefillTitulo={prefillTitulo}
        prefillOcorrenciaId={prefillOcorrenciaId}
      />

      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Eliminar Trabalho"
        description={`Tem a certeza que pretende eliminar o trabalho "${selectedTrabalho?.titulo}"?`}
      />
    </div>
  );
};
