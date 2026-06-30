import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttackMetric, ExecutionState, ExecutionSummary } from '@/types';

const initialState: ExecutionState = {
  isRunning: false,
  progress: 0,
  currentStep: '',
  metrics: [],
  totalSamples: 1000,
  error: null,
  summary: null,
};

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    startExecution(state) {
      state.isRunning = true;
      state.progress = 0;
      state.currentStep = '初始化...';
      state.metrics = [];
      state.totalSamples = 1000;
      state.error = null;
      state.summary = null;
    },
    updateStep(state, action: PayloadAction<{ message: string; progress: number }>) {
      state.currentStep = action.payload.message;
      // Only increase — backend may send fluctuating values
      state.progress = Math.max(state.progress, action.payload.progress);
    },
    updateMetricBatch(state, action: PayloadAction<{ metrics: AttackMetric[]; totalSamples: number }>) {
      for (const m of action.payload.metrics) {
        const idx = state.metrics.findIndex(existing => existing.name === m.name);
        if (idx >= 0) {
          state.metrics[idx] = m;
        } else {
          state.metrics.push(m);
        }
      }
      if (action.payload.totalSamples > 0) {
        state.totalSamples = action.payload.totalSamples;
      }
    },
    updateMetric(state, action: PayloadAction<AttackMetric>) {
      const idx = state.metrics.findIndex(m => m.name === action.payload.name);
      if (idx >= 0) {
        state.metrics[idx] = action.payload;
      } else {
        state.metrics.push(action.payload);
      }
    },
    finishExecution(state, action: PayloadAction<ExecutionSummary>) {
      state.isRunning = false;
      state.progress = 100;
      state.currentStep = '完成';
      state.summary = action.payload;
    },
    executionError(state, action: PayloadAction<string>) {
      state.isRunning = false;
      state.error = action.payload;
    },
    setTotalSamples(state, action: PayloadAction<number>) {
      state.totalSamples = action.payload;
    },
    resetExecution(state) {
      return { ...initialState };
    },
  },
});

export const {
  startExecution,
  updateStep,
  updateMetricBatch,
  updateMetric,
  setTotalSamples,
  finishExecution,
  executionError,
  resetExecution,
} = executionSlice.actions;
export default executionSlice.reducer;
