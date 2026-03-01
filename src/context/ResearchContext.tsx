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
import { db, firebaseEnabled } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';

interface ResearchContextValue {
  researches: Research[];
  addResearch: (r: Omit<Research, 'id' | 'createdAt'>) => void;
  updateResearch: (id: string, r: Partial<Research>) => void;
  deleteResearch: (id: string) => void;
  getResearchById: (id: string) => Research | undefined;
  loading: boolean;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

const LS_KEY = 'gba-researches';

function generateId() {
  return `research-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(): Research[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Research[];
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(researches: Research[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(researches));
  } catch { /* quota exceeded */ }
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [researches, setResearches] = useState<Research[]>(loadFromStorage);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled || !db) return;

    const q = query(collection(db, 'researches'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as Research[];
      setResearches(docs);
      setLoading(false);
    }, () => {
      setResearches(loadFromStorage());
      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) {
      saveToStorage(researches);
    }
  }, [researches]);

  const addResearch = useCallback(
    async (r: Omit<Research, 'id' | 'createdAt'>) => {
      const createdAt = new Date().toISOString();

      if (firebaseEnabled && db) {
        await addDoc(collection(db, 'researches'), { ...r, createdAt });
      } else {
        const newResearch: Research = { ...r, id: generateId(), createdAt };
        setResearches((prev) => [newResearch, ...prev]);
      }
    },
    []
  );

  const updateResearch = useCallback(async (id: string, updates: Partial<Research>) => {
    if (firebaseEnabled && db) {
      const ref = doc(db, 'researches', id);
      await updateDoc(ref, updates);
    } else {
      setResearches((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
  }, []);

  const deleteResearch = useCallback(async (id: string) => {
    if (firebaseEnabled && db) {
      await deleteDoc(doc(db, 'researches', id));
    } else {
      setResearches((prev) => prev.filter((item) => item.id !== id));
    }
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
      loading,
    }),
    [researches, addResearch, updateResearch, deleteResearch, getResearchById, loading]
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
