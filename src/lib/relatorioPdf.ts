/**
 * Generates a downloadable PDF for a monthly report. Pure function — no DOM
 * dependencies — so it can be reused from any page. Modelled on the existing
 * jsPDF pattern in src/pages/GerarDocumentoPage.tsx (lines 57-66).
 */
import type { RelatorioMensalWithCondo } from '@/api/relatorios';
import { formatPeriodPt } from '@/api/relatorios';

const MARGIN = 18;
const LINE_HEIGHT = 5.5;
const COL_PAD = 4;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-PT');
}

export async function generateRelatorioPdf(relatorio: RelatorioMensalWithCondo): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN - 8) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeHeading = (text: string, size = 13) => {
    ensureSpace(size * 0.5 + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(text, MARGIN, y);
    y += size * 0.45 + 2;
  };

  const writeParagraph = (text: string, size = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT);
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
  };

  const writeKeyValue = (label: string, value: string) => {
    ensureSpace(LINE_HEIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, MARGIN + 50, y);
    y += LINE_HEIGHT;
  };

  const writeTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
    if (rows.length === 0) {
      writeParagraph('Sem registos.', 9);
      return;
    }
    const widths = colWidths ?? headers.map(() => contentWidth / headers.length);
    const headerHeight = 6;

    ensureSpace(headerHeight + LINE_HEIGHT * rows.length + 2);

    // header
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y - 4, contentWidth, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let x = MARGIN + COL_PAD;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += widths[i];
    });
    y += headerHeight;

    // rows
    doc.setFont('helvetica', 'normal');
    for (const row of rows) {
      ensureSpace(LINE_HEIGHT);
      let cx = MARGIN + COL_PAD;
      row.forEach((cell, i) => {
        const text = doc.splitTextToSize(cell, widths[i] - COL_PAD * 2)[0] ?? '';
        doc.text(text, cx, y);
        cx += widths[i];
      });
      y += LINE_HEIGHT;
    }
    y += 2;
  };

  // ── Cover header ───────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 41);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Domly · Relatório operacional', MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Gerado a ${formatDate(relatorio.generated_at)}`, MARGIN, 19);
  doc.setTextColor(20, 20, 20);
  y = 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(relatorio.condominio?.nome ?? 'Condomínio', MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(formatPeriodPt(relatorio.ano, relatorio.mes), MARGIN, y);
  doc.setTextColor(20, 20, 20);
  y += 8;

  // ── Executive summary ──────────────────────────────────────────────────────
  if (relatorio.summary_md) {
    writeHeading('Resumo executivo');
    const paragraphs = relatorio.summary_md
      .split(/\n{2,}/)
      .map((p) => p.replace(/[*_`#]/g, '').trim())
      .filter(Boolean);
    for (const p of paragraphs) {
      writeParagraph(p);
      y += 1;
    }
    y += 3;
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  writeHeading('Indicadores principais');
  const oc = relatorio.data_json?.ocorrencias;
  const tr = relatorio.data_json?.trabalhos;
  const mn = relatorio.data_json?.manutencoes;
  const at = relatorio.data_json?.ativos;
  writeKeyValue('Ocorrências reportadas', String(oc?.opened ?? 0));
  writeKeyValue('Ocorrências resolvidas', String(oc?.resolved ?? 0));
  writeKeyValue('Em aberto no fim do mês', String(oc?.still_open_at_end ?? 0));
  writeKeyValue('Trabalhos concluídos', String(tr?.concluded ?? 0));
  writeKeyValue('Investimento em manutenção', formatCurrency(mn?.total_cost ?? 0));
  writeKeyValue('Ativos não conformes', String(at?.out_of_compliance ?? 0));
  writeKeyValue('Ativos a expirar no próximo mês', String(at?.expiring_next_month ?? 0));
  y += 4;

  // ── Ocorrências breakdown ──────────────────────────────────────────────────
  if (oc && Object.keys(oc.by_categoria ?? {}).length > 0) {
    writeHeading('Ocorrências por categoria', 11);
    const rows = Object.entries(oc.by_categoria).map(([k, v]) => [k, String(v)]);
    writeTable(['Categoria', 'Total'], rows, [contentWidth * 0.7, contentWidth * 0.3]);
  }

  // ── Top recent ocorrências ─────────────────────────────────────────────────
  if (oc && oc.top_recent && oc.top_recent.length > 0) {
    writeHeading('Ocorrências mais recentes', 11);
    const rows = oc.top_recent.map((o) => [
      o.titulo,
      o.categoria,
      o.prioridade,
      o.estado,
    ]);
    writeTable(
      ['Título', 'Categoria', 'Prioridade', 'Estado'],
      rows,
      [contentWidth * 0.45, contentWidth * 0.2, contentWidth * 0.17, contentWidth * 0.18],
    );
  }

  // ── Ativos expiring ────────────────────────────────────────────────────────
  if (at && at.expiring_list && at.expiring_list.length > 0) {
    writeHeading('Ativos a expirar (próximos 60 dias)', 11);
    const rows = at.expiring_list.map((a) => [
      a.nome,
      a.tipo_ativo ?? '—',
      formatDate(a.data_expiracao),
    ]);
    writeTable(
      ['Ativo', 'Tipo', 'Expira a'],
      rows,
      [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25],
    );
  }

  // ── Footer with page numbers ───────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - MARGIN,
      pageHeight - 8,
      { align: 'right' },
    );
    doc.text('Domly', MARGIN, pageHeight - 8);
  }

  return doc.output('blob');
}
