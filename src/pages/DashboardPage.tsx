import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Package,
    Wrench,
    AlertTriangle,
    Euro,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    Clock
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { manutencoesApi } from '@/api/ativos';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format, isAfter, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { condominios, loading: condoLoading } = useCondominios();
    const { ativos, loading: ativosLoading } = useAtivos();
    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await manutencoesApi.getAllMaintenances();
                setMaintenances(data);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // CÁLCULOS DE DADOS INTERESSANTES
    const stats = useMemo(() => {
        const totalInvestimento = maintenances.reduce((acc, m) => acc + (m.custo || 0), 0);
        const intervençõesConcluidas = maintenances.filter(m => m.estado === 'concluido').length;
        const alertasPendentes = ativos.reduce((acc, a) => acc + (a.alertas?.filter((al: any) => al.estado === 'pendente').length || 0), 0);

        // Próximas 7 dias
        const proximasUrgentes = maintenances.filter(m =>
            m.estado === 'pendente' &&
            m.data_conclusao &&
            new Date(m.data_conclusao) <= addDays(new Date(), 7)
        );

        return {
            totalInvestimento,
            intervençõesConcluidas,
            alertasPendentes,
            proximasUrgentes: proximasUrgentes.length
        };
    }, [maintenances, ativos]);

    if (loading || condoLoading || ativosLoading) return <LoadingSpinner />;

    return (
        <div className="p-8 space-y-8 bg-gradient-subtle min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Controlo</h1>
                    <p className="text-muted-foreground">Visão geral da sua conta e operações em curso.</p>
                </div>
            </div>

            {/* 1. ROW: ESTATÍSTICAS TIPO "KPI" */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-elegant">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Condomínios</p>
                            <h3 className="text-2xl font-bold">{condominios.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-elegant">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Ativos</p>
                            <h3 className="text-2xl font-bold">{ativos.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-elegant">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
                            <Euro className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Investimento Total</p>
                            <h3 className="text-2xl font-bold">{stats.totalInvestimento.toFixed(2)}€</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-elegant">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Alertas Ativos</p>
                            <h3 className="text-2xl font-bold">{stats.alertasPendentes}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. COLUNA: PRÓXIMAS MANUTENÇÕES */}
                <Card className="lg:col-span-2 border-none shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-white/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            Intervenções Planeadas
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/manutencao')}>
                            Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {maintenances
                                .filter(m => m.estado === 'pendente')
                                .slice(0, 5)
                                .map(m => (
                                    <div key={m.id_manutencao} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[50px]">
                                                <p className="text-xs uppercase font-bold text-muted-foreground">
                                                    {m.data_conclusao ? format(new Date(m.data_conclusao), 'MMM', { locale: pt }) : '---'}
                                                </p>
                                                <p className="text-lg font-bold">
                                                    {m.data_conclusao ? format(new Date(m.data_conclusao), 'dd') : '--'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{m.ativos?.nome}</p>
                                                <p className="text-xs text-muted-foreground">{m.ativos?.condominios?.nome}</p>
                                            </div>
                                        </div>
                                        <Badge variant={m.tipo_manutencao === 'corretiva' ? 'destructive' : 'secondary'}>
                                            {m.tipo_manutencao?.toUpperCase()}
                                        </Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. COLUNA: ALERTAS DE AVARIAS URGENTES */}
                <Card className="border-none shadow-elegant bg-red-50/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                            <TrendingUp className="h-5 w-5" />
                            Saúde da Infraestrutura
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                            <p className="text-xs font-bold text-red-500 uppercase mb-1">Urgência Crítica</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.proximasUrgentes}</p>
                            <p className="text-sm text-muted-foreground">Manutenções vencem nos próximos 7 dias.</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold px-1">Alertas Recentes</p>
                            {ativos
                                .flatMap(a => (a.alertas || []).map((al: any) => ({ ...al, ativoNome: a.nome })))
                                .filter(al => al.estado === 'pendente')
                                .slice(0, 3)
                                .map(al => (
                                    <div key={al.id_alerta} className="p-3 bg-white rounded-lg border text-sm flex gap-3 items-start">
                                        <div className="mt-1"><AlertTriangle className="h-4 w-4 text-orange-500" /></div>
                                        <div>
                                            <p className="font-medium">{al.titulo}</p>
                                            <p className="text-xs text-muted-foreground">{al.ativoNome}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};