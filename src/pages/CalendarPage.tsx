import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { pt } from 'date-fns/locale';
import { isSameDay, format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { CalendarDays, Clock, Wrench, CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { manutencoesApi, ativosApi } from '@/api/ativos';
import { useCondominios } from '@/context/CondominiosContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

type CalendarEvent = {
  id: string;
  data: Date;
  tipo: 'preventiva' | 'corretiva' | 'proxima_manutencao';
  estado: string;
  titulo: string;
  local: string;
  condominio?: string;
  condominioId?: number;
  ativoId?: number;
  source: 'manutencao' | 'ativo';
};

export const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { condominios } = useCondominios();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [manutData, ativosData] = await Promise.all([
          manutencoesApi.getAllMaintenances(),
          ativosApi.getAll(),
        ]);
        setMaintenances(manutData);
        setAtivos(ativosData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCondominioNome = (id?: number) => {
    if (!id) return undefined;
    return condominios.find((c) => c.id_comdominio === id)?.nome;
  };

  // Merge both data sources into unified events
  const eventos: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    // 1. Logged maintenances
    for (const m of maintenances) {
      if (!m.data_conclusao) continue;
      result.push({
        id: `m-${m.id_manutencao}`,
        data: parseISO(m.data_conclusao),
        tipo: m.tipo_manutencao || 'preventiva',
        estado: m.estado || 'concluida',
        titulo: m.descricao || 'Manutenção registada',
        local: m.ativos?.nome || 'Equipamento',
        condominio: m.ativos?.condominios?.nome,
        source: 'manutencao',
      });
    }

    // 2. Ativos with future data_proxima_manutencao (not yet logged)
    const today = new Date();
    for (const a of ativos) {
      if (!a.data_proxima_manutencao) continue;
      const nextDate = parseISO(a.data_proxima_manutencao);

      // Only show future or today — past dates are "overdue" and shown differently
      const isOverdue = isBefore(nextDate, today) && !isSameDay(nextDate, today);

      result.push({
        id: `a-${a.id_ativo}`,
        data: nextDate,
        tipo: 'proxima_manutencao',
        estado: isOverdue ? 'atrasada' : 'agendada',
        titulo: `${a.tipo_ativo ? a.tipo_ativo + ' — ' : ''}Manutenção preventiva`,
        local: a.nome,
        condominio: getCondominioNome(a.id_condominio),
        condominioId: a.id_condominio,
        ativoId: a.id_ativo,
        source: 'ativo',
      });
    }

    return result;
  }, [maintenances, ativos, condominios]);

  // Filter for selected day
  const eventosDoDia = useMemo(
    () => eventos.filter((e) => date && isSameDay(e.data, date)),
    [eventos, date],
  );

  // Next 5 upcoming events
  const proximosEventos = useMemo(() => {
    const now = new Date();
    return [...eventos]
      .filter((e) => isAfter(e.data, addDays(now, -1)))
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .slice(0, 8);
  }, [eventos]);

  // Overdue count
  const overdueCount = useMemo(
    () => eventos.filter((e) => e.estado === 'atrasada').length,
    [eventos],
  );

  const getEventIcon = (e: CalendarEvent) => {
    if (e.estado === 'atrasada') return <AlertTriangle className="h-4 w-4" />;
    if (e.estado === 'concluida') return <CheckCircle2 className="h-4 w-4" />;
    if (e.source === 'ativo') return <Package className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getEventColor = (e: CalendarEvent) => {
    if (e.estado === 'atrasada') return 'bg-red-100 text-red-600';
    if (e.estado === 'concluida') return 'bg-green-100 text-green-600';
    if (e.source === 'ativo') return 'bg-blue-100 text-blue-600';
    return 'bg-yellow-100 text-yellow-600';
  };

  const getBadgeStyle = (e: CalendarEvent) => {
    if (e.estado === 'atrasada') return 'bg-red-500';
    if (e.tipo === 'corretiva') return 'bg-red-500';
    if (e.source === 'ativo') return 'bg-blue-500';
    return 'bg-primary';
  };

  const getBadgeLabel = (e: CalendarEvent) => {
    if (e.estado === 'atrasada') return 'ATRASADA';
    if (e.source === 'ativo') return 'AGENDADA';
    return (e.tipo || 'preventiva').toUpperCase();
  };

  const handleEventClick = (e: CalendarEvent) => {
    if (e.source === 'ativo' && e.condominioId && e.ativoId) {
      navigate(`/condominios/${e.condominioId}/ativos/${e.ativoId}`);
    } else {
      setDate(e.data);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6 bg-gradient-subtle min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendário de Atividades</h1>
        <p className="text-muted-foreground">
          Consulte e planeie as intervenções em todos os condomínios.
          {overdueCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {overdueCount} manutenção{overdueCount > 1 ? 'ões' : ''} atrasada{overdueCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
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
                modifiers={{
                  hasEvent: (day) => eventos.some((e) => isSameDay(e.data, day) && e.estado !== 'atrasada'),
                  hasOverdue: (day) => eventos.some((e) => isSameDay(e.data, day) && e.estado === 'atrasada'),
                }}
                modifiersClassNames={{
                  hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
                  hasOverdue: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full",
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
                    <div
                      key={evento.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted transition-hover hover:border-primary/30 cursor-pointer"
                      onClick={() => handleEventClick(evento)}
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`p-2 rounded-full ${getEventColor(evento)}`}>
                          {getEventIcon(evento)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{evento.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {evento.local}
                            {evento.condominio && ` • ${evento.condominio}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getBadgeStyle(evento)}>
                        {getBadgeLabel(evento)}
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
                    onClick={() => handleEventClick(evento)}
                  >
                    <div className="flex justify-between items-start">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${
                          evento.estado === 'atrasada'
                            ? 'border-red-200 text-red-600'
                            : evento.source === 'ativo'
                            ? 'border-blue-200 text-blue-600'
                            : evento.tipo === 'corretiva'
                            ? 'border-red-200 text-red-600'
                            : 'border-blue-200 text-blue-600'
                        }`}
                      >
                        {getBadgeLabel(evento)}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(evento.data, "dd MMM", { locale: pt })}
                      </span>
                    </div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {evento.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {evento.source === 'ativo' ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                      {evento.local}
                      {evento.condominio && ` • ${evento.condominio}`}
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