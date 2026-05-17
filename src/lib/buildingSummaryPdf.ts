/**
 * Generates a detailed PDF for one condomínio, used by the chatbot's
 * `request_building_pdf` action. Pure function — pulls data via supabase
 * (RLS-scoped to the caller) and returns a Blob. Modelled after the layout
 * primitives in src/lib/relatorioPdf.ts.
 */
import { supabase } from '@/supabase-client';
import type { Ativo } from '@/api/ativos';
import type { Ocorrencia } from '@/api/ocorrencias';
import type { Trabalho } from '@/api/trabalhos';
import type { Condominio } from '@/api/condominios';

const MARGIN = 18;
const LINE_HEIGHT = 5.5;
const COL_PAD = 4;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-PT');
}

function expiryStatusLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(iso);
  const diff = Math.round((exp.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return ` (atrasada ${Math.abs(diff)}d)`;
  if (diff <= 30) return ` (em ${diff}d)`;
  return '';
}

interface FetchedBundle {
  condo: Condominio;
  ativos: Ativo[];
  ocorrencias: Ocorrencia[];
  trabalhos: Trabalho[];
}

async function fetchBundle(condoId: number): Promise<FetchedBundle> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const since = sixtyDaysAgo.toISOString();

  const [condoResp, ativosResp, ocorrenciasResp, trabalhosResp] = await Promise.all([
    supabase.from('condominios').select('*').eq('id_comdominio', condoId).maybeSingle(),
    supabase
      .from('ativos')
      .select('*')
      .eq('id_condominio', condoId)
      .order('data_expiracao', { ascending: true, nullsFirst: false }),
    supabase
      .from('ocorrencias')
      .select('*')
      .eq('id_condominio', condoId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('trabalhos_manutencao')
      .select('*')
      .eq('id_condominio', condoId)
      .not('estado', 'in', '("concluido","cancelado")')
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  if (condoResp.error) throw condoResp.error;
  if (!condoResp.data) throw new Error('Condomínio não encontrado ou sem permissão.');
  if (ativosResp.error) throw ativosResp.error;
  if (ocorrenciasResp.error) throw ocorrenciasResp.error;
  if (trabalhosResp.error) throw trabalhosResp.error;

  return {
    condo: condoResp.data as Condominio,
    ativos: (ativosResp.data ?? []) as Ativo[],
    ocorrencias: (ocorrenciasResp.data ?? []) as Ocorrencia[],
    trabalhos: (trabalhosResp.data ?? []) as Trabalho[],
  };
}

export async function generateBuildingSummaryPdf(condoId: number): Promise<{
  blob: Blob;
  fileName: string;
  condoName: string;
}> {
  const bundle = await fetchBundle(condoId);
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
    ensureSpace(size * 0.5 + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, MARGIN, y);
    y += size * 0.45 + 2;
  };

  const writeKeyValue = (label: string, value: string | number | undefined | null) => {
    if (value === null || value === undefined || value === '') return;
    ensureSpace(LINE_HEIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const text = String(value);
    doc.text(doc.splitTextToSize(text, contentWidth - 55)[0] ?? text, MARGIN + 55, y);
    y += LINE_HEIGHT;
  };

  const writeTable = (headers: string[], rows: string[][], colWidths: number[]) => {
    if (rows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      ensureSpace(LINE_HEIGHT);
      doc.text('Sem registos.', MARGIN, y);
      doc.setTextColor(20, 20, 20);
      y += LINE_HEIGHT + 2;
      return;
    }
    const headerHeight = 6;
    ensureSpace(headerHeight + LINE_HEIGHT * Math.min(rows.length, 3));

    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y - 4, contentWidth, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    let x = MARGIN + COL_PAD;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });
    y += headerHeight;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    for (const row of rows) {
      ensureSpace(LINE_HEIGHT);
      let cx = MARGIN + COL_PAD;
      row.forEach((cell, i) => {
        const text = doc.splitTextToSize(cell, colWidths[i] - COL_PAD * 2)[0] ?? '';
        doc.text(text, cx, y);
        cx += colWidths[i];
      });
      y += LINE_HEIGHT;
    }
    y += 3;
  };

  // ── Cover header ───────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 41);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Domly · Ficha do edifício', MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Gerado a ${new Date().toLocaleDateString('pt-PT')}`, MARGIN, 19);
  doc.setTextColor(20, 20, 20);
  y = 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(bundle.condo.nome, MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  const morada = [bundle.condo.morada, bundle.condo.codigo_postal, bundle.condo.cidade]
    .filter(Boolean)
    .join(', ');
  doc.text(morada || 'Sem morada registada', MARGIN, y);
  doc.setTextColor(20, 20, 20);
  y += 10;

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredCount = bundle.ativos.filter((a) => {
    if (!a.data_expiracao) return false;
    return new Date(a.data_expiracao) < today;
  }).length;
  const expiringSoonCount = bundle.ativos.filter((a) => {
    if (!a.data_expiracao) return false;
    const d = new Date(a.data_expiracao);
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    return diff >= 0 && diff <= 30;
  }).length;
  const openOcorrencias = bundle.ocorrencias.filter(
    (o) => !['resolvida', 'fechada'].includes(o.estado),
  ).length;

  writeHeading('Indicadores');
  writeKeyValue('Ativos registados', bundle.ativos.length);
  writeKeyValue('Ativos com licença expirada', expiredCount);
  writeKeyValue('Ativos a expirar (30 dias)', expiringSoonCount);
  writeKeyValue('Ocorrências em aberto (60d)', openOcorrencias);
  writeKeyValue('Trabalhos abertos', bundle.trabalhos.length);
  y += 3;

  // ── Building details ───────────────────────────────────────────────────────
  writeHeading('Dados do edifício');
  writeKeyValue('NIF', bundle.condo.nif);
  writeKeyValue('Email geral', bundle.condo.email_geral);
  writeKeyValue('Telefone', bundle.condo.telefone);
  writeKeyValue('Número de frações', bundle.condo.num_fracoes);
  writeKeyValue('Número de pisos', bundle.condo.num_pisos);
  writeKeyValue('Ano de construção', bundle.condo.ano_construcao);
  writeKeyValue('Elevador', bundle.condo.tem_elevador ? 'Sim' : 'Não');
  writeKeyValue('Administração externa', bundle.condo.admin_externa ? 'Sim' : 'Não');
  writeKeyValue('Apólice de seguro', bundle.condo.apolice_seguro);
  writeKeyValue('Companhia de seguro', bundle.condo.companhia_seguro);
  writeKeyValue('IBAN', bundle.condo.iban);
  writeKeyValue('Banco', bundle.condo.banco);
  y += 3;

  // ── Ativos table ───────────────────────────────────────────────────────────
  writeHeading('Ativos', 11);
  const ativoRows = bundle.ativos.map((a) => [
    a.nome ?? '—',
    a.tipo_ativo ?? a.categoria ?? '—',
    a.estado_licenca ?? '—',
    `${formatDate(a.data_expiracao)}${expiryStatusLabel(a.data_expiracao)}`,
  ]);
  writeTable(
    ['Nome', 'Tipo', 'Estado licença', 'Expira'],
    ativoRows,
    [contentWidth * 0.34, contentWidth * 0.22, contentWidth * 0.18, contentWidth * 0.26],
  );

  // ── Ocorrências table ──────────────────────────────────────────────────────
  writeHeading('Ocorrências recentes (60 dias)', 11);
  const ocorrenciaRows = bundle.ocorrencias.map((o) => [
    o.titulo ?? '—',
    o.categoria ?? '—',
    o.prioridade ?? '—',
    o.estado ?? '—',
    formatDate(o.created_at),
  ]);
  writeTable(
    ['Título', 'Categoria', 'Prioridade', 'Estado', 'Aberta'],
    ocorrenciaRows,
    [
      contentWidth * 0.34,
      contentWidth * 0.18,
      contentWidth * 0.13,
      contentWidth * 0.17,
      contentWidth * 0.18,
    ],
  );

  // ── Trabalhos table ────────────────────────────────────────────────────────
  writeHeading('Trabalhos em aberto', 11);
  const trabalhoRows = bundle.trabalhos.map((t) => [
    t.titulo ?? '—',
    t.categoria ?? '—',
    t.urgencia ?? '—',
    t.estado ?? '—',
    formatDate(t.created_at),
  ]);
  writeTable(
    ['Título', 'Categoria', 'Urgência', 'Estado', 'Aberto'],
    trabalhoRows,
    [
      contentWidth * 0.34,
      contentWidth * 0.18,
      contentWidth * 0.13,
      contentWidth * 0.17,
      contentWidth * 0.18,
    ],
  );

  // ── Footer ─────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - MARGIN, pageHeight - 8, {
      align: 'right',
    });
    doc.text('Domly', MARGIN, pageHeight - 8);
  }

  const safeName = bundle.condo.nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'edificio';
  const fileName = `edificio-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return {
    blob: doc.output('blob'),
    fileName,
    condoName: bundle.condo.nome,
  };
}
