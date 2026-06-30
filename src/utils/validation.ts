import { Node, Connection, Edge } from '@xyflow/react';
import { NodeData } from '@/types';

type RuleCheck = (source: NodeData, target: NodeData) => boolean;

// ── Connection Validation Rules ─────────────────────────────────
const RULES: { check: RuleCheck; message: string }[] = [
  {
    check: (s, t) =>
      s.category === 'dataset' && t.category === 'attack',
    message: '数据集只能连接到攻击或防御节点',
  },
  {
    check: (s, t) =>
      s.category === 'dataset' &&
      t.category === 'defense' &&
      t.defenseSubtype === 'input_reconstruction',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'dataset' && t.category === 'model',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'dataset' &&
      t.category === 'defense' &&
      (t.defenseSubtype === 'adversarial_training' || t.defenseSubtype === 'ensemble_defense'),
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'attack' &&
      t.category === 'defense' &&
      t.defenseSubtype === 'input_reconstruction',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'attack' && t.category === 'model',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'attack' &&
      t.category === 'defense' &&
      (t.defenseSubtype === 'adversarial_training' || t.defenseSubtype === 'ensemble_defense'),
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'defense' &&
      s.defenseSubtype === 'active_defense' &&
      t.category === 'attack',
    message: '主动防御只能连接到攻击节点',
  },
  {
    check: (s, t) =>
      s.category === 'defense' &&
      s.defenseSubtype === 'input_reconstruction' &&
      t.category === 'model',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'defense' &&
      (s.defenseSubtype === 'adversarial_training' || s.defenseSubtype === 'ensemble_defense') &&
      t.category === 'model',
    message: '',
  },
  {
    check: (s, t) =>
      s.category === 'model' && t.category === 'result',
    message: '模型只能连接到结果节点',
  },
];

// ── Get validation error for a connection attempt ────────────────
export function getConnectionError(
  connection: Connection | Edge,
  nodes: Node<NodeData>[]
): string | null {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  if (!sourceNode || !targetNode) return '节点不存在';

  const source = sourceNode.data;
  const target = targetNode.data;

  // Same category — no self-connections (except active_defense -> attack)
  if (source.category === target.category) {
    if (source.defenseSubtype === 'active_defense' && target.category === 'attack') {
      // Active defense can connect to attack — valid
    } else {
      return '不能连接相同类型的节点';
    }
  }

  // Result nodes cannot be source
  if (source.category === 'result') {
    return '结果节点不能作为连接的起点';
  }

  // Dataset nodes cannot be target
  if (target.category === 'dataset') {
    return '数据集节点不能作为连接的目标';
  }

  // Active defense is output-only — cannot receive connections
  if (target.category === 'defense' && target.defenseSubtype === 'active_defense') {
    return '主动防御不接受输入，只能作为起点连接攻击节点';
  }

  // Adversarial training / ensemble defense cannot be source of non-model nodes
  if (
    source.category === 'defense' &&
    (source.defenseSubtype === 'adversarial_training' || source.defenseSubtype === 'ensemble_defense') &&
    target.category !== 'model'
  ) {
    return '对抗训练/集成防御只能连接到模型节点';
  }

  // Check explicit rules
  for (const rule of RULES) {
    if (rule.check(source, target)) {
      return null; // Allowed
    }
  }

  return '不支持的连接类型 — 请检查工作流规则';
}

// ── Check if connection is valid (for ReactFlow isValidConnection) ─
export function isValidConnection(
  connection: Connection | Edge,
  nodes: Node<NodeData>[]
): boolean {
  return getConnectionError(connection, nodes) === null;
}

// ── Edge label helpers ──────────────────────────────────────────
const EDGE_LABELS: Record<string, { text: string; color: string }> = {
  dataset: { text: '提供数据', color: '#3b82f6' },
  attack: { text: '生成对抗样本', color: '#f59e0b' },
  model: { text: '推理', color: '#22c55e' },
  'defense-input_reconstruction': { text: '清除噪声', color: '#a855f7' },
  'defense-adversarial_training': { text: '提高鲁棒性', color: '#a855f7' },
  'defense-active_defense': { text: '欺骗攻击者', color: '#a855f7' },
  'defense-ensemble_defense': { text: '架构稳固', color: '#a855f7' },
};

export function getEdgeStyle(sourceData: NodeData): { text: string; color: string } {
  if (sourceData.category === 'defense' && sourceData.defenseSubtype) {
    const key = `defense-${sourceData.defenseSubtype}`;
    return EDGE_LABELS[key] || { text: '防御处理', color: '#a855f7' };
  }
  return EDGE_LABELS[sourceData.category] || { text: '', color: '#64748b' };
}
