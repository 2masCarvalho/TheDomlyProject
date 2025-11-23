import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { condominioSchema, CondominioFormData } from './validation';
import { Condominio } from '@/api/condominios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface CondominioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CondominioFormData) => Promise<void>;
  initialData?: Condominio | null;
  loading?: boolean;
}

export const CondominioForm: React.FC<CondominioFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CondominioFormData>({
    resolver: zodResolver(condominioSchema),
    defaultValues: {
      nome: '',
      cidade: '',
      morada: '',
      codigo_postal: '',
      nif: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('nome', initialData.nome);
      setValue('cidade', initialData.cidade);
      setValue('morada', initialData.morada);
      setValue('codigo_postal', initialData.codigo_postal);
      setValue('nif', initialData.nif);
    } else {
      reset();
    }
  }, [initialData, open, reset, setValue]);

  const handleFormSubmit = async (data: CondominioFormData) => {
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Condomínio' : 'Novo Condomínio'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Edite os dados do condomínio abaixo.'
              : 'Preencha os dados para criar um novo condomínio.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
            <Input id="nome" {...register('nome')} autoFocus />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade <span className="text-destructive">*</span></Label>
            <Input id="cidade" {...register('cidade')} />
            {errors.cidade && <p className="text-sm text-destructive">{errors.cidade.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="morada">Morada <span className="text-destructive">*</span></Label>
            <Input id="morada" {...register('morada')} />
            {errors.morada && <p className="text-sm text-destructive">{errors.morada.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_postal">Código Postal <span className="text-destructive">*</span></Label>
            <Input id="codigo_postal" {...register('codigo_postal')} />
            {errors.codigo_postal && <p className="text-sm text-destructive">{errors.codigo_postal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nif">NIF <span className="text-destructive">*</span></Label>
            <Input type="number" id="nif" {...register('nif', { valueAsNumber: true })} />
            {errors.nif && <p className="text-sm text-destructive">{errors.nif.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting || loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

