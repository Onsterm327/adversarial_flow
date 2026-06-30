import { type Node, type Edge } from '@xyflow/react';
import { NodeData } from '@/types';

let _id = 0;
function nid(): string { return `tpl_${++_id}`; }

function datasetNode(id: string, name: string, x: number, y: number): Node<NodeData> {
  return {
    id: nid(), type: 'dataset', position: { x, y },
    data: { cardId: id, label: name, description: '', category: 'dataset', selectedAttacks: [], availableAttacks: [], defenseParams: {} },
  };
}
function modelNode(id: string, name: string, x: number, y: number): Node<NodeData> {
  return {
    id: nid(), type: 'model', position: { x, y },
    data: { cardId: id, label: name, description: '', category: 'model', selectedAttacks: [], availableAttacks: [], defenseParams: {} },
  };
}
function attackNode(id: string, name: string, selected: string[], x: number, y: number): Node<NodeData> {
  return {
    id: nid(), type: 'attack', position: { x, y },
    data: { cardId: id, label: name, description: '', category: 'attack', selectedAttacks: selected, availableAttacks: ['PGD', 'FGSM', 'AutoAttack', 'CW', 'SQUARE'], defenseParams: {} },
  };
}
function defenseNode(id: string, name: string, subtype: string, x: number, y: number): Node<NodeData> {
  return {
    id: nid(), type: 'defense', position: { x, y },
    data: { cardId: id, label: name, description: '', category: 'defense', defenseSubtype: subtype as NodeData['defenseSubtype'], selectedAttacks: [], availableAttacks: [], defenseParams: id === 'dwe' ? { atk: 1 } : {} },
  };
}
function resultNode(x: number, y: number): Node<NodeData> {
  return {
    id: nid(), type: 'result', position: { x, y },
    data: { cardId: 'result', label: '结果', description: '', category: 'result', selectedAttacks: [], availableAttacks: [], defenseParams: {} },
  };
}
function edge(s: string, t: string): Edge {
  return { id: `tpl_e_${s}_${t}`, source: s, target: t, type: 'smoothstep', animated: true };
}

export interface Template {
  key: string;
  name: string;
  description: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export const TEMPLATES: Template[] = [
  {
    key: 'basic',
    name: '基础链路',
    description: '数据集 → 模型 → 结果（无攻击/防御，基线评估）',
    nodes: (() => {
      _id = 0;
      const ds = datasetNode('cifar10', 'CIFAR-10', 100, 200);
      const m = modelNode('resnet18', 'ResNet-18', 400, 200);
      const r = resultNode(700, 200);
      return [ds, m, r];
    })(),
    edges: (() => {
      _id = 0;
      const ds = _id + 1, m = _id + 2, r = _id + 3;
      return [edge(`tpl_${ds}`, `tpl_${m}`), edge(`tpl_${m}`, `tpl_${r}`)];
    })(),
  },
  {
    key: 'adversarial',
    name: '对抗攻击评估',
    description: '数据集 → 攻击(PGD+FGSM) → 模型 → 结果',
    nodes: (() => {
      _id = 0;
      const ds = datasetNode('cifar10', 'CIFAR-10', 0, 200);
      const atk = attackNode('adversary', '对抗攻击', ['Clean', 'PGD', 'FGSM'], 260, 200);
      const m = modelNode('resnet18', 'ResNet-18', 520, 200);
      const r = resultNode(780, 200);
      return [ds, atk, m, r];
    })(),
    edges: (() => {
      _id = 0;
      return [edge('tpl_1', 'tpl_2'), edge('tpl_2', 'tpl_3'), edge('tpl_3', 'tpl_4')];
    })(),
  },
  {
    key: 'adv_training',
    name: '对抗训练防御',
    description: '数据集 → 攻击(PGD+FGSM) + PGD-AT对抗训练 → 模型 → 结果',
    nodes: (() => {
      _id = 0;
      const ds = datasetNode('cifar10', 'CIFAR-10', 0, 160);
      const atk = attackNode('adversary', '对抗攻击', ['Clean', 'PGD', 'FGSM'], 260, 60);
      const pgdat = defenseNode('pgdat', 'PGD-AT', 'adversarial_training', 260, 300);
      const m = modelNode('resnet18', 'ResNet-18', 520, 180);
      const r = resultNode(780, 180);
      return [ds, atk, pgdat, m, r];
    })(),
    edges: (() => {
      _id = 0;
      return [
        edge('tpl_1', 'tpl_2'), // Dataset → Attack
        edge('tpl_1', 'tpl_3'), // Dataset → PGD-AT
        edge('tpl_2', 'tpl_4'), // Attack → Model
        edge('tpl_3', 'tpl_4'), // PGD-AT → Model
        edge('tpl_4', 'tpl_5'), // Model → Result
      ];
    })(),
  },
  {
    key: 'input_recon',
    name: '输入重构防御',
    description: '数据集 → 攻击 → IEDN净化 → 模型 → 结果',
    nodes: (() => {
      _id = 0;
      const ds = datasetNode('cifar10', 'CIFAR-10', 0, 180);
      const atk = attackNode('adversary', '对抗攻击', ['Clean', 'PGD', 'AutoAttack'], 230, 180);
      const df = defenseNode('iedn', 'IEDN', 'input_reconstruction', 460, 180);
      const m = modelNode('resnet18', 'ResNet-18', 690, 180);
      const r = resultNode(920, 180);
      return [ds, atk, df, m, r];
    })(),
    edges: (() => {
      _id = 0;
      return [edge('tpl_1', 'tpl_2'), edge('tpl_2', 'tpl_3'), edge('tpl_3', 'tpl_4'), edge('tpl_4', 'tpl_5')];
    })(),
  },
  {
    key: 'active_defense',
    name: '主动防御 (AHD)',
    description: '数据集 + 主动防御 → 攻击 → 模型 → 结果',
    nodes: (() => {
      _id = 0;
      const ahd = defenseNode('ahd', 'AHD', 'active_defense', 50, 80);
      const ds = datasetNode('cifar10', 'CIFAR-10', 50, 320);
      const atk = attackNode('adversary', '对抗攻击', ['Clean', 'PGD', 'FGSM', 'AutoAttack'], 300, 200);
      const m = modelNode('resnet18', 'ResNet-18', 550, 200);
      const r = resultNode(800, 200);
      return [ahd, ds, atk, m, r];
    })(),
    edges: (() => {
      _id = 0;
      return [
        edge('tpl_1', 'tpl_3'), // AHD → Attack
        edge('tpl_2', 'tpl_3'), // Dataset → Attack
        edge('tpl_3', 'tpl_4'), // Attack → Model
        edge('tpl_4', 'tpl_5'), // Model → Result
      ];
    })(),
  },
  {
    key: 'full',
    name: '完整攻防链路',
    description: '数据集 → 攻击 → IEDN净化 → PGD-AT对抗训练 → 模型 → 结果',
    nodes: (() => {
      _id = 0;
      const ds = datasetNode('cifar10', 'CIFAR-10', 0, 160);
      const atk = attackNode('adversary', '对抗攻击', ['Clean', 'PGD', 'FGSM', 'AutoAttack', 'CW'], 220, 160);
      const iedn = defenseNode('iedn', 'IEDN', 'input_reconstruction', 440, 40);
      const pgdat = defenseNode('pgdat', 'PGD-AT', 'adversarial_training', 440, 280);
      const m = modelNode('resnet18', 'ResNet-18', 660, 160);
      const r = resultNode(880, 160);
      return [ds, atk, iedn, pgdat, m, r];
    })(),
    edges: (() => {
      _id = 0;
      return [
        edge('tpl_1', 'tpl_2'),
        edge('tpl_2', 'tpl_3'), edge('tpl_2', 'tpl_4'),
        edge('tpl_3', 'tpl_5'), edge('tpl_4', 'tpl_5'),
        edge('tpl_5', 'tpl_6'),
      ];
    })(),
  },
];
