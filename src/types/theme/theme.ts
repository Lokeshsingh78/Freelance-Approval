export type Theme = "light" | "dark";
export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  toggleLight: () => void;
  toggleDark: () => void;
  setTheme: (theme: Theme) => void;
}
