import React from 'react';
import { Condominio } from '@/api/condominios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CondominioListProps {
  condominios: Condominio[];
  onEdit: (condominio: Condominio) => void;
  onDelete: (condominio: Condominio) => void;
}

export const CondominioList: React.FC<CondominioListProps> = ({
  condominios,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (condominios.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum condomínio encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {condominios.map((condominio) => (
        <Card key={condominio.id_condominio} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {condominio.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{condominio.morada}</p>
            <p className="text-sm">
              <span className="font-medium">Frações:</span> {condominio.n_fracoes}
            </p>
            {condominio.contacto_administrador && (
              <p className="text-sm">
                <span className="font-medium">Contacto:</span> {condominio.contacto_administrador}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/condominios/${condominio.id_condominio}/ativos`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Ativos
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(condominio)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(condominio)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
