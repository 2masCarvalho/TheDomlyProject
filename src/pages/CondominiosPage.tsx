import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAuth } from '@/context/AuthContext';
import { Condominio } from '@/api/condominios';
import { CondominioList } from '@/components/CondominioList/CondominioList';
import { CondominioForm } from '@/components/CondominioForm/CondominioForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, LogOut, Upload } from 'lucide-react';
import { CondominioFormData } from '@/components/CondominioForm/validation';
import { CreateCondominioData } from '@/api/condominios';
import { CondominioImportModal } from '@/components/CondominioImportModal/CondominioImportModal';

export const CondominiosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    // Converter dados do formulário para o tipo obrigatório CreateCondominioData
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
      //admin_externa: data.admin_externa,
      //apolice_seguro: data.apolice_seguro,
      // companhia_seguro: data.companhia_seguro,
    };

    console.log("📦 [Page] Payload a enviar para API:", payload);

    try {
      if (selectedCondominio) {
        console.log("🔄 [Page] A atualizar condomínio ID:", selectedCondominio.id_comdominio);
        await updateCondominio(selectedCondominio.id_comdominio, payload);
      } else {
        console.log("✨ [Page] A criar novo condomínio");
        await createCondominio(payload);
      }
      console.log("✅ [Page] Operação concluída com sucesso!");
    } catch (error) {
      console.error('❌ [Page] Erro ao salvar condomínio:', error);
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

  if (!user) return <div>Necessita de autenticação.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> Meus Condomínios</h1>
        <div className="flex gap-2">
          <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Button
            variant={includeInactive ? 'secondary' : 'outline'}
            onClick={() => setIncludeInactive(!includeInactive)}
          >
            {includeInactive ? 'A mostrar desativados' : 'Mostrar desativados'}
          </Button>
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar
          </Button>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
          <Button variant="destructive" onClick={logout}><LogOut className="h-4 w-4 mr-1" /> Sair</Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <CondominioList
          condominios={filteredCondominios}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      )}

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
