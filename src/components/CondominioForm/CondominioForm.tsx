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
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
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
      nif: 0,
      iban: '',
      banco: '',
      num_fracoes: 0,
      num_pisos: 0,
      ano_construcao: undefined,
      tem_elevador: false,
      email_geral: '',
      telefone: '',
      admin_externa: false,
      apolice_seguro: '',
      companhia_seguro: '',
      image_url: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('nome', initialData.nome);
      setValue('cidade', initialData.cidade);
      setValue('morada', initialData.morada);
      setValue('codigo_postal', initialData.codigo_postal);
      setValue('nif', initialData.nif);
      setValue('iban', initialData.iban || '');
      setValue('banco', initialData.banco || '');
      setValue('num_fracoes', initialData.num_fracoes);
      setValue('num_pisos', initialData.num_pisos);
      setValue('ano_construcao', initialData.ano_construcao);
      setValue('tem_elevador', initialData.tem_elevador);
      setValue('email_geral', initialData.email_geral || '');
      setValue('telefone', initialData.telefone || '');
      setValue('admin_externa', initialData.admin_externa);
      setValue('apolice_seguro', initialData.apolice_seguro || '');
      setValue('companhia_seguro', initialData.companhia_seguro || '');
      if (initialData.image_url) {
        setPreviewUrl(initialData.image_url);
        setValue('image_url', initialData.image_url);
      }
    } else {
      reset();
      setPreviewUrl(null);
      setSelectedImage(null);
    }
  }, [initialData, open, reset, setValue]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));

      try {
        setUploading(true);
        const url = await condominiosApi.uploadImage(file);
        setValue('image_url', url);
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setValue('image_url', '');
  };

  const handleFormSubmit = async (data: CondominioFormData) => {
    console.log("🚀 [Form] Dados válidos recebidos:", data);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("❌ [Form] Erro ao enviar:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit(handleFormSubmit, (errors) => console.log("⚠️ [Form] Erros de validação:", errors))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
            <Input id="nome" {...register('nome')} autoFocus />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Imagem do Condomínio</Label>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploading ? 'A carregar imagem...' : 'Selecione uma imagem (JPG, PNG)'}
                </p>
              </div>
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register('iban')} placeholder="PT50..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Input id="banco" {...register('banco')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_fracoes">Nº Frações</Label>
              <Input
                type="number"
                id="num_fracoes"
                {...register('num_fracoes', {
                  setValueAs: (v) => v === "" ? undefined : parseInt(v, 10)
                })}
              />
              {errors.num_fracoes && <p className="text-sm text-destructive">{errors.num_fracoes.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_pisos">Nº Pisos</Label>
              <Input
                type="number"
                id="num_pisos"
                {...register('num_pisos', {
                  setValueAs: (v) => v === "" ? undefined : parseInt(v, 10)
                })}
              />
              {errors.num_pisos && <p className="text-sm text-destructive">{errors.num_pisos.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano_construcao">Ano Construção</Label>
              <Input
                type="number"
                id="ano_construcao"
                {...register('ano_construcao', {
                  setValueAs: (v) => v === "" ? undefined : parseInt(v, 10)
                })}
              />
              {errors.ano_construcao && <p className="text-sm text-destructive">{errors.ano_construcao.message}</p>}
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Input type="checkbox" id="tem_elevador" className="h-4 w-4" {...register('tem_elevador')} />
              <Label htmlFor="tem_elevador">Tem Elevador?</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_geral">Email Geral</Label>
            <Input type="email" id="email_geral" {...register('email_geral')} />
            {errors.email_geral && <p className="text-sm text-destructive">{errors.email_geral.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...register('telefone')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting || loading || uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loading || uploading}>
              {isSubmitting || loading || uploading ? (
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

