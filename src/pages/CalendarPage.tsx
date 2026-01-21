import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { pt } from 'date-fns/locale';
import { isSameDay, format } from 'date-fns';
import { CalendarDays, AlertCircle, Clock } from "lucide-react";

export const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Dados de exemplo (Idealmente viriam do seu AtivosContext ou API)
  const eventos = [
    { id: 1, data: new Date(2026, 0, 21), tipo: "Urgente", titulo: "Reparação Portão Garagem", local: "Bloco B" },
    { id: 2, data: new Date(2026, 0, 25), tipo: "Manutenção", titulo: "Elevador Bloco A", local: "Entrada Principal" },
    { id: 3, data: new Date(2026, 0, 28), tipo: "Inspeção", titulo: "Extintores e Segurança", local: "Pisos 0-4" },
    { id: 4, data: new Date(2026, 0, 21), tipo: "Aviso", titulo: "Limpeza de Condutas", local: "Telhado" },
  ];

  // Filtra eventos para o dia selecionado
  const eventosDoDia = eventos.filter(evento => 
    date && isSameDay(evento.data, date)
  );

  // Ordena próximos eventos por data
  const proximosEventos = [...eventos].sort((a, b) => a.data.getTime() - b.data.getTime());

  return (
    <div className="p-8 space-y-6 bg-gradient-subtle min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calendário de Atividades</h1>
        <p className="text-muted-foreground">Consulte e planeie as intervenções nos ativos do condomínio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lado Esquerdo: Calendário e Eventos do Dia */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card do Calendário (Aumentado) */}
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
                // Classes para aumentar o tamanho visual do calendário
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse",
                  head_cell: "text-muted-foreground font-normal text-[0.9rem] w-full pb-4",
                  cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 w-full",
                  day: "h-14 w-14 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-all text-base",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-bold",
                }}
              />
            </CardContent>
          </Card>

          {/* Card: O que acontece no dia selecionado */}
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
                        <div className={`p-2 rounded-full ${
  evento.tipo === 'avaria' ? 'bg-red-100 text-red-600' : 
  evento.tipo === 'manutencao' ? 'bg-blue-100 text-blue-600' : 
  'bg-gray-100 text-gray-600'
}`}>
  {/* Ícone correspondente */}
</div>
                        <div>
                          <p className="font-semibold text-sm">{evento.titulo}</p>
                          <p className="text-xs text-muted-foreground">{evento.local}</p>
                        </div>
                      </div>
                      <Badge className={evento.tipo === 'Urgente' ? 'bg-red-500' : 'bg-primary'}>
                        {evento.tipo}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground italic text-sm">Não existem eventos marcados para este dia.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Próximos Eventos (Mantido) */}
        <div className="space-y-6">
          <Card className="shadow-elegant border-none h-full">
            <CardHeader>
              <CardTitle className="text-xl">Próximos Eventos</CardTitle>
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
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {evento.tipo}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(evento.data, "dd MMM", { locale: pt })}
                      </span>
                    </div>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{evento.titulo}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {evento.local}
                    </p>
                  </div>
                ))}
                {proximosEventos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sem eventos agendados.
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