import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

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
    }),
    {
      name: 'devtools-storage',
      partialize: (state) => ({
        theme: state.theme,
        recentTools: state.recentTools,
        favorites: state.favorites,
      }),
    }
  )
);
