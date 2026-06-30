import { AttackMetric, ExecutionSummary } from '@/types';

// ── SSE-based execution stream ──────────────────────────────────

type StreamCallback = {
  onStep: (message: string, progress: number) => void;
  onMetric: (metric: AttackMetric, totalSamples: number) => void;
  onResult: (summary: ExecutionSummary) => void;
  onError: (error: string) => void;
};

export async function executePipeline(
  chain: string[],
  defenseParams: Record<string, unknown>,
  callbacks: StreamCallback
): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765';

  // Fetch — network errors throw so caller can detect backend down
  const response = await fetch(`${API_URL}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chain,
      defense_params: defenseParams,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    callbacks.onError(`HTTP ${response.status}: ${text}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('无法读取响应流');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
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
                callbacks.onStep(event.message || '', event.progress || 0);
                break;

              case 'metric_update': {
                // Backend sends metrics as Record<string, number>:
                // {"Clean": 95.2, "PGD": 38.4, "FGSM": 52.1, "AutoAttack": 12.3}
                // Emit one callback per attack so Redux can update individually
                const liveMetrics = event.metrics;
                const batchSamples = Number(event.samples ?? 0);
                const totalSamples = Number(event.total_samples ?? 0);
                if (liveMetrics && typeof liveMetrics === 'object') {
                  for (const [name, accuracy] of Object.entries(liveMetrics)) {
                    callbacks.onMetric({
                      name,
                      accuracy: Number(accuracy),
                      samples: batchSamples,
                    }, totalSamples || batchSamples);
                  }
                }
                break;
              }

              case 'result': {
                // Backend sends summary.metrics as Record<string, number>
                // Convert to AttackMetric[] for our Redux store
                const rawSummary = event.summary || {};
                const rawMetrics = rawSummary.metrics;
                const totalSamples = Number(rawSummary.samples || 0);

                let metricsArray: Array<{ name: string; accuracy: number; samples: number }> = [];
                if (rawMetrics && typeof rawMetrics === 'object') {
                  metricsArray = Object.entries(rawMetrics).map(([name, accuracy]) => ({
                    name,
                    accuracy: Number(accuracy),
                    samples: totalSamples,
                  }));
                }

                callbacks.onResult({
                  dataset: String(rawSummary.dataset || ''),
                  model: String(rawSummary.model || ''),
                  attacks: Array.isArray(rawSummary.attacks) ? rawSummary.attacks.map(String) : [],
                  defenses: Array.isArray(rawSummary.defenses) ? rawSummary.defenses.map(String) : [],
                  metrics: metricsArray,
                  totalSamples,
                });
                break;
              }

              case 'error':
                callbacks.onError(event.message || '执行失败');
                break;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    }
  } catch (err) {
    // Stream read error — backend disconnected mid-stream
    callbacks.onError(`流中断: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Mock execution for demo/testing ─────────────────────────────
// Simulates real backend behavior: progressive per-batch metric updates
export function mockExecute(
  chain: string[],
  callbacks: StreamCallback
): void {
  const seed = chain.length * 7 + (chain[0]?.length || 0);
  const ALL_KNOWN_ATTACKS = ['Clean', 'FGSM', 'PGD', 'AutoAttack', 'CW', 'SQUARE'];
  const hasDefense = chain.some(c => ['iedn', 'ebm', 'diffpure', 'pgdat', 'trades', 'dwe', 'ahd'].includes(c));
  const defBonus = hasDefense ? 15 : 0;

  // Extract attack methods from chain (match backend ATTACK_NAME_MAP keys)
  const attackNames = ALL_KNOWN_ATTACKS.filter(a => chain.includes(a));
  if (attackNames.length === 0) attackNames.push('Clean');

  // Target final accuracy for each attack (deterministic from seed)
  const targetAccuracy: Record<string, number> = {};
  for (const name of attackNames) {
    const baseAcc =
      name === 'Clean' ? 92 :
      name === 'FGSM' ? 55 :
      name === 'PGD' ? 35 :
      name === 'CW' ? 15 :
      name === 'AutoAttack' ? 12 :
      name === 'SQUARE' ? 8 : 30;
    targetAccuracy[name] = Math.min(99, baseAcc + defBonus + ((seed + attackNames.indexOf(name) * 3) % 7));
  }

  const totalBatches = 20;          // Simulate 20 batches
  const totalSamplesPerAttack = 10000;
  const samplesPerBatch = totalSamplesPerAttack / totalBatches;

  // ── Phase 1: Setup steps (fast) ──────────────────────────
  const setupSteps = [
    { msg: '解析工作流链...', pct: 5 },
    { msg: '加载数据集...', pct: 12 },
    { msg: '加载模型权重...', pct: 20 },
  ];

  if (hasDefense) {
    setupSteps.push({ msg: '初始化防御策略...', pct: 28 });
  }

  setupSteps.push(
    { msg: '准备攻击方法: ' + attackNames.join(', '), pct: 35 },
    { msg: '开始逐批次对抗攻击评估...', pct: 40 }
  );

  let stepIdx = 0;
  const totalSteps = setupSteps.length;

  function runSetupStep() {
    if (stepIdx < totalSteps) {
      const s = setupSteps[stepIdx];
      callbacks.onStep(s.msg, s.pct);
      stepIdx++;
      setTimeout(runSetupStep, 350 + (seed % 200));
    } else {
      // ── Phase 2: Progressive batch evaluation ──────────
      runBatchEvaluation(0);
    }
  }

  function runBatchEvaluation(batch: number) {
    if (batch >= totalBatches) {
      // ── Phase 3: Finalize ─────────────────────────────
      callbacks.onStep('汇总评估结果...', 98);

      const finalMetrics = attackNames.map(name => ({
        name,
        accuracy: targetAccuracy[name],
        samples: totalSamplesPerAttack,
      }));

      setTimeout(() => {
        callbacks.onResult({
          dataset: chain[0] || 'CIFAR-10',
          model: chain.find(c => ['resnet18', 'wideresnet'].includes(c)) || 'ResNet-18',
          attacks: attackNames,
          defenses: chain.filter(c => ['iedn', 'ebm', 'diffpure', 'pgdat', 'trades', 'dwe', 'ahd'].includes(c)),
          metrics: finalMetrics,
          totalSamples: totalSamplesPerAttack * attackNames.length,
        });
      }, 500);
      return;
    }

    // Calculate progress: 40% → 98% spread over batches
    const evalProgress = 40 + Math.round((batch / totalBatches) * 58);
    const currentBatch = batch + 1;

    // Emit step update for every 4th batch (less noisy)
    if (batch % 4 === 0) {
      const attackLabel = attackNames[Math.floor(batch / (totalBatches / attackNames.length))] || attackNames[0];
      callbacks.onStep(
        `评估 ${attackLabel}: 批次 ${currentBatch}/${totalBatches} (${evalProgress}%)`,
        evalProgress
      );
    }

    // Emit progressive metric for EACH attack — simulates backend batch loop
    for (const name of attackNames) {
      // Accuracy converges from a noisy start toward the target
      const convergence = currentBatch / totalBatches; // 0→1
      const noise = (Math.sin(batch * 0.7 + attackNames.indexOf(name) * 1.3) * (1 - convergence) * 8);
      const currentAcc = Math.round(
        (targetAccuracy[name] * convergence + (targetAccuracy[name] * 0.6) * (1 - convergence) + noise) * 10
      ) / 10;

      callbacks.onMetric({
        name,
        accuracy: Math.max(0, Math.min(99.9, currentAcc)),
        samples: currentBatch * samplesPerBatch,
      }, totalSamplesPerAttack);
    }

    // Variable delay: faster early batches, slower later (simulates real eval)
    const delay = 120 + (batch % 5 === 0 ? 200 : 0) + (seed % 80);
    setTimeout(() => runBatchEvaluation(currentBatch), delay);
  }

  setTimeout(runSetupStep, 300);
}
