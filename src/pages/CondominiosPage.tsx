import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAuth } from '@/context/AuthContext';
import { Condominio } from '@/api/condominios';
import { CondominioList } from '@/components/CondominioList/CondominioList';
import { CondominioForm } from '@/components/CondominioForm/CondominioForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CardListSkeleton } from '@/components/skeletons/CardListSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Upload, Search, Eye, EyeOff, MoreVertical, Lock } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { CondominioFormData } from '@/components/CondominioForm/validation';
import { CreateCondominioData } from '@/api/condominios';
import { CondominioImportModal } from '@/components/CondominioImportModal/CondominioImportModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CondominiosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    filteredCondominios,
    loading,
    searchTerm,
    setSearchTerm,
    includeInactive,
    setIncludeInactive,
    createCondominio,
    updateCondominio,
    deactivateCondominio,
    reactivateCondominio,
  } = useCondominios();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);

  const handleCreate = () => { setSelectedCondominio(null); setIsFormOpen(true); };
  const handleEdit = (condominio: Condominio) => { setSelectedCondominio(condominio); setIsFormOpen(true); };
  const handleDeactivate = (condominio: Condominio) => { setSelectedCondominio(condominio); setIsDeactivateModalOpen(true); };
  const handleReactivate = async (condominio: Condominio) => { await reactivateCondominio(condominio.id_comdominio); };

  const handleFormSubmit = async (data: CondominioFormData) => {
    const payload: CreateCondominioData = {
      nome: data.nome || '',
      cidade: data.cidade || '',
      morada: data.morada || '',
      codigo_postal: data.codigo_postal || '',
      nif: data.nif ?? null,
      image_url: data.image_url,
      iban: data.iban,
      banco: data.banco,
      num_fracoes: data.num_fracoes,
      num_pisos: data.num_pisos,
      ano_construcao: data.ano_construcao,
      tem_elevador: data.tem_elevador,
      email_geral: data.email_geral,
      telefone: data.telefone,
    };

    try {
      if (selectedCondominio) {
        await updateCondominio(selectedCondominio.id_comdominio, payload);
      } else {
        await createCondominio(payload);
      }
    } catch (error) {
      console.error('Erro ao salvar condomínio:', error);
    }
  };

  const confirmDeactivate = async () => {
    if (selectedCondominio) await deactivateCondominio(selectedCondominio.id_comdominio);
    setIsDeactivateModalOpen(false);
  };

  const handleImportCondominios = async (data: CreateCondominioData[]) => {
    for (const item of data) {
      await createCondominio(item);
    }
  };

  if (!user) {
    return (
      <div className="p-8 min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Necessita de iniciar sessão"
          message="Inicie sessão para aceder à gestão de condomínios."
          cta={
            <Button onClick={() => navigate('/login')}>Iniciar sessão</Button>
          }
          className="max-w-md w-full bg-white"
        />
      </div>
    );
  }

  const activeCount = filteredCondominios.filter(c => c.is_active !== false).length;
  const totalCount = filteredCondominios.length;

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-[#fafbfc]">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 ring-1 ring-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              Condomínios
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-[3.25rem]">
              {totalCount === 0
                ? 'Nenhum condomínio encontrado'
                : `${activeCount} ativo${activeCount !== 1 ? 's' : ''}${includeInactive && totalCount > activeCount ? ` · ${totalCount - activeCount} desativado${totalCount - activeCount !== 1 ? 's' : ''}` : ''}`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Importar
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              Novo condomínio
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIncludeInactive(!includeInactive)} className="text-xs gap-2 cursor-pointer">
                  {includeInactive
                    ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar desativados</>
                    : <><Eye className="h-3.5 w-3.5" /> Mostrar desativados</>
                  }
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Search & Filter bar ─────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Pesquisar por nome, morada ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-blue-500/20"
            />
          </div>

          {includeInactive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-500">
              <Eye className="h-3 w-3" /> A mostrar desativados
            </span>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────── */}
      {loading ? (
        <CardListSkeleton rows={5} />
      ) : (
        <CondominioList
          condominios={filteredCondominios}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      )}

      {/* ── Modals ───────────────────────────────────── */}
      <CondominioForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedCondominio}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        open={isDeactivateModalOpen}
        onOpenChange={setIsDeactivateModalOpen}
        onConfirm={confirmDeactivate}
        title="Desativar Condomínio"
        description="Este condomínio ficará oculto por defeito. Pode reativá-lo mais tarde."
      />

      <CondominioImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportCondominios}
      />
    </div>
  );
};