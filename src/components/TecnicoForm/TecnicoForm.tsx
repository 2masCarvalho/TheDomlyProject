import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tecnico, CreateTecnicoData } from '@/api/tecnicos';
import { X, Plus } from 'lucide-react';

const ESPECIALIDADES = ['canalização', 'eletricidade', 'serralharia', 'pintura', 'avac', 'geral'];

const tecnicoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  zona: z.string().optional().or(z.literal('')),
  estado_disponibilidade: z.enum(['disponivel', 'ocupado', 'indisponivel']).default('disponivel'),
});

type TecnicoFormValues = z.infer<typeof tecnicoSchema>;

interface TecnicoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTecnicoData) => Promise<void>;
  initialData?: Partial<Tecnico> | null;
}

export const TecnicoForm: React.FC<TecnicoFormProps> = ({ open, onOpenChange, onSubmit, initialData }) => {
  const [especialidades, setEspecialidades] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<TecnicoFormValues>({
    resolver: zodResolver(tecnicoSchema),
    defaultValues: { estado_disponibilidade: 'disponivel' },
  });

  const disponibilidade = watch('estado_disponibilidade');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          nome: initialData.nome || '',
          email: initialData.email || '',
          telefone: initialData.telefone || '',
          zona: initialData.zona || '',
          estado_disponibilidade: initialData.estado_disponibilidade || 'disponivel',
        });
        setEspecialidades(initialData.especialidades || []);
      } else {
        reset({ nome: '', email: '', telefone: '', zona: '', estado_disponibilidade: 'disponivel' });
        setEspecialidades([]);
      }
    }
  }, [initialData, open, reset]);

  const toggleEspecialidade = (esp: string) => {
    setEspecialidades((prev) =>
      prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]
    );
  };

  const handleFormSubmit = async (data: TecnicoFormValues) => {
    try {
      await onSubmit({ ...data, especialidades });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zona">Zona / Localização</Label>
              <Input id="zona" {...register('zona')} placeholder="Ex: Lisboa Norte" />
            </div>
            <div className="space-y-2">
              <Label>Disponibilidade</Label>
              <Select value={disponibilidade} onValueChange={(v) => setValue('estado_disponibilidade', v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((esp) => (
                <Badge
                  key={esp}
                  variant={especialidades.includes(esp) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleEspecialidade(esp)}
                >
                  {especialidades.includes(esp) ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  {esp}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A guardar...' : 'Guardar Técnico'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
