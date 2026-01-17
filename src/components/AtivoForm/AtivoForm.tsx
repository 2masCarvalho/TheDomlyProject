import React from 'react';
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
  initialData?: Partial<AtivoFormData>;
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
    defaultValues: initialData,
  });

  const estado = watch('estado');

  const handleFormSubmit = async (data: AtivoFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Ativo' : 'Novo Ativo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" {...register('categoria')} placeholder="Ex: Elevador, Portão" />
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" {...register('marca')} />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" {...register('modelo')} />
            </div>
          </div>

          <div>
            <Label htmlFor="num_serie">Nº Série</Label>
            <Input type="number" id="num_serie" {...register('num_serie', { valueAsNumber: true })} />
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={estado}
              onValueChange={(value) => setValue('estado', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="mau">Mau</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-sm text-destructive">{errors.estado.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (€)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                {...register('valor', { valueAsNumber: true })}
              />
            </div>

            <div>
              <Label htmlFor="data_instalacao">Data de Instalação</Label>
              <Input id="data_instalacao" type="date" {...register('data_instalacao')} />
            </div>
          </div>

          <div>
            <Label htmlFor="localizacao">Localização</Label>
            <Input id="localizacao" {...register('localizacao')} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
