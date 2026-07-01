import { configureStore } from '@reduxjs/toolkit';
import flowReducer from './slices/flowSlice';
import executionReducer from './slices/executionSlice';
import uiReducer from './slices/uiSlice';
import historyReducer from './slices/historySlice';
import queueReducer from './slices/queueSlice';

export const store = configureStore({
  reducer: {
    flow: flowReducer,
    execution: executionReducer,
    ui: uiReducer,
    history: historyReducer,
    queue: queueReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
