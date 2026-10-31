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
  bgTop: '#0F3D3A',
  bgMid: '#1A5C55',
  bgBottom: '#E6F2EF',
  surface: 'rgba(255,255,255,0.92)',
  surfaceElevated: '#FFFFFF',
  text: '#122421',
  textMuted: '#4A635F',
  accent: '#0E7C72',
  accentSoft: '#B8DED8',
  border: 'rgba(18,36,33,0.12)',
  danger: '#B54040',
  fab: '#0E7C72',
  fabText: '#F4FFFC',
  brand: '#F4FFFC',
};

export const darkColors: AppColors = {
  bgTop: '#061412',
  bgMid: '#0C2A26',
  bgBottom: '#10201E',
  surface: 'rgba(24,40,38,0.94)',
  surfaceElevated: '#1C302D',
  text: '#E8F4F1',
  textMuted: '#9BB5B0',
  accent: '#3DB8AA',
  accentSoft: '#1E4A44',
  border: 'rgba(232,244,241,0.12)',
  danger: '#E07070',
  fab: '#3DB8AA',
  fabText: '#041210',
  brand: '#E8F4F1',
};
