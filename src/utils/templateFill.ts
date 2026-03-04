import type { Condominio } from '@/api/condominios';

export type TemplateFillContext = {
  condominio: Condominio;
  dataHoje: string; // pre-formatted
};

export function fillTemplate(body: string, ctx: TemplateFillContext): string {
  const map: Record<string, string> = {
    'condominio.nome': ctx.condominio.nome ?? '',
    'condominio.morada': ctx.condominio.morada ?? '',
    'condominio.cidade': ctx.condominio.cidade ?? '',
    'condominio.codigo_postal': ctx.condominio.codigo_postal ?? '',
    'condominio.nif': String(ctx.condominio.nif ?? ''),
    'condominio.num_fracoes': String(ctx.condominio.num_fracoes ?? ''),
    dataHoje: ctx.dataHoje ?? '',
  };

  return (body || '').replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, key: string) => {
    return map[key] ?? '';
  });
}

