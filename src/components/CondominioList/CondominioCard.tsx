import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Condominio } from '@/api/condominios';
import { ativosApi } from '@/api/ativos';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Hash, Pencil, Trash2, Package, ArrowRight, Mail, Users } from 'lucide-react';

interface CondominioCardProps {
  condominio: Condominio;
  onEdit: (condominio: Condominio) => void;
  onDelete: (condominio: Condominio) => void;
}

export const CondominioCard: React.FC<CondominioCardProps> = ({ condominio, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [ativosCount, setAtivosCount] = useState(0);

  useEffect(() => {
    const loadAtivos = async () => {
      try {
        const ativos = await ativosApi.getByCondominio(condominio.id_comdominio);
        setAtivosCount(ativos.length);
      } catch (error) {
        console.error('Erro ao carregar ativos', error);
      }
    };
    loadAtivos();
  }, [condominio.id_comdominio]);

  return (
    <Card className="h-full hover:shadow-hover transition-all duration-300">
      <CardHeader>
        {condominio.image_url && (
          <div className="w-full h-48 mb-4 rounded-md overflow-hidden">
            <img
              src={condominio.image_url}
              alt={condominio.nome}
              className="w-full h-full object-cover"
            />
          </div>
        )}
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
        {condominio.num_fracoes !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {condominio.num_fracoes} frações
          </div>
        )}
        {condominio.email_geral && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> {condominio.email_geral}
          </div>
        )}
      </CardContent>

      <div className="px-6 pb-2">
        <Button
          variant="outline"
          className="w-full justify-between group"
          onClick={() => navigate(`/condominios/${condominio.id_comdominio}/ativos`)}
        >
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Ver Ativos ({ativosCount})
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      <CardFooter className="gap-2 pt-2">
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
