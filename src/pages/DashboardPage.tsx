import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useSearchParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Package,
    Wrench,
    AlertTriangle,
    Euro,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    CalendarClock,
    ChevronRight,
    ArrowUpRight,
    Timer,
    Flame,
    ShieldAlert,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useCondominios } from '@/context/CondominiosContext';
import { useAtivos } from '@/context/AtivosContext';
import { useOcorrencias } from '@/context/OcorrenciasContext';
import { manutencoesApi } from '@/api/ativos';
import { getExpiryStatus } from '@/api/ativos';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';

const prioridadeConfig: Record<string, { label: string; dotColor: string; textColor: string }> = {
    critica: { label: 'Crítica', dotColor: 'bg-red-500', textColor: 'text-red-600' },
    alta: { label: 'Alta', dotColor: 'bg-orange-500', textColor: 'text-orange-600' },
    media: { label: 'Média', dotColor: 'bg-amber-400', textColor: 'text-amber-600' },
    baixa: { label: 'Baixa', dotColor: 'bg-emerald-500', textColor: 'text-emerald-600' },
};

export const DashboardPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showBanner, setShowBanner] = useState(false);
    const { condominios, loading: condoLoading } = useCondominios();
    const { ativos, loading: ativosLoading } = useAtivos();
    const { ocorrencias, loading: ocorrenciasLoading } = useOcorrencias();
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

    useEffect(() => {
        if (searchParams.get('onboarding') === '1') {
            setShowBanner(true);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            setTimeout(() => confetti.reset?.(), 3500);
            setSearchParams({}, { replace: true });
        }
    }, []);

    const stats = useMemo(() => {
        const totalInvestimento = maintenances.reduce((acc, m) => acc + (m.custo || 0), 0);
        const alertasPendentes = ativos.reduce(
            (acc, a) => acc + (a.alertas?.filter((al: any) => al.estado === 'pendente').length || 0), 0
        );
        const proximasUrgentes = maintenances.filter(m =>
            m.estado === 'pendente' &&
            m.data_conclusao &&
            new Date(m.data_conclusao) <= addDays(new Date(), 7)
        );
        return { totalInvestimento, alertasPendentes, proximasUrgentes: proximasUrgentes.length };
    }, [maintenances, ativos]);

    const upcomingRenewals = useMemo(() => {
        const today = new Date();
        const in60days = addDays(today, 60);
        return ativos
            .filter((a) => {
                const dateStr = a.data_expiracao || a.data_proxima_manutencao;
                if (!dateStr) return false;
                return new Date(dateStr) <= in60days;
            })
            .sort((a, b) => {
                const da = new Date(a.data_expiracao || a.data_proxima_manutencao || '');
                const db = new Date(b.data_expiracao || b.data_proxima_manutencao || '');
                return da.getTime() - db.getTime();
            })
            .slice(0, 5);
    }, [ativos]);

    const openOcorrencias = useMemo(
        () => ocorrencias.filter((o) => !['resolvida', 'fechada'].includes(o.estado)), [ocorrencias]
    );
    const ocorrenciasByPriority = useMemo(() => ({
        critica: openOcorrencias.filter((o) => o.prioridade === 'critica').length,
        alta: openOcorrencias.filter((o) => o.prioridade === 'alta').length,
        media: openOcorrencias.filter((o) => o.prioridade === 'media').length,
        baixa: openOcorrencias.filter((o) => o.prioridade === 'baixa').length,
    }), [openOcorrencias]);

    const pendingMaintenances = useMemo(
        () => maintenances.filter(m => m.estado === 'pendente').slice(0, 5), [maintenances]
    );

    const recentAlerts = useMemo(
        () => ativos
            .flatMap(a => (a.alertas || []).map((al: any) => ({ ...al, ativoNome: a.nome })))
            .filter(al => al.estado === 'pendente')
            .slice(0, 4),
        [ativos]
    );

    if (loading || condoLoading || ativosLoading || ocorrenciasLoading) return <LoadingSpinner />;

    const kpis = [
        { label: 'Condomínios', value: condominios.length, icon: Building2, accent: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500', ringColor: 'ring-blue-500/10' },
        { label: 'Ativos', value: ativos.length, icon: Package, accent: 'from-violet-500/10 to-violet-600/5', iconColor: 'text-violet-500', ringColor: 'ring-violet-500/10' },
        { label: 'Investimento', value: `${stats.totalInvestimento.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€`, icon: Euro, accent: 'from-emerald-500/10 to-emerald-600/5', iconColor: 'text-emerald-500', ringColor: 'ring-emerald-500/10' },
        { label: 'Alertas', value: stats.alertasPendentes, icon: ShieldAlert, accent: 'from-amber-500/10 to-amber-600/5', iconColor: 'text-amber-500', ringColor: 'ring-amber-500/10', urgent: stats.alertasPendentes > 0 },
    ];

    const statusStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
        overdue: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: 'Expirado' },
        soon: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: 'Em breve' },
        ok: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'OK' },
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 min-h-screen bg-[#fafbfc]">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel de controlo</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: pt })}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 self-start sm:self-auto" onClick={() => navigate('/manutencao')}>
                    <Wrench className="h-3.5 w-3.5" /> Nova manutenção
                </Button>
            </div>

            {/* Onboarding banner */}
            {showBanner && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm font-medium">Configuração concluída! O seu painel está pronto.</span>
                    </div>
                    <button onClick={() => setShowBanner(false)} className="text-emerald-500 hover:text-emerald-700 transition-colors ml-4 text-lg leading-none">×</button>
                </div>
            )}

            {/* ── KPI Grid — 2×2 ──────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 hover:border-slate-300/80 hover:shadow-sm transition-all duration-200">
                        <div className={`absolute inset-0 bg-gradient-to-br ${kpi.accent} opacity-60 pointer-events-none`} />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{kpi.label}</p>
                                <p className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ring-1 ${kpi.ringColor} bg-white/80`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                            </div>
                        </div>
                        {kpi.urgent && (
                            <div className="relative mt-3 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                                <span className="text-[11px] font-medium text-amber-600">Requer atenção</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Urgent Strip ─────────────────────────────── */}
            {stats.proximasUrgentes > 0 && (
                <div
                    className="flex items-center gap-3 rounded-xl px-5 py-3.5 border cursor-pointer hover:shadow-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)', borderColor: '#fecaca' }}
                    onClick={() => navigate('/manutencao')}
                >
                    <div className="p-2 rounded-lg bg-red-100"><Flame className="h-4 w-4 text-red-500" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-800">
                            {stats.proximasUrgentes} manutenção{stats.proximasUrgentes > 1 ? 'ões' : ''} a vencer nos próximos 7 dias
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-red-400 flex-shrink-0" />
                </div>
            )}

            {/* ── Row 1: Intervenções + Alertas — 50/50 ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Intervenções planeadas */}
                <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-blue-50"><Wrench className="h-4 w-4 text-blue-500" /></div>
                            <h2 className="text-[15px] font-semibold text-slate-800">Intervenções planeadas</h2>
                        </div>
                        <button onClick={() => navigate('/manutencao')} className="text-xs font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                            Ver todas <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    {pendingMaintenances.length === 0 ? (
                        <div className="p-8 text-center">
                            <Timer className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Sem intervenções pendentes</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {pendingMaintenances.map((m) => {
                                const isUrgent = m.data_conclusao && new Date(m.data_conclusao) <= addDays(new Date(), 7);
                                return (
                                    <div key={m.id_manutencao} className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50 cursor-pointer ${isUrgent ? 'bg-red-50/30' : ''}`} onClick={() => navigate(`/condominios/${m.ativos?.id_condominio}/ativos/${m.id_ativo}`)}>
                                        <div className="text-center min-w-[44px]">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-0.5">{m.data_conclusao ? format(new Date(m.data_conclusao), 'MMM', { locale: pt }) : '—'}</p>
                                            <p className={`text-xl font-bold leading-none ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>{m.data_conclusao ? format(new Date(m.data_conclusao), 'dd') : '—'}</p>
                                        </div>
                                        <div className={`w-px h-9 rounded-full ${isUrgent ? 'bg-red-200' : 'bg-slate-100'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{m.ativos?.nome || 'Equipamento'}</p>
                                            <p className="text-xs text-slate-400 truncate">{m.ativos?.condominios?.nome || '—'}{m.descricao && ` · ${m.descricao}`}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex-shrink-0 ${m.tipo_manutencao === 'corretiva' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{m.tipo_manutencao || 'preventiva'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Alertas recentes */}
                <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-amber-50"><AlertTriangle className="h-4 w-4 text-amber-500" /></div>
                            <h2 className="text-[15px] font-semibold text-slate-800">Alertas recentes</h2>
                        </div>
                        <button onClick={() => navigate('/alertas')} className="text-xs font-medium text-slate-400 hover:text-amber-600 flex items-center gap-1 transition-colors">
                            Ver todos <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    {recentAlerts.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Tudo sob controlo</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {recentAlerts.map((al) => (
                                <div key={al.id_alerta} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                    <div className="mt-0.5 p-1.5 rounded-md bg-amber-50 flex-shrink-0"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{al.titulo}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{al.ativoNome}{al.data_alerta && <> · {format(new Date(al.data_alerta), 'dd MMM', { locale: pt })}</>}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-medium border-amber-200 text-amber-600 bg-amber-50/50 flex-shrink-0">{al.tipo_alerta}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 2: Ocorrências + Renovações — 50/50 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Ocorrências em aberto */}
                <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-violet-50"><ClipboardList className="h-4 w-4 text-violet-500" /></div>
                            <h2 className="text-[15px] font-semibold text-slate-800">Ocorrências em aberto</h2>
                        </div>
                        <button onClick={() => navigate('/ocorrencias')} className="text-xs font-medium text-slate-400 hover:text-violet-600 flex items-center gap-1 transition-colors">
                            Ver todas <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">{openOcorrencias.length}</span>
                            <span className="text-sm text-slate-400">em aberto</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {Object.entries(ocorrenciasByPriority).map(([pri, count]) => {
                                const cfg = prioridadeConfig[pri];
                                return (
                                    <div key={pri} className="text-center p-2.5 rounded-lg bg-slate-50/80">
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{cfg.label}</span>
                                        </div>
                                        <p className={`text-lg font-bold ${cfg.textColor}`}>{count}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="space-y-2">
                            {openOcorrencias.slice(0, 3).map((o) => (
                                <div key={o.id_ocorrencia} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/60 border border-slate-100/80 hover:border-slate-200 transition-colors cursor-pointer" onClick={() => navigate(`/ocorrencias/${o.id_ocorrencia}`)}>
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${prioridadeConfig[o.prioridade]?.dotColor || 'bg-slate-300'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{o.titulo}</p>
                                        <p className="text-[11px] text-slate-400 capitalize">{o.categoria} · {o.responsabilidade}</p>
                                    </div>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Renovações próximas */}
                <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-teal-50"><CalendarClock className="h-4 w-4 text-teal-500" /></div>
                            <h2 className="text-[15px] font-semibold text-slate-800">Renovações próximas</h2>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">60 dias</span>
                        </div>
                        <button onClick={() => navigate('/conformidade')} className="text-xs font-medium text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                            Conformidade <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    {upcomingRenewals.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Tudo em dia nos próximos 60 dias</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {upcomingRenewals.map((a) => {
                                const dateStr = a.data_expiracao || a.data_proxima_manutencao;
                                const status = getExpiryStatus(a.data_expiracao, a.data_proxima_manutencao);
                                const s = statusStyles[status || 'ok'];
                                return (
                                    <div key={a.id_ativo} className={`flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer hover:bg-slate-50/50 ${status === 'overdue' ? 'bg-red-50/20' : ''}`} onClick={() => navigate('/conformidade')}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{a.nome}</p>
                                            <p className="text-xs text-slate-400">{a.categoria}{dateStr && <> · {format(new Date(dateStr), 'dd MMM yyyy', { locale: pt })}</>}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};