import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ExecutionSummary } from '@/types';
import * as historyApi from '@/api/history';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  chain: string[];
  summary: ExecutionSummary;
}

interface HistoryState {
  entries: HistoryEntry[];
  open: boolean;
  loaded: boolean;
  selectedIds: string[];
  compareOpen: boolean;
}

const initialState: HistoryState = {
  entries: [],
  open: false,
  loaded: false,
  selectedIds: [],
  compareOpen: false,
};

// ── Async thunks ──────────────────────────────────────────────

export const loadHistory = createAsyncThunk('history/load', async () => {
  const entries = await historyApi.fetchHistory();
  return entries as unknown as HistoryEntry[];
});

export const saveHistory = createAsyncThunk(
  'history/save',
  async (entry: { chain: string[]; summary: ExecutionSummary }) => {
    const newEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      chain: entry.chain,
      summary: entry.summary,
    };
    // Fire-and-forget to backend
    historyApi.postHistory(newEntry as unknown as historyApi.HistoryEntryDTO).catch(() => {});
    return newEntry;
  }
);

export const deleteHistory = createAsyncThunk('history/delete', async (id: string) => {
  await historyApi.deleteHistoryEntry(id).catch(() => {});
  return id;
});

export const clearHistoryAsync = createAsyncThunk('history/clearAll', async () => {
  await historyApi.clearAllHistory().catch(() => {});
});

// ── Slice ─────────────────────────────────────────────────────

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    toggleHistory(state) {
      state.open = !state.open;
    },
    toggleSelect(state, action: PayloadAction<string>) {
      const idx = state.selectedIds.indexOf(action.payload);
      if (idx >= 0) state.selectedIds.splice(idx, 1);
      else state.selectedIds.push(action.payload);
    },
    clearSelection(state) {
      state.selectedIds = [];
    },
    openCompare(state) {
      state.compareOpen = true;
    },
    closeCompare(state) {
      state.compareOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadHistory.fulfilled, (state, action) => {
      state.entries = action.payload;
      state.loaded = true;
    });
    builder.addCase(loadHistory.rejected, (state) => {
      state.loaded = true; // backend unavailable, don't block UI
    });
    builder.addCase(saveHistory.fulfilled, (state, action) => {
      state.entries.unshift(action.payload);
      if (state.entries.length > 30) state.entries.pop();
    });
    builder.addCase(deleteHistory.fulfilled, (state, action) => {
      state.entries = state.entries.filter(e => e.id !== action.payload);
    });
    builder.addCase(clearHistoryAsync.fulfilled, (state) => {
      state.entries = [];
    });
  },
});

export const { toggleHistory, toggleSelect, clearSelection, openCompare, closeCompare } = historySlice.actions;
export default historySlice.reducer;
