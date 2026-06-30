import { createTheme } from '@mui/material/styles';

const sharedComponents = {
  MuiButton: {
    styleOverrides: { root: { textTransform: 'none' as const, fontWeight: 500 } },
  },
  MuiPaper: {
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiAccordion: {
    styleOverrides: {
      root: { background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: { minHeight: 40, '&.Mui-expanded': { minHeight: 40 } },
    },
  },
};

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 13,
  h6: { fontWeight: 600, fontSize: '1rem' },
  subtitle2: { fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  body2: { fontSize: '0.8rem' },
  caption: { fontSize: '0.7rem' },
};

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8', disabled: '#64748b' },
    success: { main: '#22c55e', light: '#4ade80', dark: '#16a34a' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    divider: '#334155',
  },
  typography: { ...sharedTypography, caption: { fontSize: '0.7rem', color: '#94a3b8' } },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: '0.75rem' },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#6366f1', dark: '#4338ca' },
    secondary: { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b', disabled: '#94a3b8' },
    success: { main: '#16a34a', light: '#22c55e', dark: '#15803d' },
    warning: { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
    error: { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
    info: { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
    divider: '#e2e8f0',
  },
  typography: { ...sharedTypography, caption: { fontSize: '0.7rem', color: '#64748b' } },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.75rem' },
      },
    },
  },
});

export const categoryColors: Record<string, string> = {
  dataset: '#3b82f6',
  model: '#22c55e',
  attack: '#f59e0b',
  defense: '#a855f7',
  defense_input_reconstruction: '#06b6d4',
  defense_adversarial_training: '#10b981',
  defense_active_defense: '#f97316',
  defense_ensemble_defense: '#8b5cf6',
  result: '#ec4899',
};

export const categoryLabels: Record<string, string> = {
  dataset: '数据集',
  model: '模型',
  attack: '攻击',
  defense: '防御',
  defense_input_reconstruction: '输入重构',
  defense_adversarial_training: '对抗训练',
  defense_active_defense: '主动防御',
  defense_ensemble_defense: '集成防御',
  result: '结果',
};

export const categoryEmojis: Record<string, string> = {
  dataset: '📦',
  model: '🧠',
  attack: '⚔️',
  defense: '🛡️',
  defense_input_reconstruction: '🔄',
  defense_adversarial_training: '💪',
  defense_active_defense: '🎭',
  defense_ensemble_defense: '🔗',
  result: '📊',
};

export function getDisplayCategory(card: { category: string; defenseSubtype?: string }): string {
  if (card.category === 'defense' && card.defenseSubtype) {
    return `defense_${card.defenseSubtype}`;
  }
  return card.category;
}

export const DISPLAY_CATEGORY_ORDER = [
  'dataset',
  'model',
  'attack',
  'defense_input_reconstruction',
  'defense_adversarial_training',
  'defense_active_defense',
  'defense_ensemble_defense',
  'result',
];
