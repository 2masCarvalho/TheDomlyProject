import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Plus, FilterX, Search } from "lucide-react";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { manutencoesApi } from '@/api/ativos';
import { useAtivos } from '@/context/AtivosContext';
import { useCondominios } from '@/context/CondominiosContext'; // Importado para os filtros
import { useToast } from '@/hooks/use-toast';
import { MaintenanceForm } from '@/components/MaintenanceForm/MaintenanceForm';

export const MaintenancePage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { ativos, loading: ativosLoading } = useAtivos();
    const { condominios } = useCondominios();

    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

    // ESTADOS DOS FILTROS
    const [filterCondo, setFilterCondo] = useState<string>('all');
    const [filterAtivo, setFilterAtivo] = useState<string>('all');
    const [filterEstado, setFilterEstado] = useState<string>('all');
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');

    const loadMaintenances = async () => {
        try {
            setLoading(true);
            const data = await manutencoesApi.getAllMaintenances();
            setMaintenances(data);
        } catch (error: any) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMaintenances(); }, []);

    // LÓGICA DE FILTRAGEM (Client-side para performance imediata)
    const filteredMaintenances = useMemo(() => {
        return maintenances.filter(m => {
            const matchCondo = filterCondo === 'all' || m.ativos?.id_condominio?.toString() === filterCondo;
            const matchAtivo = filterAtivo === 'all' || m.id_ativo?.toString() === filterAtivo;
            const matchEstado = filterEstado === 'all' || m.estado === filterEstado;
            const matchMin = minPrice === '' || (m.custo || 0) >= parseFloat(minPrice);
            const matchMax = maxPrice === '' || (m.custo || 0) <= parseFloat(maxPrice);

            return matchCondo && matchAtivo && matchEstado && matchMin && matchMax;
        });
    }, [maintenances, filterCondo, filterAtivo, filterEstado, minPrice, maxPrice]);

    const resetFilters = () => {
        setFilterCondo('all');
        setFilterAtivo('all');
        setFilterEstado('all');
        setMinPrice('');
        setMaxPrice('');
    };

    const isUrgent = (dateStr: string, estado: string) => {
        if (estado === 'concluido' || !dateStr) return false;
        const diff = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff <= 7; // Menos de 7 dias
    };

    if (loading || ativosLoading) return <LoadingSpinner />;

    return (
        <div className="p-8 space-y-6 bg-gradient-subtle min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Manutenções</h1>
                    <p className="text-muted-foreground">Gestão de intervenções técnicas e preventivas.</p>
                </div>
                <Button className="gap-2 shadow-elegant" onClick={() => { setSelectedMaintenance(null); setIsFormOpen(true); }}>
                    <Plus className="h-4 w-4" /> Registar Manutenção
                </Button>
            </div>

            {/* SECÇÃO DE FILTROS */}
            <Card className="border-none shadow-elegant bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        {/* Filtro Condomínio */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Condomínio</label>
                            <Select value={filterCondo} onValueChange={setFilterCondo}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Condomínios</SelectItem>
                                    {condominios.map(c => (
                                        <SelectItem key={c.id_comdominio} value={c.id_comdominio.toString()}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro Ativo */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Ativo / Equipamento</label>
                            <Select value={filterAtivo} onValueChange={setFilterAtivo}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Ativos</SelectItem>
                                    {ativos
                                        .filter(a => filterCondo === 'all' || a.id_condominio?.toString() === filterCondo)
                                        .map(a => (
                                            <SelectItem key={a.id_ativo} value={a.id_ativo.toString()}>{a.nome}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro Estado */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Estado</label>
                            <Select value={filterEstado} onValueChange={setFilterEstado}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Estados</SelectItem>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="concluido">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro Preço */}
                        <div className="space-y-2 col-span-1">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Intervalo de Custo (€)</label>
                            <div className="flex gap-2">
                                <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-white" />
                                <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-white" />
                            </div>
                        </div>

                        {/* Botão Reset */}
                        <Button variant="outline" onClick={resetFilters} className="gap-2">
                            <FilterX className="h-4 w-4" /> Limpar Filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* TABELA DE RESULTADOS */}
            <Card className="shadow-elegant border-none overflow-hidden">
                <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Histórico de Intervenções ({filteredMaintenances.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                {/* CORREÇÃO: O cabeçalho não deve ter key={m...} nem isUrgent */}
                                <tr>
                                    <th className="p-4">Data Conclusão</th>
                                    <th className="p-4">Ativo</th>
                                    <th className="p-4">Condomínio</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4 text-right">Custo</th>
                                    <th className="p-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaintenances.length > 0 ? (
                                    filteredMaintenances.map((m) => (
                                        <tr
                                            key={m.id_manutencao}
                                            className={`border-t transition-colors ${isUrgent(m.data_conclusao, m.estado)
                                                    ? 'bg-red-50/50 hover:bg-red-100/50 animate-pulse-subtle'
                                                    : 'hover:bg-muted/30'
                                                } cursor-pointer`}
                                            onClick={() => { setSelectedMaintenance(m); setIsFormOpen(true); }}
                                        >
                                            <td className="p-4 font-medium italic">
                                                {m.data_conclusao ? new Date(m.data_conclusao).toLocaleDateString('pt-PT') : '---'}
                                            </td>
                                            <td className="p-4">
                                                <div
                                                    className="font-semibold text-primary hover:underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/condominios/${m.ativos?.id_condominio}/ativos/${m.id_ativo}`);
                                                    }}
                                                >
                                                    {m.ativos?.nome}
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{m.ativos?.condominios?.nome || 'N/A'}</td>
                                            <td className="p-4 max-w-xs truncate font-light italic">{m.descricao}</td>
                                            <td className="p-4 font-mono text-right font-semibold">
                                                {m.custo ? `${m.custo.toFixed(2)}€` : '0.00€'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge className={m.estado === 'concluido' ? 'bg-green-500' : 'bg-yellow-500'}>
                                                    {m.estado.toUpperCase()}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-12 text-center">Sem registos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <MaintenanceForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                ativos={ativos}
                onSuccess={loadMaintenances}
                initialData={selectedMaintenance}
            />
        </div>
    );
};