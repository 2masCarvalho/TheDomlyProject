import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { documentTemplatesApi, type CreateDocumentTemplate, type DocumentTemplate } from '@/api/documentTemplates';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';

const typeOptions = [
  { value: 'aviso', label: 'Aviso' },
  { value: 'ata', label: 'Ata' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
];

export const TemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [templateType, setTemplateType] = useState('aviso');
  const [body, setBody] = useState(
    [
      'Condomínio: {{condominio.nome}}',
      'Morada: {{condominio.morada}}',
      'NIF: {{condominio.nif}}',
      '',
      'Data: {{dataHoje}}',
      '',
      'Texto:',
      '',
    ].join('\n')
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<DocumentTemplate | null>(null);

  const resetForm = () => {
    setEditing(null);
    setNome('');
    setDescricao('');
    setTemplateType('aviso');
    setBody(
      [
        'Condomínio: {{condominio.nome}}',
        'Morada: {{condominio.morada}}',
        'NIF: {{condominio.nif}}',
        '',
        'Data: {{dataHoje}}',
        '',
        'Texto:',
        '',
      ].join('\n')
    );
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentTemplatesApi.list();
      setTemplates(data);
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível carregar templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = useMemo(() => nome.trim().length > 0 && body.trim().length > 0, [nome, body]);

  const handleEdit = (t: DocumentTemplate) => {
    setEditing(t);
    setNome(t.nome);
    setDescricao(t.descricao ?? '');
    setTemplateType(t.template_type);
    setBody(t.body);
  };

  const handleSave = async () => {
    if (!canSave) return;
    const payload: CreateDocumentTemplate = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      template_type: templateType,
      body,
    };

    try {
      if (editing) {
        const updated = await documentTemplatesApi.update(editing.id, payload);
        setTemplates((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast({ title: 'Sucesso', description: 'Template atualizado' });
      } else {
        const created = await documentTemplatesApi.create(payload);
        setTemplates((prev) => [created, ...prev]);
        toast({ title: 'Sucesso', description: 'Template criado' });
      }
      resetForm();
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível guardar template', variant: 'destructive' });
    }
  };

  const requestDelete = (t: DocumentTemplate) => {
    setSelectedDelete(t);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDelete) return;
    try {
      await documentTemplatesApi.remove(selectedDelete.id);
      setTemplates((prev) => prev.filter((p) => p.id !== selectedDelete.id));
      toast({ title: 'Sucesso', description: 'Template eliminado' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível eliminar template', variant: 'destructive' });
    } finally {
      setDeleteOpen(false);
      setSelectedDelete(null);
      if (editing?.id === selectedDelete.id) resetForm();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Templates
          </h1>
          <p className="text-muted-foreground text-sm">
            Cria templates com placeholders como{' '}
            <code className="font-mono text-xs">{'{{condominio.nome}}'}</code> e{' '}
            <code className="font-mono text-xs">{'{{dataHoje}}'}</code>.
          </p>
        </div>
        <Button variant="outline" onClick={resetForm}>
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing ? 'Editar template' : 'Novo template'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Aviso de Assembleia" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Corpo</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!canSave}>
                {editing ? 'Guardar alterações' : 'Criar template'}
              </Button>
              {editing && (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates existentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem templates.</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.template_type} {t.descricao ? `• ${t.descricao}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => requestDelete(t)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Eliminar template"
        description="Tens a certeza que queres eliminar este template?"
      />
    </div>
  );
};

