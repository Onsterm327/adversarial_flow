import { ReactFlowProvider } from '@xyflow/react';
import { AppLayout } from '@/components/layout/AppLayout';

export function App() {
  return (
    <ReactFlowProvider>
      <AppLayout />
    </ReactFlowProvider>
  );
}
