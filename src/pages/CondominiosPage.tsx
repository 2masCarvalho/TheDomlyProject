import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAuth } from '@/context/AuthContext';
import { Condominio, CreateCondominioData } from '@/api/condominios';
import { CondominioList } from '@/components/CondominioList/CondominioList';
import { CondominioForm } from '@/components/CondominioForm/CondominioForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, LogOut } from 'lucide-react';
import { CondominioFormData } from '@/components/CondominioForm/validation';

export const CondominiosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    filteredCondominios,
    loading,
    searchTerm,
    setSearchTerm,
    createCondominio,
    updateCondominio,
    deleteCondominio,
  } = useCondominios();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null);

  const handleCreate = () => {
    setSelectedCondominio(null);
    setIsFormOpen(true);
  };

  const handleEdit = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setIsFormOpen(true);
  };

  const handleDelete = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: CondominioFormData) => {
    if (selectedCondominio) {
      await updateCondominio(selectedCondominio.id_condominio, data as Partial<CreateCondominioData>);
    } else {
      await createCondominio(data as CreateCondominioData);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedCondominio) {
      await deleteCondominio(selectedCondominio.id_condominio);
      setIsDeleteModalOpen(false);
      setSelectedCondominio(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestão de Condomínios</h1>
              <p className="text-sm text-muted-foreground">Gerir todos os condomínios da plataforma</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou morada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Condomínio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSpinner text="A carregar condomínios..." />
        ) : (
          <CondominioList
            condominios={filteredCondominios}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Modals */}
      <CondominioForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedCondominio}
      />

      <ConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Remover Condomínio"
        description={`Tem a certeza que pretende remover o condomínio "${selectedCondominio?.nome}"? Esta ação não pode ser revertida.`}
      />
    </div>
  );
};
