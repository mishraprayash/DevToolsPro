import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
}

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  recentTools: string[];
  addRecentTool: (toolId: string) => void;
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  history: Record<string, HistoryItem[]>;
  addHistoryItem: (toolId: string, input: string, output: string, metadata?: Record<string, unknown>) => void;
  clearHistory: (toolId: string) => void;
}

function canUseDOM(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function applyTheme(theme: Theme) {
  if (!canUseDOM()) return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
      recentTools: [],
      addRecentTool: (toolId) => {
        const { recentTools } = get();
        const filtered = recentTools.filter((t) => t !== toolId);
        set({ recentTools: [toolId, ...filtered].slice(0, 6) });
      },
      favorites: [],
      toggleFavorite: (toolId) => {
        const { favorites } = get();
        if (favorites.includes(toolId)) {
          set({ favorites: favorites.filter((t) => t !== toolId) });
        } else {
          set({ favorites: [...favorites, toolId] });
        }
      },
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      feedbackOpen: false,
      setFeedbackOpen: (open) => set({ feedbackOpen: open }),
      shortcutsOpen: false,
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
      history: {},
      addHistoryItem: (toolId, input, output, metadata) => {
        const currentHistory = get().history[toolId] || [];
        const newItem: HistoryItem = {
          id: generateId(),
          timestamp: Date.now(),
          input,
          output,
          metadata
        };
        const updatedHistory = [newItem, ...currentHistory.filter(h => h.input !== input)].slice(0, 20);
        set((state) => ({
          history: {
            ...state.history,
            [toolId]: updatedHistory
          }
        }));
      },
      clearHistory: (toolId) => {
        set((state) => ({
          history: {
            ...state.history,
            [toolId]: []
          }
        }));
      }
    }),
    {
      name: 'devtools-storage',
      partialize: (state) => ({
        theme: state.theme,
        recentTools: state.recentTools,
        favorites: state.favorites,
        history: state.history,
      }),
    }
  )
);
