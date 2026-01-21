import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { condominioSchema, CondominioFormData } from './validation';
import { Condominio, condominiosApi } from '@/api/condominios';
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
import { Loader2, Upload, X } from 'lucide-react';

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
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

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
      nif: undefined,
      iban: '',
      banco: '',
      num_fracoes: 0,
      num_pisos: 0,
      ano_construcao: undefined,
      tem_elevador: false,
      email_geral: '',
      telefone: '',
      image_url: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          ...initialData,
          iban: initialData.iban || '',
          banco: initialData.banco || '',
          email_geral: initialData.email_geral || '',
          telefone: initialData.telefone || '',
        });
        setPreviewUrl(initialData.image_url || null);
      } else {
        reset({
          nome: '', cidade: '', morada: '', codigo_postal: '', nif: undefined,
          iban: '', banco: '', num_fracoes: 0, num_pisos: 0,
          ano_construcao: undefined, tem_elevador: false,
          email_geral: '', telefone: '', image_url: '',
        });
        setPreviewUrl(null);
      }
    }
  }, [initialData, open, reset]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      try {
        setUploading(true);
        const url = await condominiosApi.uploadImage(file);
        setValue('image_url', url, { shouldValidate: true });
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setValue('image_url', '');
  };

  const handleFormSubmit = async (data: CondominioFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("❌ [Form] Erro ao enviar:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Condomínio' : 'Novo Condomínio'}</DialogTitle>
          <DialogDescription>Todos os campos com * são de preenchimento obrigatório.</DialogDescription>
        </DialogHeader>

        {/* handleSubmit configurado para logar erros se o botão não funcionar */}
        <form onSubmit={handleSubmit(handleFormSubmit, (err) => console.log("⚠️ Erros:", err))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Imagem (Opcional)</Label>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade <span className="text-destructive">*</span></Label>
              <Input id="cidade" {...register('cidade')} />
              {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Código Postal <span className="text-destructive">*</span></Label>
              <Input id="codigo_postal" {...register('codigo_postal')} />
              {errors.codigo_postal && <p className="text-xs text-destructive">{errors.codigo_postal.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="morada">Morada <span className="text-destructive">*</span></Label>
            <Input id="morada" {...register('morada')} />
            {errors.morada && <p className="text-xs text-destructive">{errors.morada.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nif">NIF <span className="text-destructive">*</span></Label>
              <Input type="number" {...register('nif', { valueAsNumber: true })} />
              {errors.nif && <p className="text-xs text-destructive">{errors.nif.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone <span className="text-destructive">*</span></Label>
              <Input id="telefone" {...register('telefone')} />
              {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN <span className="text-destructive">*</span></Label>
              <Input id="iban" {...register('iban')} placeholder="PT50..." />
              {errors.iban && <p className="text-xs text-destructive">{errors.iban.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="banco">Banco <span className="text-destructive">*</span></Label>
              <Input id="banco" {...register('banco')} />
              {errors.banco && <p className="text-xs text-destructive">{errors.banco.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Frações <span className="text-destructive">*</span></Label>
              <Input type="number" {...register('num_fracoes', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Pisos <span className="text-destructive">*</span></Label>
              <Input type="number" {...register('num_pisos', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Ano <span className="text-destructive">*</span></Label>
              <Input type="number" {...register('ano_construcao', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_geral">Email <span className="text-destructive">*</span></Label>
            <Input type="email" {...register('email_geral')} />
            {errors.email_geral && <p className="text-xs text-destructive">{errors.email_geral.message}</p>}
          </div>

          <div className="flex items-center space-x-2 py-2">
            <input type="checkbox" id="tem_elevador" className="h-4 w-4 rounded" {...register('tem_elevador')} />
            <Label htmlFor="tem_elevador">Tem elevador</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};