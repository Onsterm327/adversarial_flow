import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QueueItem {
  id: string;
  chain: string[];
  position: number;
  createdAt: number;
}

interface QueueState {
  current: { id: string; chain: string[] } | null;
  items: QueueItem[];
  open: boolean;
}

const initialState: QueueState = {
  current: null,
  items: [],
  open: false,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueueState(state, action: PayloadAction<{ current: QueueState['current']; queue: QueueItem[] }>) {
      state.current = action.payload.current;
      state.items = action.payload.queue;
    },
    toggleQueue(state) {
      state.open = !state.open;
    },
  },
});

export const { setQueueState, toggleQueue } = queueSlice.actions;
export default queueSlice.reducer;
