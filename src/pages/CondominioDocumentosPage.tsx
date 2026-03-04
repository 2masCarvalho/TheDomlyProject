import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { documentosApi, type Documento } from '@/api/documentos';
import { useToast } from '@/hooks/use-toast';
import { useCondominios } from '@/context/CondominiosContext';

const tipoOptions = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'ata', label: 'Ata' },
  { value: 'aviso', label: 'Aviso' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'outro', label: 'Outro' },
];

const categoriaOptions = [
  { value: 'legal', label: 'Legal' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'outro', label: 'Outro' },
];

export const CondominioDocumentosPage: React.FC = () => {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const condominioId = Number(id);
  const { condominios } = useCondominios();
  const condominio = useMemo(() => condominios.find((c) => c.id_comdominio === condominioId), [condominios, condominioId]);

  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<string>('contrato');
  const [categoria, setCategoria] = useState<string>('legal');

  const load = async () => {
    try {
      setLoading(true);
      const data = await documentosApi.listByCondominio(condominioId);
      setDocs(data);
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível carregar documentos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(condominioId) || condominioId <= 0) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condominioId]);

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Falta ficheiro', description: 'Seleciona um ficheiro para upload.', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const storagePath = await documentosApi.uploadCondominioDocumento(condominioId, file);
      const created = await documentosApi.create({
        id_condominio: condominioId,
        nome: file.name,
        tipo_documento: tipo,
        categoria,
        url: storagePath,
      });
      setDocs((prev) => [created, ...prev]);
      setFile(null);
      toast({ title: 'Sucesso', description: 'Documento carregado com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível carregar o documento', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Documento) => {
    try {
      const signed = await documentosApi.getSignedDownloadUrl(doc.url, 60);
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? 'Não foi possível gerar link de download', variant: 'destructive' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Documentos do Condomínio
        </h1>
        <p className="text-muted-foreground text-sm">{condominio?.nome ?? `Condomínio #${condominioId}`}</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriaOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ficheiro</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'A carregar...' : 'Carregar documento'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Nenhum documento.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((d) => (
                  <TableRow key={d.id_documento}>
                    <TableCell className="font-medium">{d.nome}</TableCell>
                    <TableCell>{d.tipo_documento}</TableCell>
                    <TableCell>{d.categoria ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(d.data_upload || d.created_at || Date.now()).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(d)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

