import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { membershipsApi, type MemberCondominio } from '../lib/api/memberships';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'domly.activeCondoId';

interface ActiveCondoContextValue {
  memberships: MemberCondominio[];
  activeCondoId: number | null;
  active: MemberCondominio | null;
  setActiveCondoId: (id: number) => void;
  loading: boolean;
  refresh: () => void;
}

const ActiveCondoContext = createContext<ActiveCondoContextValue | null>(null);

export function ActiveCondoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeCondoId, setActiveCondoIdState] = useState<number | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const { data: memberships = [], isLoading, refetch } = useQuery({
    queryKey: ['memberships', user?.id],
    queryFn: membershipsApi.getMemberCondominios,
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) setActiveCondoIdState(parsed);
      }
      setStorageLoaded(true);
    });
  }, []);

  // Auto-select first membership if nothing is persisted.
  useEffect(() => {
    if (!storageLoaded) return;
    if (activeCondoId == null && memberships.length > 0) {
      const id = memberships[0].condominio.id_comdominio;
      setActiveCondoIdState(id);
      void AsyncStorage.setItem(STORAGE_KEY, String(id));
    }
    if (activeCondoId != null && memberships.length > 0) {
      const stillMember = memberships.some((m) => m.condominio.id_comdominio === activeCondoId);
      if (!stillMember) {
        const fallback = memberships[0].condominio.id_comdominio;
        setActiveCondoIdState(fallback);
        void AsyncStorage.setItem(STORAGE_KEY, String(fallback));
      }
    }
  }, [memberships, storageLoaded, activeCondoId]);

  const setActiveCondoId = useCallback((id: number) => {
    setActiveCondoIdState(id);
    void AsyncStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const active = useMemo(
    () => memberships.find((m) => m.condominio.id_comdominio === activeCondoId) ?? null,
    [memberships, activeCondoId],
  );

  return (
    <ActiveCondoContext.Provider
      value={{
        memberships,
        activeCondoId,
        active,
        setActiveCondoId,
        loading: isLoading || !storageLoaded,
        refresh: () => {
          void refetch();
        },
      }}
    >
      {children}
    </ActiveCondoContext.Provider>
  );
}

export function useActiveCondo() {
  const ctx = useContext(ActiveCondoContext);
  if (!ctx) throw new Error('useActiveCondo must be used inside an ActiveCondoProvider');
  return ctx;
}
