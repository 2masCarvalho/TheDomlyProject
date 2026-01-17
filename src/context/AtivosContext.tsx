import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ativo, CreateAtivoData, ativosApi } from '@/api/ativos';
import { useToast } from '@/hooks/use-toast';

interface AtivosContextType {
  ativos: Ativo[];
  loading: boolean;
  getAtivosByCondominio: (condominioId: number) => Ativo[];
  createAtivo: (data: CreateAtivoData) => Promise<void>;
  updateAtivo: (id: number, data: Partial<CreateAtivoData>) => Promise<void>;
  deleteAtivo: (id: number) => Promise<void>;
  refreshAtivos: () => Promise<void>;
}

const AtivosContext = createContext<AtivosContextType | undefined>(undefined);

export const AtivosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadAtivos = async () => {
    try {
      setLoading(true);
      // For now, we load all ativos. In production, this would be filtered server-side
      const allAtivos: Ativo[] = [];
      setAtivos(allAtivos);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os ativos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAtivos();
  }, []);

  const getAtivosByCondominio = (condominioId: number): Ativo[] => {
    return ativos.filter((a) => a.id_condominio === condominioId);
  };

  const createAtivo = async (data: CreateAtivoData) => {
    try {
      const newAtivo = await ativosApi.create(data);
      setAtivos([...ativos, newAtivo]);
      toast({
        title: 'Sucesso',
        description: 'Ativo criado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o ativo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateAtivo = async (id: number, data: Partial<CreateAtivoData>) => {
    try {
      const updatedAtivo = await ativosApi.update(id, data);
      setAtivos(ativos.map((a) => (a.id_ativo === id ? updatedAtivo : a)));
      toast({
        title: 'Sucesso',
        description: 'Ativo atualizado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o ativo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAtivo = async (id: number) => {
    try {
      await ativosApi.delete(id);
      setAtivos(ativos.filter((a) => a.id_ativo !== id));
      toast({
        title: 'Sucesso',
        description: 'Ativo eliminado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível eliminar o ativo',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AtivosContext.Provider
      value={{
        ativos,
        loading,
        getAtivosByCondominio,
        createAtivo,
        updateAtivo,
        deleteAtivo,
        refreshAtivos: loadAtivos,
      }}
    >
      {children}
    </AtivosContext.Provider>
  );
};

export const useAtivos = () => {
  const context = useContext(AtivosContext);
  if (context === undefined) {
    throw new Error('useAtivos must be used within an AtivosProvider');
  }
  return context;
};
