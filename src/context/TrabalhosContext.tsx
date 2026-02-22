import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trabalho, CreateTrabalhoData, trabalhosApi } from '@/api/trabalhos';
import { useToast } from '@/hooks/use-toast';

interface TrabalhosContextType {
  trabalhos: Trabalho[];
  loading: boolean;
  createTrabalho: (data: CreateTrabalhoData) => Promise<Trabalho>;
  updateTrabalho: (id: number, data: Partial<Trabalho>) => Promise<void>;
  deleteTrabalho: (id: number) => Promise<void>;
  refreshTrabalhos: () => Promise<void>;
}

const TrabalhosContext = createContext<TrabalhosContextType | undefined>(undefined);

export const TrabalhosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTrabalhos = async () => {
    try {
      setLoading(true);
      const data = await trabalhosApi.getAll();
      setTrabalhos(data);
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os trabalhos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrabalhos(); }, []);

  const createTrabalho = async (data: CreateTrabalhoData): Promise<Trabalho> => {
    try {
      const newTrabalho = await trabalhosApi.create(data);
      setTrabalhos([newTrabalho, ...trabalhos]);
      toast({ title: 'Sucesso', description: 'Trabalho criado com sucesso' });
      return newTrabalho;
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o trabalho', variant: 'destructive' });
      throw error;
    }
  };

  const updateTrabalho = async (id: number, data: Partial<Trabalho>) => {
    try {
      const updated = await trabalhosApi.update(id, data);
      setTrabalhos(trabalhos.map((t) => (t.id_trabalho === id ? updated : t)));
      toast({ title: 'Sucesso', description: 'Trabalho atualizado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o trabalho', variant: 'destructive' });
      throw error;
    }
  };

  const deleteTrabalho = async (id: number) => {
    try {
      await trabalhosApi.delete(id);
      setTrabalhos(trabalhos.filter((t) => t.id_trabalho !== id));
      toast({ title: 'Sucesso', description: 'Trabalho eliminado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível eliminar o trabalho', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <TrabalhosContext.Provider value={{ trabalhos, loading, createTrabalho, updateTrabalho, deleteTrabalho, refreshTrabalhos: loadTrabalhos }}>
      {children}
    </TrabalhosContext.Provider>
  );
};

export const useTrabalhos = () => {
  const context = useContext(TrabalhosContext);
  if (context === undefined) throw new Error('useTrabalhos must be used within a TrabalhosProvider');
  return context;
};
