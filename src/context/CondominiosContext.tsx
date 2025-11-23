import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Condominio, CreateCondominioData, condominiosApi } from '@/api/condominios';
import { useToast } from '@/hooks/use-toast';

interface CondominiosContextType {
  condominios: Condominio[];
  filteredCondominios: Condominio[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  createCondominio: (data: CreateCondominioData) => Promise<void>;
  updateCondominio: (id: number, data: Partial<CreateCondominioData>) => Promise<void>;
  deleteCondominio: (id: number) => Promise<void>;
  refreshCondominios: () => Promise<void>;
}

const CondominiosContext = createContext<CondominiosContextType | undefined>(undefined);

export const CondominiosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadCondominios = async () => {
    try {
      setLoading(true);
      const data = await condominiosApi.getAll();
      setCondominios(data);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os condomínios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCondominios(); }, []);

  const filteredCondominios = condominios.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.morada.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createCondominio = async (data: CreateCondominioData) => {
    try { await condominiosApi.create(data); await loadCondominios(); toast({ title: 'Sucesso', description: 'Condomínio criado com sucesso' }); }
    catch (error) { toast({ title: 'Erro', description: 'Não foi possível criar o condomínio', variant: 'destructive' }); throw error; }
  };

  const updateCondominio = async (id: number, data: Partial<CreateCondominioData>) => {
    try { await condominiosApi.update(id, data); await loadCondominios(); toast({ title: 'Sucesso', description: 'Condomínio atualizado com sucesso' }); }
    catch (error) { toast({ title: 'Erro', description: 'Não foi possível atualizar o condomínio', variant: 'destructive' }); throw error; }
  };

  const deleteCondominio = async (id: number) => {
    try { await condominiosApi.delete(id); await loadCondominios(); toast({ title: 'Sucesso', description: 'Condomínio eliminado com sucesso' }); }
    catch (error) { toast({ title: 'Erro', description: 'Não foi possível eliminar o condomínio', variant: 'destructive' }); throw error; }
  };

  return (
    <CondominiosContext.Provider value={{ condominios, filteredCondominios, loading, searchTerm, setSearchTerm, createCondominio, updateCondominio, deleteCondominio, refreshCondominios: loadCondominios }}>
      {children}
    </CondominiosContext.Provider>
  );
};

export const useCondominios = () => {
  const context = useContext(CondominiosContext);
  if (!context) throw new Error('useCondominios must be used within a CondominiosProvider');
  return context;
};

