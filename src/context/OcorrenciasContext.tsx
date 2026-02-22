import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ocorrencia, CreateOcorrenciaData, ocorrenciasApi } from '@/api/ocorrencias';
import { useToast } from '@/hooks/use-toast';

interface OcorrenciasContextType {
  ocorrencias: Ocorrencia[];
  loading: boolean;
  getByCondominio: (condominioId: number) => Ocorrencia[];
  createOcorrencia: (data: CreateOcorrenciaData) => Promise<void>;
  updateOcorrencia: (id: number, data: Partial<Ocorrencia>) => Promise<void>;
  deleteOcorrencia: (id: number) => Promise<void>;
  refreshOcorrencias: () => Promise<void>;
}

const OcorrenciasContext = createContext<OcorrenciasContextType | undefined>(undefined);

export const OcorrenciasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadOcorrencias = async () => {
    try {
      setLoading(true);
      const data = await ocorrenciasApi.getAll();
      setOcorrencias(data);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as ocorrências',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOcorrencias();
  }, []);

  const getByCondominio = (condominioId: number): Ocorrencia[] => {
    return ocorrencias.filter((o) => o.id_condominio === condominioId);
  };

  const createOcorrencia = async (data: CreateOcorrenciaData) => {
    try {
      const newOcorrencia = await ocorrenciasApi.create(data);
      setOcorrencias([newOcorrencia, ...ocorrencias]);
      toast({ title: 'Sucesso', description: 'Ocorrência criada com sucesso' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar a ocorrência', variant: 'destructive' });
      throw error;
    }
  };

  const updateOcorrencia = async (id: number, data: Partial<Ocorrencia>) => {
    try {
      const updated = await ocorrenciasApi.update(id, data);
      setOcorrencias(ocorrencias.map((o) => (o.id_ocorrencia === id ? updated : o)));
      toast({ title: 'Sucesso', description: 'Ocorrência atualizada' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a ocorrência', variant: 'destructive' });
      throw error;
    }
  };

  const deleteOcorrencia = async (id: number) => {
    try {
      await ocorrenciasApi.delete(id);
      setOcorrencias(ocorrencias.filter((o) => o.id_ocorrencia !== id));
      toast({ title: 'Sucesso', description: 'Ocorrência eliminada' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível eliminar a ocorrência', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <OcorrenciasContext.Provider
      value={{
        ocorrencias,
        loading,
        getByCondominio,
        createOcorrencia,
        updateOcorrencia,
        deleteOcorrencia,
        refreshOcorrencias: loadOcorrencias,
      }}
    >
      {children}
    </OcorrenciasContext.Provider>
  );
};

export const useOcorrencias = () => {
  const context = useContext(OcorrenciasContext);
  if (context === undefined) {
    throw new Error('useOcorrencias must be used within an OcorrenciasProvider');
  }
  return context;
};
