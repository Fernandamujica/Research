import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import type { Research } from '../types/research';
import { SEED_RESEARCH } from '../data/seedResearch';

interface ResearchContextValue {
  researches: Research[];
  addResearch: (r: Omit<Research, 'id' | 'createdAt'>) => void;
  updateResearch: (id: string, r: Partial<Research>) => void;
  deleteResearch: (id: string) => void;
  getResearchById: (id: string) => Research | undefined;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

const LS_KEY = 'gba-researches';

function generateId() {
  return `research-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(): Research[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Research[];
      if (parsed.length > 0) return parsed;
    }
    return SEED_RESEARCH;
  } catch {
    return SEED_RESEARCH;
  }
}

function saveToStorage(researches: Research[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(researches));
  } catch {
    // storage quota exceeded — fail silently
  }
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [researches, setResearches] = useState<Research[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(researches);
  }, [researches]);

  const addResearch = useCallback(
    (r: Omit<Research, 'id' | 'createdAt'>) => {
      const newResearch: Research = {
        ...r,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setResearches((prev) => [newResearch, ...prev]);
    },
    []
  );

  const updateResearch = useCallback((id: string, updates: Partial<Research>) => {
    setResearches((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const deleteResearch = useCallback((id: string) => {
    setResearches((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getResearchById = useCallback(
    (id: string) => researches.find((r) => r.id === id),
    [researches]
  );

  const value = useMemo(
    () => ({
      researches,
      addResearch,
      updateResearch,
      deleteResearch,
      getResearchById,
    }),
    [researches, addResearch, updateResearch, deleteResearch, getResearchById]
  );

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error('useResearch must be used within ResearchProvider');
  return ctx;
}
