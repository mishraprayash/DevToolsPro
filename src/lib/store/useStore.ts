import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  metadata?: Record<string, any>;
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
  history: Record<string, HistoryItem[]>;
  addHistoryItem: (toolId: string, input: string, output: string, metadata?: Record<string, any>) => void;
  clearHistory: (toolId: string) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        localStorage.setItem('devtools-theme', theme);
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('devtools-theme', newTheme);
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
      history: {},
      addHistoryItem: (toolId, input, output, metadata) => {
        const currentHistory = get().history[toolId] || [];
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
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
