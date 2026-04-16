import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Condominio } from '@/api/condominios';
import { ativosApi } from '@/api/ativos';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Hash, Pencil, Package, ArrowRight, Mail, Users, Power } from 'lucide-react';

const roleBadgeLabel: Record<string, string> = {
  residente: 'Residente',
  tecnico: 'Técnico',
};

interface CondominioCardProps {
  condominio: Condominio;
  onEdit: (condominio: Condominio) => void;
  onDeactivate: (condominio: Condominio) => void;
  onReactivate: (condominio: Condominio) => void;
}

export const CondominioCard: React.FC<CondominioCardProps> = ({ condominio, onEdit, onDeactivate, onReactivate }) => {
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
    <Card
      className={`h-full hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group ${condominio.is_active === false ? 'opacity-60' : ''}`}
      onClick={() => navigate(`/condominios/${condominio.id_comdominio}`)}
    >
      <CardHeader className="pb-3">
        {condominio.image_url && (
          <div className="w-full h-44 mb-3 rounded-lg overflow-hidden">
            <img
              src={condominio.image_url}
              alt={condominio.nome}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="flex-1 truncate">{condominio.nome}</span>
          {condominio.memberRole && (
            <Badge variant="outline" className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
              {roleBadgeLabel[condominio.memberRole] ?? condominio.memberRole}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 text-sm text-slate-500 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{condominio.morada}{condominio.cidade ? `, ${condominio.cidade}` : ''}</span>
        </div>
        {condominio.nif && (
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 flex-shrink-0" /> NIF: {condominio.nif}
          </div>
        )}
        {condominio.num_fracoes !== undefined && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 flex-shrink-0" /> {condominio.num_fracoes} frações
          </div>
        )}
        {condominio.email_geral && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{condominio.email_geral}</span>
          </div>
        )}
      </CardContent>

      <div className="px-6 pb-3">
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 text-xs font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> {ativosCount} ativo{ativosCount !== 1 ? 's' : ''}
          </span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {!condominio.memberRole && (
        <CardFooter className="gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => onEdit(condominio)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          {condominio.is_active === false ? (
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => onReactivate(condominio)}>
              <Power className="h-3.5 w-3.5 mr-1" /> Reativar
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDeactivate(condominio)}>
              <Power className="h-3.5 w-3.5 mr-1" /> Desativar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};