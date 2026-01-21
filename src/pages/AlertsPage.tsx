import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { ativosApi } from '@/api/ativos';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  Shield 
} from "lucide-react";

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadAlerts = async () => {
    try {
      const data = await ativosApi.getAllAlerts();
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleResolve = async (id: number) => {
    await ativosApi.updateAlertStatus(id, 'resolvido');
    toast({ title: "Resolvido", description: "O alerta foi arquivado." });
    loadAlerts();
  };

  // Agrupa os alertas por Condomínio
  const pendingAlerts = alerts.filter(a => a.estado === 'pendente');
  const resolvedAlerts = alerts.filter(a => a.estado === 'resolvido');

  const grouped = pendingAlerts.reduce((acc: any, alert) => {
    const condoName = alert.ativos?.condominios?.nome || "Sem Condomínio";
    if (!acc[condoName]) acc[condoName] = [];
    acc[condoName].push(alert);
    return acc;
  }, {});

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6 bg-gradient-subtle min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Alertas</h1>
          <p className="text-muted-foreground">Monitorização centralizada de todos os condomínios.</p>
        </div>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pendingAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolvidos">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-8 mt-6">
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([condoName, condoAlerts]: any) => (
              <div key={condoName} className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                  <MapPin className="h-5 w-5" />
                  {condoName}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {condoAlerts.map((alerta: any) => (
                    <Card key={alerta.id_alerta} className="border-l-4 border-l-destructive shadow-elegant">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">{alerta.tipo_alerta}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(alerta.data_alerta).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-md mt-2">{alerta.titulo}</CardTitle>
                        <p className="text-xs font-medium text-primary uppercase tracking-tighter">
                          Ativo: {alerta.ativos?.nome}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alerta.mensagem}
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                            onClick={() => navigate(`/condominios/${alerta.ativos.id_condominio}/ativos/${alerta.id_ativo}`)}
                          >
                            Ver Ativo <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleResolve(alerta.id_alerta)}
                          >
                            <CheckCircle2 className="mr-2 h-3 w-3" /> Resolver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">Tudo sob controlo. Não existem alertas pendentes.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolvidos">
           {/* Aqui podes listar uma tabela simples com o histórico de resolvidos */}
           <Card>
             <CardContent className="p-0">
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted">
                   <tr>
                     <th className="p-4">Data</th>
                     <th className="p-4">Condomínio</th>
                     <th className="p-4">Ativo</th>
                     <th className="p-4">Título</th>
                     <th className="p-4">Estado</th>
                   </tr>
                 </thead>
                 <tbody>
                   {resolvedAlerts.map(a => (
                     <tr key={a.id_alerta} className="border-t opacity-60">
                       <td className="p-4">{new Date(a.data_alerta).toLocaleDateString()}</td>
                       <td className="p-4 font-medium">{a.ativos?.condominios?.nome}</td>
                       <td className="p-4">{a.ativos?.nome}</td>
                       <td className="p-4">{a.titulo}</td>
                       <td className="p-4"><Badge variant="secondary">Resolvido</Badge></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};