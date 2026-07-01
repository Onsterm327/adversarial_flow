const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765';

export interface QueueState {
  current: { id: string; chain: string[] } | null;
  queue: { id: string; chain: string[]; position: number; createdAt: number }[];
}

export async function getQueueStatus(): Promise<QueueState> {
  const res = await fetch(`${API_URL}/api/queue/status`);
  if (!res.ok) return { current: null, queue: [] };
  return res.json();
}

export async function submitToQueue(chain: string[], defenseParams: Record<string, unknown>): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/queue/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chain, defense_params: defenseParams }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
}

export async function cancelTask(taskId: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/queue/${taskId}`, { method: 'DELETE' });
  return res.ok;
}

export function streamQueueStatus(
  onState: (state: QueueState) => void
): () => void {
  let stopped = false;

  async function connect() {
    while (!stopped) {
      try {
        const res = await fetch(`${API_URL}/api/queue/stream`);
        if (!res.body || stopped) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const state = JSON.parse(line.slice(6));
                onState(state);
              } catch { /* ignore */ }
            }
          }
        }
      } catch { /* connection lost, will reconnect */ }
      if (!stopped) await new Promise(r => setTimeout(r, 2000)); // wait 2s before reconnect
    }
  }

  connect();

  return () => { stopped = true; };
}

export function streamTaskProgress(taskId: string, callbacks: {
  onStep: (msg: string, pct: number) => void;
  onMetric: (name: string, accuracy: number, samples: number, totalSamples: number) => void;
  onResult: (summary: Record<string, unknown>) => void;
  onError: (err: string) => void;
}): () => void {
  const controller = new AbortController();

  fetch(`${API_URL}/api/queue/stream/${taskId}`, { signal: controller.signal })
    .then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              switch (event.type) {
                case 'step':
                  callbacks.onStep(event.message, event.progress || 0);
                  break;
                case 'metric_update': {
                  const m = event.metrics;
                  if (m && typeof m === 'object') {
                    for (const [name, acc] of Object.entries(m)) {
                      callbacks.onMetric(name, Number(acc), Number(event.samples ?? 0), Number(event.total_samples ?? 0));
                    }
                  }
                  break;
                }
                case 'result': {
                  const raw = event.summary || {};
                  const m = raw.metrics;
                  let arr: { name: string; accuracy: number; samples: number }[] = [];
                  if (m && typeof m === 'object') {
                    arr = Object.entries(m).map(([name, accuracy]) => ({
                      name, accuracy: Number(accuracy),
                      samples: Number(raw.samples || 0),
                    }));
                  }
                  callbacks.onResult({
                    ...raw,
                    metrics: arr,
                    attacks: Array.isArray(raw.attacks) ? raw.attacks : [],
                    defenses: Array.isArray(raw.defenses) ? raw.defenses : [],
                  });
                  break;
                }
                case 'error':
                  callbacks.onError(event.message || '执行失败');
                  break;
              }
            } catch { /* ignore */ }
          }
        }
      }
    })
    .catch(() => { /* connection lost */ });

  return () => controller.abort();
}
