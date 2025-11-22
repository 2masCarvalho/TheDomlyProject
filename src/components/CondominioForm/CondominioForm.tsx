import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CondominioFormData, condominioFormSchema } from "./validation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CondominioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CondominioFormData) => Promise<void>;
  initialData?: CondominioFormData;
}

export const CondominioForm: React.FC<CondominioFormProps> = ({
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
  } = useForm<CondominioFormData>({
    resolver: zodResolver(condominioFormSchema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: CondominioFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Condomínio" : "Novo Condomínio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="morada">Morada</Label>
            <Input id="morada" {...register("morada")} />
            {errors.morada && (
              <p className="text-sm text-destructive">
                {errors.morada.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="codigo_postal">Código Postal</Label>
              <Input
                id="codigo_postal"
                {...register("codigo_postal")}
                placeholder="0000-000"
              />
              {errors.codigo_postal && (
                <p className="text-sm text-destructive">
                  {errors.codigo_postal.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register("cidade")} />
              {errors.cidade && (
                <p className="text-sm text-destructive">
                  {errors.cidade.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nif">NIF</Label>
              <Input id="nif" type="text" {...register("nif")} />
              {errors.nif && (
                <p className="text-sm text-destructive">{errors.nif.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="n_fracoes">Número de Frações</Label>
              <Input
                id="n_fracoes"
                type="number"
                {...register("n_fracoes", { valueAsNumber: true })}
              />
              {errors.n_fracoes && (
                <p className="text-sm text-destructive">
                  {errors.n_fracoes.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="contacto_administrador">
              Contacto Administrador (opcional)
            </Label>
            <Input
              id="contacto_administrador"
              {...register("contacto_administrador")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
