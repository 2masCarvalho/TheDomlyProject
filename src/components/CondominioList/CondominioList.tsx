import React from 'react';
import { Condominio } from '@/api/condominios';
import { CondominioCard } from './CondominioCard';
import { Building2 } from 'lucide-react';

interface CondominioListProps {
  condominios: Condominio[];
  onEdit: (condominio: Condominio) => void;
  onDelete: (condominio: Condominio) => void;
}

export const CondominioList: React.FC<CondominioListProps> = ({ condominios, onEdit, onDelete }) => {
  if (condominios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum condomínio encontrado</h3>
        <p className="text-muted-foreground max-w-sm">
          Comece por criar o seu primeiro condomínio clicando no botão acima.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {condominios.map((condominio) => (
        <CondominioCard key={condominio.id_comdominio} condominio={condominio} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

