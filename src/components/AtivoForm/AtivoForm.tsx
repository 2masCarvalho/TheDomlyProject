import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtivoFormData, ativoFormSchema } from './validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AtivoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AtivoFormData) => Promise<void>;
  initialData?: Partial<AtivoFormData> | null;
}

export const AtivoForm: React.FC<AtivoFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AtivoFormData>({
    resolver: zodResolver(ativoFormSchema),
    defaultValues: initialData || {},
  });

  const estado = watch('estado');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          nome: '', categoria: '', marca: '', modelo: '',
          num_serie: undefined, estado: undefined as any,
          descricao: '', valor: undefined, data_instalacao: '',
          localizacao: '',
        });
      }
    }
  }, [initialData, open, reset]);

  const handleFormSubmit = async (data: AtivoFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao submeter:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Ativo' : 'Novo Ativo'}</DialogTitle>
        </DialogHeader>
        
        {/* Adicionado log de erros para ajudar no desenvolvimento */}
        <form onSubmit={handleSubmit(handleFormSubmit, (err) => console.log("Erros Ativos:", err))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Input id="categoria" {...register('categoria')} placeholder="Ex: Elevador" />
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input id="marca" {...register('marca')} />
              {errors.marca && <p className="text-xs text-destructive">{errors.marca.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input id="modelo" {...register('modelo')} />
              {errors.modelo && <p className="text-xs text-destructive">{errors.modelo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_serie">Nº Série *</Label>
              <Input 
                type="number" 
                {...register('num_serie', { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) 
                })} 
              />
              {errors.num_serie && <p className="text-xs text-destructive">{errors.num_serie.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={estado} onValueChange={(v) => setValue('estado', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excelente">Excelente</SelectItem>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="mau">Mau</SelectItem>
                </SelectContent>
              </Select>
              {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea id="descricao" {...register('descricao')} />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (€) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register('valor', { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === "" ? undefined : parseFloat(v)
                })}
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_instalacao">Data Instalação *</Label>
              <Input type="date" {...register('data_instalacao')} />
              {errors.data_instalacao && <p className="text-xs text-destructive">{errors.data_instalacao.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="ultima_manutencao">Última Manutenção (Opcional)</Label>
    <Input type="date" {...register('ultima_manutencao')} />
  </div>

  <div className="space-y-2">
    <Label htmlFor="frequencia_manutencao">Frequência (Meses) *</Label>
    <Input 
      type="number" 
      {...register('frequencia_manutencao', { 
        valueAsNumber: true,
        setValueAs: (v) => v === "" ? 6 : parseInt(v, 10) 
      })} 
    />
    {errors.frequencia_manutencao && (
      <p className="text-xs text-destructive">{errors.frequencia_manutencao.message}</p>
    )}
  </div>
</div>

<div className="space-y-2">
  <Label htmlFor="localizacao">Localização (Opcional)</Label>
  <Input id="localizacao" {...register('localizacao')} />
</div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar Ativo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};