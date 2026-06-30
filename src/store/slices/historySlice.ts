import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExecutionSummary } from '@/types';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  chain: string[];
  summary: ExecutionSummary;
}

interface HistoryState {
  entries: HistoryEntry[];
  open: boolean;
}

const initialState: HistoryState = {
  entries: [],
  open: false,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistory(state, action: PayloadAction<{ chain: string[]; summary: ExecutionSummary }>) {
      state.entries.unshift({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        chain: action.payload.chain,
        summary: action.payload.summary,
      });
      if (state.entries.length > 30) {
        state.entries.pop();
      }
    },
    toggleHistory(state) {
      state.open = !state.open;
    },
    clearHistory(state) {
      state.entries = [];
    },
  },
});

export const { addHistory, toggleHistory, clearHistory } = historySlice.actions;
export default historySlice.reducer;
