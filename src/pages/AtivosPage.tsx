import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Bell } from 'lucide-react';
import { AtivosList } from '@/components/AtivosList/AtivosList';
import { AtivoForm } from '@/components/AtivoForm/AtivoForm';
import { AtivoFormData } from '@/components/AtivoForm/validation';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { Ativo } from '@/api/ativos';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AtivosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { condominios, loading: condominiosLoading } = useCondominios();
  const { getAtivosByCondominio, createAtivo, updateAtivo, deleteAtivo, loading: ativosLoading } = useAtivos();

  const [isAtivoFormOpen, setIsAtivoFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);

  const condominioId = parseInt(id || '0');
  const condominio = condominios.find((c) => c.id_comdominio === condominioId);
  const ativos = getAtivosByCondominio(condominioId);

  // Contar notificações não lidas
  const notificacoesNaoLidas = ativos.reduce((total, ativo) => {
    return total + (ativo.notificacoes || []).filter((n) => !n.lida).length;
  }, 0);

  const handleCreate = () => {
    setSelectedAtivo(null);
    setIsAtivoFormOpen(true);
  };

  const handleEdit = (ativo: Ativo) => {
    setSelectedAtivo(ativo);
    setIsAtivoFormOpen(true);
  };

  const handleDelete = (ativo: Ativo) => {
    setSelectedAtivo(ativo);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: AtivoFormData) => {
    if (selectedAtivo) {
      await updateAtivo(selectedAtivo.id_ativo, data);
    } else {
      await createAtivo({
        id_condominio: condominioId,
        nome: data.nome,
        categoria: data.categoria,
        estado: data.estado,
        descricao: data.descricao,
        valor: data.valor,
        data_instalacao: data.data_instalacao,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedAtivo) {
      await deleteAtivo(selectedAtivo.id_ativo);
      setIsDeleteModalOpen(false);
      setSelectedAtivo(null);
    }
  };

  if (condominiosLoading) {
    return <LoadingSpinner />;
  }

  if (!condominio) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Condomínio não encontrado</h1>
          <Button onClick={() => navigate('/condominios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Condomínios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/condominios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Condomínios
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{condominio.nome}</h1>
              <p className="text-muted-foreground">{condominio.morada}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/condominios/${condominioId}/notificacoes`)}
                className="gap-2 relative"
              >
                <Bell className="h-4 w-4" />
                Notificações
                {notificacoesNaoLidas > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificacoesNaoLidas}
                  </Badge>
                )}
              </Button>
              <Button onClick={handleCreate} className="gap-2 shadow-elegant">
                <Plus className="h-4 w-4" />
                Adicionar Ativo
              </Button>
            </div>
          </div>
        </div>

        {/* Ativos List */}
        {ativosLoading ? (
          <LoadingSpinner />
        ) : (
          <AtivosList
            ativos={ativos}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AtivoForm
        open={isAtivoFormOpen}
        onOpenChange={setIsAtivoFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedAtivo}
      />

      <ConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Remover Ativo"
        description={`Tem a certeza que pretende remover o ativo "${selectedAtivo?.nome}"? Esta ação não pode ser revertida.`}
      />
    </div>
  );
};
