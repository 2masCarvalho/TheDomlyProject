import React, { useEffect, useState } from 'react';
import { membershipsApi, type CondominioMembership, type InviteToken, type MembershipRole } from '@/api/memberships';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Users, Link2, Copy, Check, Trash2, UserMinus, Clock, RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface MembrosTabProps {
  condominioId: number;
}

const roleLabel = (role: string) => (role === 'tecnico' ? 'Técnico' : 'Residente');
const roleBadgeClass = (role: string) =>
  role === 'tecnico'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';

export const MembrosTab: React.FC<MembrosTabProps> = ({ condominioId }) => {
  const { toast } = useToast();

  const [members, setMembers] = useState<CondominioMembership[]>([]);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<MembershipRole>('residente');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [m, t] = await Promise.all([
        membershipsApi.getByCondominio(condominioId),
        membershipsApi.getActiveTokens(condominioId),
      ]);
      setMembers(m);
      setTokens(t);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message ?? 'Não foi possível carregar membros', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [condominioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateLink = async () => {
    setGenerating(true);
    setGeneratedLink(null);
    try {
      const token = await membershipsApi.createInviteToken(condominioId, selectedRole);
      const link = `${window.location.origin}/join/${token}`;
      setGeneratedLink(link);
      await load();
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message ?? 'Não foi possível gerar link', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await membershipsApi.revokeToken(tokenId);
      setTokens(prev => prev.filter(t => t.id !== tokenId));
      if (generatedLink) {
        const revokedToken = tokens.find(t => t.id === tokenId);
        if (revokedToken && generatedLink.includes(revokedToken.token)) {
          setGeneratedLink(null);
        }
      }
      toast({ title: 'Link revogado' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await membershipsApi.removeMember(condominioId, userId);
      setMembers(prev => prev.filter(m => m.id_user !== userId));
      toast({ title: 'Membro removido' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="py-8"><LoadingSpinner /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* ── Members list ──────────────────────────────── */}
      <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            Membros <span className="text-xs font-normal text-slate-400 ml-1">({members.length})</span>
          </h3>
          <button
            onClick={load}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Sem membros ainda</p>
            <p className="text-xs text-slate-300 mt-1">Gere um link de convite para adicionar residentes ou técnicos.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                  {(m.nome_utilizador ?? m.email_utilizador ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {m.nome_utilizador ?? m.email_utilizador ?? 'Utilizador'}
                  </p>
                  {m.email_utilizador && m.nome_utilizador && (
                    <p className="text-[11px] text-slate-400 truncate">{m.email_utilizador}</p>
                  )}
                </div>
                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${roleBadgeClass(m.role)}`}>
                  {roleLabel(m.role)}
                </Badge>
                <button
                  onClick={() => handleRemoveMember(m.id_user)}
                  className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remover membro"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Invite link generator ─────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-400" /> Gerar link de convite
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">O link é válido por 7 dias e só pode ser usado uma vez.</p>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Função do convidado</label>
              <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v as MembershipRole); setGeneratedLink(null); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residente">Residente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              className="w-full text-xs gap-1.5"
              onClick={handleGenerateLink}
              disabled={generating}
            >
              {generating ? (
                <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A gerar...</>
              ) : (
                <><Link2 className="h-3.5 w-3.5" /> Gerar link</>
              )}
            </Button>

            {generatedLink && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Link gerado</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-700 font-mono truncate flex-1">{generatedLink}</p>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-200 transition-colors text-slate-500"
                    title="Copiar"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Partilhe este link com o convidado. Expira em 7 dias.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Active tokens ──────────────────────────── */}
        {tokens.length > 0 && (
          <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[13px] font-semibold text-slate-700">
                Links ativos ({tokens.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <Clock className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{roleLabel(t.role)}</p>
                    <p className="text-[11px] text-slate-400">
                      Expira {formatDistanceToNow(new Date(t.expires_at), { addSuffix: true, locale: pt })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeToken(t.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Revogar link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
