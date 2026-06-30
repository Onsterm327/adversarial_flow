// ─── Card Categories ───────────────────────────────────────────
export type CardCategory = 'dataset' | 'model' | 'attack' | 'defense' | 'result';

export type DefenseSubtype =
  | 'input_reconstruction'
  | 'adversarial_training'
  | 'active_defense'
  | 'ensemble_defense';

// ─── Card Definition (Palette) ─────────────────────────────────
export interface CardDef {
  id: string;
  name: string;
  category: CardCategory;
  defenseSubtype?: DefenseSubtype;
  description: string;
  availableAttacks?: string[];
}

// ─── Node Runtime Data ─────────────────────────────────────────
export interface NodeData {
  [key: string]: unknown;
  cardId: string;
  label: string;
  description: string;
  category: CardCategory;
  defenseSubtype?: DefenseSubtype;
  selectedAttacks: string[];
  availableAttacks: string[];
  defenseParams: Record<string, unknown>;
}

// ─── Execution ─────────────────────────────────────────────────
export interface ExecutionState {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  metrics: AttackMetric[];
  totalSamples: number;
  error: string | null;
  summary: ExecutionSummary | null;
}

export interface AttackMetric {
  name: string;
  accuracy: number;
  samples: number;
}

export interface ExecutionSummary {
  dataset: string;
  model: string;
  attacks: string[];
  defenses: string[];
  metrics: AttackMetric[];
  totalSamples: number;
}

// ─── Edge Labels ────────────────────────────────────────────────
export interface EdgeLabelDef {
  text: string;
  color: string;
}

// ─── API ────────────────────────────────────────────────────────
export interface ExecuteRequest {
  chain: string[];
  defense_params: Record<string, unknown>;
}
