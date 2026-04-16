import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Condominio, CreateCondominioData, condominiosApi } from '@/api/condominios';
import { membershipsApi } from '@/api/memberships';
import { useToast } from '@/hooks/use-toast';

interface CondominiosContextType {
  condominios: Condominio[];
  filteredCondominios: Condominio[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  includeInactive: boolean;
  setIncludeInactive: (val: boolean) => void;
  createCondominio: (data: CreateCondominioData) => Promise<void>;
  updateCondominio: (id: number, data: Partial<CreateCondominioData>) => Promise<void>;
  deleteCondominio: (id: number) => Promise<void>;
  deactivateCondominio: (id: number) => Promise<void>;
  reactivateCondominio: (id: number) => Promise<void>;
  refreshCondominios: () => Promise<void>;
}

const CondominiosContext = createContext<CondominiosContextType | undefined>(undefined);

export const CondominiosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const { toast } = useToast();

  const loadCondominios = async () => {
    try {
      setLoading(true);
      const owned = await condominiosApi.getAll({ includeInactive });

      // Member condominios are loaded separately — a failure here must never
      // prevent the owner's own condominios from showing.
      let memberCondominios: typeof owned = [];
      try {
        const memberRows = await membershipsApi.getMemberCondominios();
        const ownedIds = new Set(owned.map((c) => c.id_comdominio));
        memberCondominios = memberRows
          .filter((r) => !ownedIds.has(r.condominio.id_comdominio))
          .map((r) => ({ ...r.condominio, memberRole: r.role }));
      } catch {
        // silently ignore — member fetch failing should not hide owned condominios
      }

      setCondominios([...owned, ...memberCondominios]);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os condomínios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCondominios();
  }, [includeInactive]);

  const filteredCondominios = condominios.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.morada.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createCondominio = async (data: CreateCondominioData) => {
    try { 
      await condominiosApi.create(data); 
      await loadCondominios(); 
      toast({ title: 'Sucesso', description: 'Condomínio criado com sucesso' }); 
    }
    catch (error: any) { 
      const errorMsg = error?.message || error?.details || JSON.stringify(error);
      toast({ title: 'Erro', description: `Não foi possível criar. Erro: ${errorMsg}`, variant: 'destructive' }); 
      throw error; 
    }
  };

  const updateCondominio = async (id: number, data: Partial<CreateCondominioData>) => {
    try { await condominiosApi.update(id, data); await loadCondominios(); toast({ title: 'Sucesso', description: 'Condomínio atualizado com sucesso' }); }
    catch (error) { toast({ title: 'Erro', description: 'Não foi possível atualizar o condomínio', variant: 'destructive' }); throw error; }
  };

  const deleteCondominio = async (id: number) => {
    try { await condominiosApi.delete(id); await loadCondominios(); toast({ title: 'Sucesso', description: 'Condomínio eliminado com sucesso' }); }
    catch (error) { toast({ title: 'Erro', description: 'Não foi possível eliminar o condomínio', variant: 'destructive' }); throw error; }
  };

  const deactivateCondominio = async (id: number) => {
    try {
      await condominiosApi.deactivate(id);
      await loadCondominios();
      toast({ title: 'Sucesso', description: 'Condomínio desativado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível desativar o condomínio', variant: 'destructive' });
      throw error;
    }
  };

  const reactivateCondominio = async (id: number) => {
    try {
      await condominiosApi.reactivate(id);
      await loadCondominios();
      toast({ title: 'Sucesso', description: 'Condomínio reativado' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível reativar o condomínio', variant: 'destructive' });
      throw error;
    }
  };

  return (
    <CondominiosContext.Provider
      value={{
        condominios,
        filteredCondominios,
        loading,
        searchTerm,
        setSearchTerm,
        includeInactive,
        setIncludeInactive,
        createCondominio,
        updateCondominio,
        deleteCondominio,
        deactivateCondominio,
        reactivateCondominio,
        refreshCondominios: loadCondominios,
      }}
    >
      {children}
    </CondominiosContext.Provider>
  );
};

export const useCondominios = () => {
  const context = useContext(CondominiosContext);
  if (!context) throw new Error('useCondominios must be used within a CondominiosProvider');
  return context;
};

