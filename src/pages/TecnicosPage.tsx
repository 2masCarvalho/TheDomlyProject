import React, { useState } from 'react';
import { useTecnicos } from '@/context/TecnicosContext';
import { Tecnico, CreateTecnicoData } from '@/api/tecnicos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TecnicoForm } from '@/components/TecnicoForm/TecnicoForm';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Users, Plus, Star, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';

const disponibilidadeConfig: Record<string, { label: string; color: string }> = {
  disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  ocupado: { label: 'Ocupado', color: 'bg-orange-100 text-orange-700' },
  indisponivel: { label: 'Indisponível', color: 'bg-gray-100 text-gray-500' },
};

export const TecnicosPage: React.FC = () => {
  const { tecnicos, loading, createTecnico, updateTecnico, deleteTecnico } = useTecnicos();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = tecnicos.filter((t) =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.especialidades || []).some((e) => e.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.zona || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => { setSelectedTecnico(null); setIsFormOpen(true); };
  const handleEdit = (t: Tecnico) => { setSelectedTecnico(t); setIsFormOpen(true); };
  const handleDelete = (t: Tecnico) => { setSelectedTecnico(t); setIsDeleteOpen(true); };

  const handleFormSubmit = async (data: CreateTecnicoData) => {
    if (selectedTecnico) {
      await updateTecnico(selectedTecnico.id_tecnico, data);
    } else {
      await createTecnico(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedTecnico) {
      await deleteTecnico(selectedTecnico.id_tecnico);
      setIsDeleteOpen(false);
      setSelectedTecnico(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Técnicos
          </h1>
          <p className="text-muted-foreground text-sm">
            {tecnicos.filter((t) => t.estado_disponibilidade === 'disponivel').length} disponíveis de {tecnicos.length}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Técnico
        </Button>
      </div>

      <Input
        placeholder="Pesquisar por nome, especialidade ou zona..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
          <Users className="h-12 w-12 mb-3 opacity-50" />
          <h3 className="text-lg font-medium">Sem técnicos registados</h3>
          <Button variant="link" onClick={handleCreate} className="mt-1">Adicionar o primeiro técnico</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tecnico) => {
            const dispCfg = disponibilidadeConfig[tecnico.estado_disponibilidade];
            return (
              <Card key={tecnico.id_tecnico} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{tecnico.nome}</p>
                      <Badge variant="secondary" className={`text-xs mt-1 ${dispCfg?.color}`}>
                        {dispCfg?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{tecnico.avaliacao_media?.toFixed(1) || '—'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    {tecnico.telefone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" /> {tecnico.telefone}
                      </p>
                    )}
                    {tecnico.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {tecnico.email}
                      </p>
                    )}
                    {tecnico.zona && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> {tecnico.zona}
                      </p>
                    )}
                    <p className="text-xs">{tecnico.total_trabalhos_concluidos} trabalhos concluídos</p>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(tecnico.especialidades || []).map((esp) => (
                      <Badge key={esp} variant="outline" className="text-xs capitalize">{esp}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(tecnico)} className="flex-1">
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(tecnico)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TecnicoForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedTecnico}
      />

      <ConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Remover Técnico"
        description={`Tem a certeza que pretende remover o técnico "${selectedTecnico?.nome}"?`}
      />
    </div>
  );
};
