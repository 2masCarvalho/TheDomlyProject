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
import { CreateTrabalhoData } from '@/api/trabalhos';
import { useCondominios } from '@/context/CondominiosContext';

const trabalhoSchema = z.object({
  id_condominio: z.number({ required_error: 'Selecione um condomínio' }),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional().or(z.literal('')),
  categoria: z.enum(['canalização', 'eletricidade', 'serralharia', 'pintura', 'avac', 'geral'], {
    required_error: 'Selecione uma categoria',
  }),
  urgencia: z.enum(['critica', 'alta', 'media', 'baixa'], {
    required_error: 'Selecione a urgência',
  }),
});

type TrabalhoFormValues = z.infer<typeof trabalhoSchema>;

interface TrabalhoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTrabalhoData) => Promise<void>;
  prefillCondominioId?: number;
  prefillTitulo?: string;
  prefillOcorrenciaId?: number;
}

export const TrabalhoForm: React.FC<TrabalhoFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  prefillCondominioId,
  prefillTitulo,
  prefillOcorrenciaId,
}) => {
  const { condominios } = useCondominios();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<TrabalhoFormValues>({
    resolver: zodResolver(trabalhoSchema),
  });

  const categoria = watch('categoria');
  const urgencia = watch('urgencia');
  const condominioId = watch('id_condominio');

  useEffect(() => {
    if (open) {
      reset({
        id_condominio: prefillCondominioId,
        titulo: prefillTitulo || '',
        descricao: '',
      });
    }
  }, [open, reset, prefillCondominioId, prefillTitulo]);

  const handleFormSubmit = async (data: TrabalhoFormValues) => {
    try {
      await onSubmit({ ...data, id_ocorrencia: prefillOcorrenciaId });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Trabalho de Manutenção</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Condomínio *</Label>
            <Select
              value={condominioId ? String(condominioId) : ''}
              onValueChange={(v) => setValue('id_condominio', parseInt(v), { shouldValidate: true })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione o condomínio" /></SelectTrigger>
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
            <Input id="titulo" {...register('titulo')} placeholder="Ex: Reparação de canalização piso 2" />
            {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} rows={3} placeholder="Detalhes do trabalho necessário" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoria || ''} onValueChange={(v) => setValue('categoria', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="canalização">Canalização</SelectItem>
                  <SelectItem value="eletricidade">Eletricidade</SelectItem>
                  <SelectItem value="serralharia">Serralharia</SelectItem>
                  <SelectItem value="pintura">Pintura</SelectItem>
                  <SelectItem value="avac">AVAC</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Urgência *</Label>
              <Select value={urgencia || ''} onValueChange={(v) => setValue('urgencia', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              {errors.urgencia && <p className="text-xs text-destructive">{errors.urgencia.message}</p>}
            </div>
          </div>

          {prefillOcorrenciaId && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Vinculado à ocorrência #{prefillOcorrenciaId}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A criar...' : 'Criar Trabalho'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
