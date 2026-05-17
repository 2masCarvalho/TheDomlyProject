import React, { useState, useCallback, useRef } from 'react';
import { documentosApi, type Documento } from '@/api/documentos';
import { analyzeDocument, type DocumentExtraction } from '@/lib/analyzeDocument';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileUp,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Euro,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type FileItem = {
  file: File;
  id: string;
  status: 'queued' | 'uploading' | 'analyzing' | 'done' | 'error';
  progress: string;
  docRecord?: Documento;
  extraction?: DocumentExtraction;
  error?: string;
};

interface DocumentUploadZoneProps {
  condominioId: number;
  onDocumentsProcessed: (docs: Documento[]) => void;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  condominioId,
  onDocumentsProcessed,
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles)
      .filter(f => {
        const valid = f.type === 'application/pdf' || f.type.startsWith('image/');
        if (!valid) toast({ title: 'Ficheiro ignorado', description: `${f.name} — apenas PDF e imagens`, variant: 'destructive' });
        return valid;
      })
      .filter(f => {
        if (f.size > 6 * 1024 * 1024) {
          toast({ title: 'Ficheiro muito grande', description: `${f.name} excede 6 MB`, variant: 'destructive' });
          return false;
        }
        return true;
      })
      .map(f => ({
        file: f,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: 'queued' as const,
        progress: 'Na fila',
      }));

    setFiles(prev => [...prev, ...items]);
  }, [toast]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  // Process all queued files
  const handleProcessAll = async () => {
    const queued = files.filter(f => f.status === 'queued');
    if (queued.length === 0) return;

    setIsProcessing(true);
    const processedDocs: Documento[] = [];

    for (const item of queued) {
      try {
        // Step 1: Upload to storage
        updateFile(item.id, { status: 'uploading', progress: 'A enviar ficheiro...' });
        const storagePath = await documentosApi.uploadCondominioDocumento(condominioId, item.file);

        // Step 2: Create DB record as pending
        const docRecord = await documentosApi.create({
          id_condominio: condominioId,
          nome: item.file.name,
          tipo_documento: 'outro',
          categoria: 'outro',
          url: storagePath,
          estado_processamento: 'a_processar',
        });

        updateFile(item.id, { status: 'analyzing', progress: 'A analisar com IA...', docRecord });

        // Step 3: AI analysis
        try {
          const extraction = await analyzeDocument(item.file);

          // Step 4: Update DB with extracted data
          await documentosApi.update(docRecord.id_documento, {
            tipo_documento: extraction.tipo_documento || 'outro',
            categoria: extraction.categoria || 'outro',
            resumo: extraction.resumo,
            data_expiracao: extraction.data_expiracao,
            data_inicio: extraction.data_inicio,
            valor_monetario: extraction.valor_monetario,
            entidade: extraction.entidade,
            dados_extraidos: extraction,
            estado_processamento: 'concluido',
          });

          updateFile(item.id, {
            status: 'done',
            progress: 'Concluído',
            extraction,
            docRecord: { ...docRecord, estado_processamento: 'concluido' },
          });

          processedDocs.push(docRecord);

        } catch (aiErr: any) {
          // Upload succeeded but AI failed — keep the document, mark as error
          console.error(`[upload] AI error for ${item.file.name}:`, aiErr);
          await documentosApi.update(docRecord.id_documento, {
            estado_processamento: 'erro',
            processado_em: new Date().toISOString(),
          });
          updateFile(item.id, {
            status: 'done',
            progress: 'Guardado (sem análise)',
            docRecord: { ...docRecord, estado_processamento: 'erro' },
            error: `Documento guardado. Análise IA falhou: ${aiErr?.message || 'erro desconhecido'}`,
          });
          processedDocs.push(docRecord);
        }

      } catch (err: any) {
        console.error(`[upload] Error processing ${item.file.name}:`, err);
        updateFile(item.id, {
          status: 'error',
          progress: 'Erro',
          error: err?.message || 'Não foi possível processar este ficheiro.',
        });
      }

      // Small delay between files
      await new Promise(r => setTimeout(r, 300));
    }

    setIsProcessing(false);

    if (processedDocs.length > 0) {
      onDocumentsProcessed(processedDocs);
      toast({
        title: 'Processamento concluído',
        description: `${processedDocs.length} documento${processedDocs.length > 1 ? 's' : ''} processado${processedDocs.length > 1 ? 's' : ''}.`,
      });
    }
  };

  const queuedCount = files.filter(f => f.status === 'queued').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const hasFiles = files.length > 0;

  const statusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'queued': return <FileText className="h-4 w-4 text-slate-400" />;
      case 'uploading': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'analyzing': return <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />;
      case 'done': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Drop zone ──────────────────────────────────── */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 w-full min-h-[160px] p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-blue-400 bg-blue-50/80 scale-[1.01]'
            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
          }
        `}
      >
        <div className={`p-3 rounded-xl transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
          <FileUp className={`h-6 w-6 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Arraste ficheiros ou clique para selecionar
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PDF ou imagens · máx. 6 MB por ficheiro · múltiplos ficheiros
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {isDragging && (
          <div className="absolute inset-0 rounded-xl bg-blue-400/10 flex items-center justify-center">
            <p className="text-sm font-semibold text-blue-600">Largue os ficheiros aqui</p>
          </div>
        )}
      </div>

      {/* ── File list ──────────────────────────────────── */}
      {hasFiles && (
        <div className="rounded-xl border border-slate-200/60 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-600">
              {files.length} ficheiro{files.length > 1 ? 's' : ''}
              {doneCount > 0 && <span className="text-emerald-600 ml-1">· {doneCount} processado{doneCount > 1 ? 's' : ''}</span>}
            </p>
            <div className="flex gap-2">
              {!isProcessing && queuedCount > 0 && (
                <Button size="sm" className="text-xs gap-1.5 h-7" onClick={handleProcessAll}>
                  <Sparkles className="h-3 w-3" />
                  Processar {queuedCount > 1 ? `${queuedCount} ficheiros` : 'ficheiro'}
                </Button>
              )}
              {!isProcessing && (
                <Button size="sm" variant="ghost" className="text-xs h-7 text-slate-400" onClick={() => setFiles([])}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {files.map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  {statusIcon(item.status)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(item.file.size / 1024).toFixed(0)} KB · {item.progress}
                    </p>
                  </div>

                  {/* Extraction summary badges */}
                  {item.extraction && (
                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="secondary" className="text-[9px] px-1.5">{item.extraction.tipo_documento}</Badge>
                      {item.extraction.data_expiracao && (
                        <Badge variant="outline" className="text-[9px] px-1.5 gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {item.extraction.data_expiracao}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Expand/collapse for results */}
                  {item.status === 'done' && item.extraction && (
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                      {expandedId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Error indicator */}
                  {item.error && !item.extraction && (
                    <span className="text-[10px] text-red-500 font-medium flex-shrink-0">Erro</span>
                  )}

                  {/* Remove (only if queued) */}
                  {item.status === 'queued' && (
                    <button onClick={() => removeFile(item.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Expanded extraction details */}
                {expandedId === item.id && item.extraction && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50/30">
                    <div className="rounded-lg border border-slate-200/60 bg-white p-4 space-y-3">
                      {/* Summary */}
                      {item.extraction.resumo && (
                        <p className="text-sm text-slate-700">{item.extraction.resumo}</p>
                      )}

                      {/* Extracted fields grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {item.extraction.tipo_documento && (
                          <div className="p-2 rounded-md bg-slate-50">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Tipo</p>
                            <p className="font-medium text-slate-700 capitalize">{item.extraction.tipo_documento}</p>
                          </div>
                        )}
                        {item.extraction.categoria && (
                          <div className="p-2 rounded-md bg-slate-50">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Categoria</p>
                            <p className="font-medium text-slate-700 capitalize">{item.extraction.categoria}</p>
                          </div>
                        )}
                        {item.extraction.entidade && (
                          <div className="p-2 rounded-md bg-slate-50">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Entidade</p>
                            <p className="font-medium text-slate-700 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {item.extraction.entidade}
                            </p>
                          </div>
                        )}
                        {item.extraction.valor_monetario != null && (
                          <div className="p-2 rounded-md bg-slate-50">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Valor</p>
                            <p className="font-medium text-slate-700 flex items-center gap-1">
                              <Euro className="h-3 w-3" /> {item.extraction.valor_monetario.toLocaleString('pt-PT')}€
                            </p>
                          </div>
                        )}
                        {item.extraction.data_inicio && (
                          <div className="p-2 rounded-md bg-slate-50">
                            <p className="text-slate-400 text-[10px] uppercase tracking-wider">Data início</p>
                            <p className="font-medium text-slate-700">{item.extraction.data_inicio}</p>
                          </div>
                        )}
                        {item.extraction.data_expiracao && (
                          <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200">
                            <p className="text-emerald-600 text-[10px] uppercase tracking-wider">Expira em</p>
                            <p className="font-bold text-emerald-700">{item.extraction.data_expiracao}</p>
                          </div>
                        )}
                      </div>

                      {/* Suggested alerts */}
                      {item.extraction.alertas_sugeridos && item.extraction.alertas_sugeridos.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Alertas sugeridos</p>
                          <div className="space-y-1.5">
                            {item.extraction.alertas_sugeridos.map((alerta, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-amber-50/60 border border-amber-200/60 text-xs">
                                <Calendar className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                <span className="font-medium text-amber-800">{alerta.titulo}</span>
                                <span className="text-amber-600 ml-auto flex-shrink-0">{alerta.data}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error note */}
                      {item.error && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">{item.error}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};