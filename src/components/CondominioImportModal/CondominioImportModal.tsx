import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { CreateCondominioData } from '@/api/condominios';
import { toast } from 'sonner';

interface CondominioImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: CreateCondominioData[]) => Promise<void>;
}

export const CondominioImportModal: React.FC<CondominioImportModalProps> = ({
  open,
  onOpenChange,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CreateCondominioData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreviewData([]);

    try {
      const data = await parseFile(selectedFile);
      setPreviewData(data);
    } catch (err) {
      setError('Erro ao ler o ficheiro. Verifique se o formato está correto.');
      console.error(err);
    }
  };

  const parseFile = (file: File): Promise<CreateCondominioData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet);

          const parsedData: CreateCondominioData[] = jsonData.map((row: any) => ({
            nome: row['Nome'] || row['nome'] || '',
            cidade: row['Cidade'] || row['cidade'] || '',
            morada: row['Morada'] || row['morada'] || '',
            codigo_postal: row['Codigo Postal'] || row['codigo_postal'] || '',
            nif: Number(row['NIF'] || row['nif'] || 0)
          })).filter(item => item.nome && item.nif); // Basic validation

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleDownloadTemplate = () => {
    const ws = utils.json_to_sheet([
      {
        'Nome': 'Exemplo Condomínio',
        'Cidade': 'Lisboa',
        'Morada': 'Rua Exemplo, 123',
        'Codigo Postal': '1000-001',
        'NIF': 123456789
      }
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "template_condominios.xlsx");
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    try {
      await onImport(previewData);
      toast.success(`${previewData.length} condomínios importados com sucesso!`);
      onOpenChange(false);
      setFile(null);
      setPreviewData([]);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Condomínios</DialogTitle>
          <DialogDescription>
            Carregue um ficheiro Excel ou CSV para importar condomínios em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Descarregar Template
            </Button>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {previewData.length > 0 && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              {previewData.length} condomínios encontrados e prontos para importar.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={loading || previewData.length === 0}>
            {loading ? 'A importar...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
