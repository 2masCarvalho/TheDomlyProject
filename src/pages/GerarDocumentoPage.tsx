import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCondominios } from '@/context/CondominiosContext';
import { documentTemplatesApi, type DocumentTemplate } from '@/api/documentTemplates';
import { fillTemplate } from '@/utils/templateFill';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { documentosApi } from '@/api/documentos';

function formatPtDate(d = new Date()) {
  return d.toLocaleDateString('pt-PT');
}

export const GerarDocumentoPage: React.FC = () => {
  const { toast } = useToast();
  const { condominios } = useCondominios();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [saveToCondo, setSaveToCondo] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const t = await documentTemplatesApi.list();
        setTemplates(t);
      } catch (e: any) {
        toast({ title: 'Erro', description: e?.message ?? 'Não foi possível carregar templates', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [toast]);

  const selectedCondo = useMemo(() => {
    const id = Number(selectedCondoId);
    return condominios.find((c) => c.id_comdominio === id) ?? null;
  }, [condominios, selectedCondoId]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId) ?? null, [templates, selectedTemplateId]);

  const filledText = useMemo(() => {
    if (!selectedCondo || !selectedTemplate) return '';
    return fillTemplate(selectedTemplate.body, { condominio: selectedCondo, dataHoje: formatPtDate() });
  }, [selectedCondo, selectedTemplate]);

  const generatePdfBlob = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const lines = doc.splitTextToSize(filledText || '', 180);
    doc.setFontSize(12);
    doc.text(lines, 15, 20);

    return doc.output('blob');
  };

  const handleGenerate = async () => {
    if (!selectedCondo || !selectedTemplate) {
      toast({ title: 'Falta seleção', description: 'Seleciona um condomínio e um template.', variant: 'destructive' });
      return;
    }
    try {
      setGenerating(true);
      const blob = await generatePdfBlob();

      const safeName = `${selectedTemplate.nome}`.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'documento';
      const fileName = `${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Optional save to condo documents
      if (saveToCondo) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        const storagePath = await documentosApi.uploadCondominioDocumento(selectedCondo.id_comdominio, file);
        await documentosApi.create({
          id_condominio: selectedCondo.id_comdominio,
          nome: fileName,
          tipo_documento: selectedTemplate.template_type || 'template',
          categoria: 'gerado',
          url: storagePath,
        });
        toast({ title: 'Sucesso', description: 'PDF gerado e guardado no condomínio.' });
      } else {
        toast({ title: 'Sucesso', description: 'PDF gerado.' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível gerar PDF', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Gerar documento (PDF)
        </h1>
        <p className="text-muted-foreground text-sm">
          Seleciona um condomínio e um template. O sistema preenche os placeholders automaticamente.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condomínio</Label>
              <Select value={selectedCondoId} onValueChange={setSelectedCondoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar condomínio" />
                </SelectTrigger>
                <SelectContent>
                  {condominios.map((c) => (
                    <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="saveToCondo"
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={saveToCondo}
              onChange={(e) => setSaveToCondo(e.target.checked)}
            />
            <Label htmlFor="saveToCondo" className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Guardar no condomínio
            </Label>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !selectedCondoId || !selectedTemplateId}>
            <Download className="h-4 w-4 mr-1" />
            {generating ? 'A gerar...' : 'Gerar PDF'}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Pré-visualização (texto)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={filledText} readOnly rows={14} />
        </CardContent>
      </Card>
    </div>
  );
};

