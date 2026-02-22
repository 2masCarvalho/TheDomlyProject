import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tecnico, CreateTecnicoData, tecnicosApi } from '@/api/tecnicos';
import { useToast } from '@/hooks/use-toast';

interface TecnicosContextType {
  tecnicos: Tecnico[];
  loading: boolean;
  createTecnico: (data: CreateTecnicoData) => Promise<void>;
  updateTecnico: (id: number, data: Partial<CreateTecnicoData>) => Promise<void>;
  deleteTecnico: (id: number) => Promise<void>;
  refreshTecnicos: () => Promise<void>;
}

const TecnicosContext = createContext<TecnicosContextType | undefined>(undefined);

export const TecnicosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTecnicos = async () => {
    try {
      setLoading(true);
      const data = await tecnicosApi.getAll();
      setTecnicos(data);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os técnicos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTecnicos(); }, []);

  const createTecnico = async (data: CreateTecnicoData) => {
    try {
      const newTecnico = await tecnicosApi.create(data);
      setTecnicos([...tecnicos, newTecnico]);
      toast({ title: 'Sucesso', description: 'Técnico adicionado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível adicionar o técnico', variant: 'destructive' });
      throw error;
    }
  };

  const updateTecnico = async (id: number, data: Partial<CreateTecnicoData>) => {
    try {
      const updated = await tecnicosApi.update(id, data);
      setTecnicos(tecnicos.map((t) => (t.id_tecnico === id ? updated : t)));
      toast({ title: 'Sucesso', description: 'Técnico atualizado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o técnico', variant: 'destructive' });
      throw error;
    }
  };

  const deleteTecnico = async (id: number) => {
    try {
      await tecnicosApi.delete(id);
      setTecnicos(tecnicos.filter((t) => t.id_tecnico !== id));
      toast({ title: 'Sucesso', description: 'Técnico removido' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o técnico', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <TecnicosContext.Provider value={{ tecnicos, loading, createTecnico, updateTecnico, deleteTecnico, refreshTecnicos: loadTecnicos }}>
      {children}
    </TecnicosContext.Provider>
  );
};

export const useTecnicos = () => {
  const context = useContext(TecnicosContext);
  if (context === undefined) throw new Error('useTecnicos must be used within a TecnicosProvider');
  return context;
};
