import React from 'react';
import { Ativo, getExpiryStatus } from '@/api/ativos';
import { getRuleForType } from '@/config/assetMaintenanceRules';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Euro, MapPin, AlertTriangle, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface AtivosListProps {
  ativos: Ativo[];
  onEdit: (ativo: Ativo) => void;
  onDelete: (ativo: Ativo) => void;
}

const estadoColors: Record<string, string> = {
  excelente: 'bg-green-500/10 text-green-500 border-green-500/20',
  bom: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  regular: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  mau: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const ExpiryIndicator: React.FC<{ ativo: Ativo }> = ({ ativo }) => {
  const status = getExpiryStatus(ativo.data_expiracao, ativo.data_proxima_manutencao);
  if (!status) return null;

  if (status === 'overdue') {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
        <AlertTriangle className="h-3 w-3" />
        Expirado
      </div>
    );
  }
  if (status === 'soon') {
    return (
      <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
        <Clock className="h-3 w-3" />
        Vence em breve
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
      <CheckCircle className="h-3 w-3" />
      Em dia
    </div>
  );
};

export const AtivosList: React.FC<AtivosListProps> = ({ ativos, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  if (ativos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum ativo encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ativos.map((ativo) => {
        const expiryStatus = getExpiryStatus(ativo.data_expiracao, ativo.data_proxima_manutencao);
        const cardBorder = expiryStatus === 'overdue'
          ? 'border-red-300 bg-red-50/30'
          : expiryStatus === 'soon'
          ? 'border-orange-300 bg-orange-50/20'
          : '';
        const tipoLabel = ativo.tipo_ativo
          ? (getRuleForType(ativo.tipo_ativo)?.label || ativo.tipo_ativo)
          : null;

        return (
          <Card key={ativo.id_ativo} className={`hover:shadow-lg transition-shadow ${cardBorder}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{ativo.nome}</CardTitle>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={ativo.estado ? estadoColors[ativo.estado] : ''}>
                    {ativo.estado || 'Sem estado'}
                  </Badge>
                  {tipoLabel && (
                    <Badge variant="secondary" className="text-xs">
                      {tipoLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{ativo.categoria}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {ativo.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ativo.descricao}
                </p>
              )}
              {ativo.valor !== undefined && ativo.valor !== null && (
                <p className="text-sm flex items-center gap-1">
                  <Euro className="h-3 w-3" />
                  {Number(ativo.valor).toFixed(2)}
                </p>
              )}
              {ativo.localizacao && (
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ativo.localizacao}
                </p>
              )}
              {ativo.data_proxima_manutencao && (
                <p className="text-sm flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Próx. manutenção: {new Date(ativo.data_proxima_manutencao).toLocaleDateString('pt-PT')}
                </p>
              )}
              <ExpiryIndicator ativo={ativo} />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/condominios/${id}/ativos/${ativo.id_ativo}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Detalhes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(ativo)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(ativo)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
