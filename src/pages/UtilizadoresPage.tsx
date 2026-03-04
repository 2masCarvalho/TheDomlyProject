import React, { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { userProfilesApi, type UserProfile, type UserRole } from '@/api/userProfiles';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roleLabel: Record<UserRole, string> = {
  gestor: 'Gestor',
  residente: 'Residente',
  tecnico: 'Técnico',
};

export const UtilizadoresPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await userProfilesApi.list();
        setProfiles(data);
      } catch (e: any) {
        toast({ title: 'Erro', description: e?.message ?? 'Não foi possível carregar utilizadores', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [toast]);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter((p) => {
      const fullName = `${p.primeiro_nome ?? ''} ${p.ultimo_nome ?? ''}`.toLowerCase();
      return (
        fullName.includes(s) ||
        (p.empresa ?? '').toLowerCase().includes(s) ||
        (p.role ?? '').toLowerCase().includes(s) ||
        (p.id_user ?? '').toLowerCase().includes(s)
      );
    });
  }, [profiles, searchTerm]);

  const handleRoleChange = async (id_user: string, role: UserRole) => {
    try {
      setSavingUserId(id_user);
      const updated = await userProfilesApi.updateRole(id_user, role);
      setProfiles((prev) => prev.map((p) => (p.id_user === id_user ? updated : p)));
      toast({ title: 'Sucesso', description: 'Permissão atualizada' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível atualizar o role', variant: 'destructive' });
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Utilizadores
        </h1>
        <p className="text-muted-foreground text-sm">
          Gere permissões (roles) de utilizadores existentes na tua empresa.
        </p>
      </div>

      <Input
        placeholder="Pesquisar por nome, empresa, role ou id..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de utilizadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Nenhum utilizador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const displayName = `${p.primeiro_nome ?? ''} ${p.ultimo_nome ?? ''}`.trim() || '—';
                  const role = (p.role ?? 'gestor') as UserRole;
                  return (
                    <TableRow key={p.id_user}>
                      <TableCell className="font-medium">{displayName}</TableCell>
                      <TableCell>{p.empresa || '—'}</TableCell>
                      <TableCell>
                        <Select
                          value={role}
                          onValueChange={(v) => handleRoleChange(p.id_user, v as UserRole)}
                          disabled={savingUserId === p.id_user}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Selecionar role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gestor">{roleLabel.gestor}</SelectItem>
                            <SelectItem value="residente">{roleLabel.residente}</SelectItem>
                            <SelectItem value="tecnico">{roleLabel.tecnico}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {p.id_user}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

