import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCondominios } from '@/context/CondominiosContext';
import { useToast } from '@/hooks/use-toast';
import { formatPeriodPt, previousMonth, relatoriosApi } from '@/api/relatorios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a condomínio (e.g. when launching from a building detail page). */
  initialCondoId?: number;
}

function lastNMonths(n: number): { ano: number; mes: number; label: string }[] {
  const base = previousMonth();
  const out: { ano: number; mes: number; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base.ano, base.mes - 1 - i, 1);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    out.push({ ano, mes, label: formatPeriodPt(ano, mes) });
  }
  return out;
}

export const GenerateRelatorioModal: React.FC<Props> = ({ open, onOpenChange, initialCondoId }) => {
  const { condominios } = useCondominios();
  const { toast } = useToast();
  const navigate = useNavigate();

  const monthOptions = useMemo(() => lastNMonths(12), []);
  const [condoId, setCondoId] = useState<string>(initialCondoId ? String(initialCondoId) : '');
  const [periodKey, setPeriodKey] = useState<string>(`${monthOptions[0].ano}-${monthOptions[0].mes}`);
  const [generating, setGenerating] = useState(false);

  const activeCondos = useMemo(
    () => condominios.filter((c) => c.is_active !== false),
    [condominios],
  );

  async function handleGenerate() {
    if (!condoId || !periodKey) {
      toast({
        title: 'Falta seleção',
        description: 'Escolhe um condomínio e um mês.',
        variant: 'destructive',
      });
      return;
    }
    const [ano, mes] = periodKey.split('-').map(Number);
    setGenerating(true);
    try {
      const report = await relatoriosApi.generate(Number(condoId), ano, mes);
      toast({
        title: 'Relatório gerado',
        description: `${report.condominio?.nome ?? ''} · ${formatPeriodPt(ano, mes)}`,
      });
      onOpenChange(false);
      navigate(`/relatorios/${report.id_relatorio}`);
    } catch (e: any) {
      toast({
        title: 'Erro a gerar relatório',
        description: e?.message ?? 'Tenta novamente em alguns segundos.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Gerar relatório mensal
          </DialogTitle>
          <DialogDescription>
            Escolhe o condomínio e o mês. O sistema agrega ocorrências, trabalhos, manutenções e
            ativos, e a IA escreve um resumo executivo em português.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Condomínio</Label>
            <Select value={condoId} onValueChange={setCondoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar condomínio" />
              </SelectTrigger>
              <SelectContent>
                {activeCondos.map((c) => (
                  <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mês de referência</Label>
            <Select value={periodKey} onValueChange={setPeriodKey}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={`${opt.ano}-${opt.mes}`} value={`${opt.ano}-${opt.mes}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !condoId}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A gerar…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
