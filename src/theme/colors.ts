export type ThemeMode = 'light' | 'dark' | 'system';

export type AppColors = {
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
  danger: string;
  fab: string;
  fabText: string;
  brand: string;
};

export const lightColors: AppColors = {
  bgTop: '#F7F8F5',
  bgMid: '#F7F8F5',
  bgBottom: '#F7F8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#182520',
  textMuted: '#75817B',
  accent: '#2F6B55',
  accentSoft: '#DCE9DF',
  border: '#E6EAE5',
  danger: '#B94B45',
  fab: '#253F35',
  fabText: '#FFFFFF',
  brand: '#253F35',
};

export const darkColors: AppColors = {
  bgTop: '#111815',
  bgMid: '#111815',
  bgBottom: '#111815',
  surface: '#1B2420',
  surfaceElevated: '#222D27',
  text: '#F0F3EF',
  textMuted: '#A2AEA6',
  accent: '#8AC7A3',
  accentSoft: '#263B30',
  border: '#303C35',
  danger: '#F08C83',
  fab: '#8AC7A3',
  fabText: '#112018',
  brand: '#F0F3EF',
};
