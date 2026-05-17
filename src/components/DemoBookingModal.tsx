import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const propertyTypes = [
  { id: "multi-family", label: "Edifícios Multifamiliares" },
  { id: "single-family", label: "Moradias" },
  { id: "commercial", label: "Comercial" },
  { id: "student-housing", label: "Residências de Estudantes" },
  { id: "short-term-rentals", label: "Alojamento Local" },
  { id: "other", label: "Outro" },
] as const;

const formSchema = z.object({
  firstName: z.string().trim().min(1, "O primeiro nome é obrigatório").max(50),
  lastName: z.string().trim().min(1, "O apelido é obrigatório").max(50),
  email: z.string().trim().email("Email inválido").max(255),
  companyName: z.string().trim().min(1, "O nome da empresa é obrigatório").max(100),
  unitsManaged: z.string().min(1, "Selecione o número de unidades"),
  propertyTypes: z.array(z.string()).min(1, "Selecione pelo menos um tipo de propriedade"),
  aiFeature: z.string().min(1, "Selecione uma funcionalidade de IA"),
});

type FormData = z.infer<typeof formSchema>;

interface DemoBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoBookingModal({ open, onOpenChange }: DemoBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      unitsManaged: "",
      propertyTypes: [],
      aiFeature: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    console.log("Demo booking submitted:", data);
    
    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
    
    toast({
      title: "Obrigado!",
      description: "A nossa equipa entrará em contacto consigo brevemente para agendar a sua demonstração.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agende a sua Demonstração Personalizada</DialogTitle>
          <DialogDescription className="text-base">
            Está a um passo. Preencha o formulário e mostramos-lhe como a nossa IA pode
            simplificar as suas operações, reduzir custos e poupar-lhe tempo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primeiro Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apelido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Profissional *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao.silva@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="A sua Empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitsManaged"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantas unidades gere? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um intervalo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-10">1 - 10 unidades</SelectItem>
                      <SelectItem value="11-50">11 - 50 unidades</SelectItem>
                      <SelectItem value="51-250">51 - 250 unidades</SelectItem>
                      <SelectItem value="250+">250+ unidades</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Que tipos de propriedades gere? *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {propertyTypes.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="propertyTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== type.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{type.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiFeature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Que funcionalidade de IA mais lhe interessa? *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma funcionalidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chatbot">Assistente IA 24/7 para Residentes</SelectItem>
                      <SelectItem value="maintenance">Manutenção Preditiva</SelectItem>
                      <SelectItem value="screening">Triagem de Inquilinos com IA</SelectItem>
                      <SelectItem value="reporting">Relatórios Financeiros Automatizados</SelectItem>
                      <SelectItem value="pricing">Definição Dinâmica de Rendas</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "A enviar..." : "Agendar Demonstração"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
