import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ChatAction } from '@/lib/chatActions';
import { generateBuildingSummaryPdf } from '@/lib/buildingSummaryPdf';

interface Props {
  actions?: ChatAction[];
}

export const ChatActionButtons: React.FC<Props> = ({ actions }) => {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!actions || actions.length === 0) return null;

  async function handleBuildingPdf(action: Extract<ChatAction, { type: 'building_pdf' }>) {
    const key = `building-${action.condo_id}`;
    setPendingId(key);
    try {
      const { blob, fileName } = await generateBuildingSummaryPdf(action.condo_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'PDF gerado', description: fileName });
    } catch (e: any) {
      console.error('[chat] PDF generation failed', e);
      toast({
        title: 'Erro a gerar PDF',
        description: e?.message ?? 'Tenta novamente.',
        variant: 'destructive',
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, idx) => {
        if (action.type === 'open_report') {
          return (
            <Link
              key={`${action.type}-${action.report_id}-${idx}`}
              to={`/relatorios/${action.report_id}`}
            >
              <Button size="sm" variant="default" className="h-8">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {action.label ?? 'Abrir relatório'}
              </Button>
            </Link>
          );
        }

        if (action.type === 'building_pdf') {
          const key = `building-${action.condo_id}`;
          const isPending = pendingId === key;
          return (
            <Button
              key={`${action.type}-${action.condo_id}-${idx}`}
              size="sm"
              variant="default"
              className="h-8"
              disabled={isPending}
              onClick={() => handleBuildingPdf(action)}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5" />
              )}
              {action.label ?? `Abrir PDF — ${action.condo_name}`}
            </Button>
          );
        }
        return null;
      })}
    </div>
  );
};
