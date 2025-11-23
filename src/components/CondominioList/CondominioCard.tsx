import React from 'react';
import { Condominio } from '@/api/condominios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Hash, Pencil, Trash2 } from 'lucide-react';

interface CondominioCardProps {
  condominio: Condominio;
  onEdit: (condominio: Condominio) => void;
  onDelete: (condominio: Condominio) => void;
}

export const CondominioCard: React.FC<CondominioCardProps> = ({ condominio, onEdit, onDelete }) => {
  return (
    <Card className="h-full hover:shadow-hover transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          {condominio.nome}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {condominio.morada}, {condominio.cidade}
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" /> {condominio.codigo_postal}
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4" /> NIF: {condominio.nif}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(condominio)}>
          <Pencil className="h-4 w-4 mr-1" /> Editar
        </Button>
        <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(condominio)}>
          <Trash2 className="h-4 w-4 mr-1" /> Remover
        </Button>
      </CardFooter>
    </Card>
  );
};
