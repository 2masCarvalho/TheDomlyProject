import React, { useState } from 'react';
import { Building2, ClipboardList, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { OcorrenciaForm } from '@/components/OcorrenciaForm/OcorrenciaForm';
import type { CreateOcorrenciaData } from '@/api/ocorrencias';
import { useToast } from '@/hooks/use-toast';

export const PortalResidentePage: React.FC = () => {
  const { profile, residentMembership, roleLoading } = useAuth();
  const { createOcorrencia } = useOcorrencias();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (data: CreateOcorrenciaData) => {
    await createOcorrencia(data);
    setFormOpen(false);
    toast({
      title: 'Ocorrência registada',
      description: 'O gestor do condomínio foi notificado.',
    });
  };

  if (roleLoading || !residentMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">A carregar...</span>
        </div>
      </div>
    );
  }

  const condo = residentMembership.condominio;
  const firstName = profile?.primeiro_nome ?? '';

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-slide-in-left">
          <p className="text-sm text-slate-500">
            {firstName ? `Olá, ${firstName}` : 'Bem-vindo'}
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Portal do residente
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{condo.nome}</span>
          </div>
        </div>

        {/* Primary CTA card */}
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-8 animate-slide-in-right">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100/70 ring-1 ring-blue-200 flex-shrink-0">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">Reportar uma ocorrência</h2>
              <p className="text-sm text-slate-500 mt-1">
                Algo precisa de atenção no seu condomínio? Reporte uma ocorrência e o gestor será notificado imediatamente.
              </p>
              <Button
                size="lg"
                className="mt-5 gap-2"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Reportar ocorrência
              </Button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs text-slate-400 text-center">
          Pode reportar problemas estruturais, de canalização, eletricidade, elevador, zonas comuns ou segurança contra incêndio.
        </p>
      </div>

      <OcorrenciaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        prefillCondominioId={condo.id_comdominio}
      />
    </div>
  );
};

export default PortalResidentePage;
