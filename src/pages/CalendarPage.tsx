import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { pt } from 'date-fns/locale';
import { isSameDay, format, parseISO } from 'date-fns';
import { CalendarDays, Clock, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { manutencoesApi } from '@/api/ativos'; //
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const CalendarPage = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Carregar dados reais do backend
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await manutencoesApi.getAllMaintenances();
                setMaintenances(data);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 2. Transformar dados do backend para o formato do calendário
    const eventos = useMemo(() => {
        return maintenances.map(m => ({
            id: m.id_manutencao,
            // Converte a string ISO da BD para objeto Date
            data: m.data_conclusao ? parseISO(m.data_conclusao) : new Date(),
            tipo: m.tipo_manutencao,
            estado: m.estado,
            titulo: m.descricao || "Manutenção sem descrição",
            local: m.ativos?.nome || "Equipamento não identificado",
            condominio: m.ativos?.condominios?.nome
        }));
    }, [maintenances]);

    // 3. Filtros e Ordenação
    const eventosDoDia = eventos.filter(evento =>
        date && isSameDay(evento.data, date)
    );

    const proximosEventos = [...eventos]
        .filter(e => e.data >= new Date()) // Apenas eventos futuros ou de hoje
        .sort((a, b) => a.data.getTime() - b.data.getTime())
        .slice(0, 5); // Mostrar apenas os 5 mais próximos

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-8 space-y-6 bg-gradient-subtle min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Calendário de Atividades</h1>
                <p className="text-muted-foreground">Consulte e planeie as intervenções em todos os condomínios.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-elegant border-none bg-white/80 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Agenda Global
                            </CardTitle>
                            {date && (
                                <Badge variant="secondary" className="text-sm font-medium">
                                    {format(date, "dd 'de' MMMM", { locale: pt })}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="pb-8">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={pt}
                                className="w-full h-full flex justify-center"
                                // Adiciona um ponto visual nos dias que têm eventos
                                modifiers={{ hasEvent: (day) => eventos.some(e => isSameDay(e.data, day)) }}
                                modifiersClassNames={{
                                    hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                                }}
                                classNames={{
                                    months: "w-full",
                                    month: "w-full space-y-4",
                                    table: "w-full border-collapse",
                                    head_cell: "text-muted-foreground font-normal text-[0.9rem] w-full pb-4",
                                    cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 w-full",
                                    day: "h-14 w-14 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-all text-base relative",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground font-bold border border-primary/20",
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-elegant border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Atividades para {date ? format(date, "dd/MM/yyyy") : "o dia"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {eventosDoDia.length > 0 ? (
                                    eventosDoDia.map((evento) => (
                                        <div key={evento.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted transition-hover hover:border-primary/30">
                                            <div className="flex gap-4 items-center">
                                                <div className={`p-2 rounded-full ${evento.estado === 'pendente' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                                    }`}>
                                                    {evento.estado === 'pendente' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{evento.titulo}</p>
                                                    <p className="text-xs text-muted-foreground">{evento.local} • {evento.condominio}</p>
                                                </div>
                                            </div>
                                            <Badge className={evento.tipo === 'corretiva' ? 'bg-red-500' : 'bg-primary'}>
                                                {evento.tipo?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground italic text-sm">Não existem intervenções registadas para este dia.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-elegant border-none h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">Próximos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {proximosEventos.map((evento) => (
                                    <div
                                        key={evento.id}
                                        className="group cursor-pointer flex flex-col gap-2 p-4 border rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all"
                                        onClick={() => setDate(evento.data)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${evento.tipo === 'corretiva' ? 'border-red-200 text-red-600' : 'border-blue-200 text-blue-600'
                                                }`}>
                                                {evento.tipo}
                                            </Badge>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {format(evento.data, "dd MMM", { locale: pt })}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{evento.titulo}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Wrench className="h-3 w-3" /> {evento.local}
                                        </p>
                                    </div>
                                ))}
                                {proximosEventos.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Sem intervenções futuras planeadas.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};