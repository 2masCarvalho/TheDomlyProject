import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateOcorrenciaData, Ocorrencia } from '@/api/ocorrencias';
import { useCondominios } from '@/context/CondominiosContext';

const ocorrenciaSchema = z.object({
  id_condominio: z.number({ required_error: 'Selecione um condomínio' }),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional().or(z.literal('')),
  categoria: z.enum(['estrutural', 'canalização', 'eletricidade', 'elevador', 'zona_comum', 'seguranca_incendio', 'outro'], {
    required_error: 'Selecione uma categoria',
  }),
  responsabilidade: z.enum(['condominio', 'fracao'], {
    required_error: 'Selecione a responsabilidade',
  }),
  prioridade: z.enum(['critica', 'alta', 'media', 'baixa'], {
    required_error: 'Selecione a prioridade',
  }),
  reportado_por: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
});

type OcorrenciaFormData = z.infer<typeof ocorrenciaSchema>;

interface OcorrenciaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOcorrenciaData) => Promise<void>;
  initialData?: Partial<Ocorrencia> | null;
  prefillCondominioId?: number;
}

export const OcorrenciaForm: React.FC<OcorrenciaFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  prefillCondominioId,
}) => {
  const { condominios } = useCondominios();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<OcorrenciaFormData>({
    resolver: zodResolver(ocorrenciaSchema),
    defaultValues: {},
  });

  const categoria = watch('categoria');
  const responsabilidade = watch('responsabilidade');
  const prioridade = watch('prioridade');
  const condominioId = watch('id_condominio');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          id_condominio: initialData.id_condominio,
          titulo: initialData.titulo || '',
          descricao: initialData.descricao || '',
          categoria: initialData.categoria,
          responsabilidade: initialData.responsabilidade,
          prioridade: initialData.prioridade,
          reportado_por: initialData.reportado_por || '',
          notas: initialData.notas || '',
        });
      } else {
        reset({
          id_condominio: prefillCondominioId,
          titulo: '',
          descricao: '',
          reportado_por: '',
          notas: '',
        });
      }
    }
  }, [initialData, open, reset, prefillCondominioId]);

  const handleFormSubmit = async (data: OcorrenciaFormData) => {
    try {
      await onSubmit(data as CreateOcorrenciaData);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao submeter ocorrência:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Condomínio *</Label>
            <Select
              value={condominioId ? String(condominioId) : ''}
              onValueChange={(v) => setValue('id_condominio', parseInt(v), { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o condomínio" />
              </SelectTrigger>
              <SelectContent>
                {condominios.map((c) => (
                  <SelectItem key={c.id_comdominio} value={String(c.id_comdominio)}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_condominio && <p className="text-xs text-destructive">{errors.id_condominio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Resumo da ocorrência" />
            {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} rows={3} placeholder="Descreva a ocorrência em detalhe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoria || ''} onValueChange={(v) => setValue('categoria', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estrutural">Estrutural</SelectItem>
                  <SelectItem value="canalização">Canalização</SelectItem>
                  <SelectItem value="eletricidade">Eletricidade</SelectItem>
                  <SelectItem value="elevador">Elevador</SelectItem>
                  <SelectItem value="zona_comum">Zona Comum</SelectItem>
                  <SelectItem value="seguranca_incendio">Segurança Incêndio</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Responsabilidade *</Label>
              <Select value={responsabilidade || ''} onValueChange={(v) => setValue('responsabilidade', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="condominio">Condomínio</SelectItem>
                  <SelectItem value="fracao">Fração</SelectItem>
                </SelectContent>
              </Select>
              {errors.responsabilidade && <p className="text-xs text-destructive">{errors.responsabilidade.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select value={prioridade || ''} onValueChange={(v) => setValue('prioridade', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              {errors.prioridade && <p className="text-xs text-destructive">{errors.prioridade.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportado_por">Reportado por</Label>
              <Input id="reportado_por" {...register('reportado_por')} placeholder="Nome ou nº de fração" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionais</Label>
            <Textarea id="notas" {...register('notas')} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar Ocorrência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
