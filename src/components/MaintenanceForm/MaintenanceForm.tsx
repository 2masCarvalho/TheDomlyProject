import React, { useState, useMemo, useEffect } from 'react'; // Corrigido o import
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { manutencoesApi, Ativo } from '@/api/ativos';
import { useToast } from '@/hooks/use-toast';
import { useCondominios } from '@/context/CondominiosContext'; // Importante para o filtro

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativos: Ativo[];
  onSuccess: () => void;
  initialData?: any;
  fixedAtivoId?: number; // Nova prop para agendamento direto no ativo
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  open, onOpenChange, ativos, onSuccess, initialData, fixedAtivoId 
}) => {

    const { toast } = useToast();
    const { condominios } = useCondominios();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCondoId, setSelectedCondoId] = useState<string>('');
  
 const [formData, setFormData] = useState({
    id_ativo: '',
    descricao: '',
    custo: '',
    data_conclusao: '',
    estado: 'pendente' as 'pendente' | 'concluido',
    tipo_manutencao: 'preventiva'
  });

  // Filtra os ativos baseando-se no condomínio selecionado
  const filteredAtivos = useMemo(() => {
    if (!selectedCondoId) return [];
    return ativos.filter(a => a.id_condominio === parseInt(selectedCondoId));
  }, [selectedCondoId, ativos]);

    useEffect(() => {
  if (!open) return; // Só executa quando o modal abre

  if (initialData) {
    // Modo Edição
    setFormData({
      id_ativo: initialData.id_ativo.toString(),
      descricao: initialData.descricao || '',
      custo: initialData.custo?.toString() || '',
      data_conclusao: initialData.data_conclusao || '',
      estado: initialData.estado,
      tipo_manutencao: initialData.tipo_manutencao || 'preventiva'
    });
    setSelectedCondoId(initialData.ativos?.id_condominio?.toString() || '');
  } else {
    // Modo Novo Registo (Prioriza o fixedAtivoId se existir)
    setFormData({ 
      id_ativo: fixedAtivoId ? fixedAtivoId.toString() : '', 
      descricao: '', 
      custo: '', 
      data_conclusao: '', 
      estado: 'pendente', 
      tipo_manutencao: 'preventiva' 
    });
    setSelectedCondoId('');
  }
}, [open, initialData, fixedAtivoId]);

const resetForm = () => {
    setFormData({ 
      id_ativo: fixedAtivoId?.toString() || '', 
      descricao: '', 
      custo: '', 
      data_conclusao: '', 
      estado: 'pendente', 
      tipo_manutencao: 'preventiva' // Campo obrigatório no tipo do estado
    });
  };

const handleSave = async () => {
    if (!formData.id_ativo) return;

try {
    setIsSubmitting(true);
    
    // Converte a string do input para número. Se estiver vazio, envia 0 ou null.
    const custoNumerico = formData.custo === '' ? 0 : parseFloat(formData.custo);

    const payload = {
      id_ativo: parseInt(formData.id_ativo),
      descricao: formData.descricao,
      data_conclusao: formData.data_conclusao,
      custo: custoNumerico, // Garante que vai como número
      estado: formData.estado,
      tipo_manutencao: formData.tipo_manutencao
    };

    if (initialData) {
      await manutencoesApi.updateMaintenance(initialData.id_manutencao, payload);
    } else {
      await manutencoesApi.createMaintenance(payload);
    }

    onSuccess();
    onOpenChange(false);
  } catch (error: any) {
    toast({ title: "Erro", description: error.message, variant: "destructive" });
  } finally {
    setIsSubmitting(false);
  }
};


return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {fixedAtivoId ? 'Agendar Manutenção' : 'Registar Intervenção Técnica'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* SÓ MOSTRA SELEÇÃO SE NÃO FOR UM ATIVO FIXO */}
          {!fixedAtivoId && (
            <>
              {/* Passo 1: Selecionar Condomínio */}
              <div className="space-y-2">
                <Label>Condomínio</Label>
                <Select 
                  value={selectedCondoId} 
                  onValueChange={(v) => {
                    setSelectedCondoId(v);
                    setFormData({ ...formData, id_ativo: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o Condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios.map(c => (
                      <SelectItem key={c.id_comdominio} value={c.id_comdominio.toString()}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Passo 2: Selecionar Ativo (Filtrado) */}
              <div className="space-y-2">
                <Label>Ativo / Equipamento *</Label>
                <Select 
                  value={formData.id_ativo} 
                  onValueChange={(v) => setFormData({ ...formData, id_ativo: v })}
                  disabled={!selectedCondoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCondoId ? "Escolha o Ativo" : "Selecione primeiro o condomínio"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAtivos.map(a => (
                      <SelectItem key={a.id_ativo} value={a.id_ativo.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* CAMPOS COMUNS A AMBOS OS MODOS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Manutenção</Label>
              <Select 
                value={formData.tipo_manutencao} 
                onValueChange={(v) => setFormData({...formData, tipo_manutencao: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custo (€)</Label>
              <Input 
                type="number" 
                value={formData.custo} 
                onChange={(e) => setFormData({...formData, custo: e.target.value})} 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v: any) => setFormData({...formData, estado: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Intervenção</Label>
              <Input 
                type="date" 
                value={formData.data_conclusao} 
                onChange={(e) => setFormData({...formData, data_conclusao: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Intervenção</Label>
            <Textarea 
              value={formData.descricao} 
              onChange={(e) => setFormData({...formData, descricao: e.target.value})} 
              placeholder="Descreva o que foi feito..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || !formData.id_ativo}
          >
            {isSubmitting ? "A guardar..." : "Guardar Registo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};