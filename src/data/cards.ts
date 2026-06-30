import { CardDef } from '@/types';

export const CARDS: CardDef[] = [
  // ── Datasets ──────────────────────────────────────────
  {
    id: 'cifar10',
    name: 'CIFAR-10',
    category: 'dataset',
    description: '10 类彩色图像，32×32 像素，50,000 训练 / 10,000 测试',
  },
  {
    id: 'cifar100',
    name: 'CIFAR-100',
    category: 'dataset',
    description: '100 类彩色图像，32×32 像素，500 张/类',
  },
  {
    id: 'imagenet',
    name: 'ImageNet',
    category: 'dataset',
    description: '大规模图像数据集，224×224 像素，1,000 类',
  },
  {
    id: 'stl',
    name: 'STL-10',
    category: 'dataset',
    description: '10 类高分辨率图像，96×96 像素',
  },

  // ── Models ────────────────────────────────────────────
  {
    id: 'resnet18',
    name: 'ResNet-18',
    category: 'model',
    description: '18 层残差网络，适用于图像分类任务',
  },
  {
    id: 'wideresnet',
    name: 'WideResNet-28-10',
    category: 'model',
    description: '宽度因子 10 的 Wide ResNet，28 层',
  },

  // ── Attacks ───────────────────────────────────────────
  {
    id: 'adaptive',
    name: '自适应攻击',
    category: 'attack',
    description: '自适应选择攻击策略的智能攻击节点',
    availableAttacks: ['PGD', 'FGSM', 'AutoAttack', 'CW', 'SQUARE'],
  },
  {
    id: 'adversary',
    name: '对抗攻击',
    category: 'attack',
    description: '经典对抗攻击方法集合',
    availableAttacks: ['PGD', 'FGSM', 'AutoAttack', 'CW', 'SQUARE'],
  },

  // ── Defenses: Input Reconstruction ────────────────────
  {
    id: 'diffpure',
    name: 'DiffPure',
    category: 'defense',
    defenseSubtype: 'input_reconstruction',
    description: '基于扩散模型的输入净化防御',
  },
  {
    id: 'ebm',
    name: 'EBM',
    category: 'defense',
    defenseSubtype: 'input_reconstruction',
    description: '基于能量模型的对抗样本净化',
  },
  {
    id: 'iedn',
    name: 'IEDN',
    category: 'defense',
    defenseSubtype: 'input_reconstruction',
    description: '图像增强防御网络，基于 GAN 的净化器',
  },

  // ── Defenses: Adversarial Training ─────────────────────
  {
    id: 'pgdat',
    name: 'PGD-AT',
    category: 'defense',
    defenseSubtype: 'adversarial_training',
    description: '使用 PGD 对抗样本进行训练增强',
  },
  {
    id: 'trades',
    name: 'TRADES',
    category: 'defense',
    defenseSubtype: 'adversarial_training',
    description: '在鲁棒性和准确性之间权衡的训练方法',
  },

  // ── Defenses: Active Defense ───────────────────────────
  {
    id: 'ahd',
    name: 'AHD',
    category: 'defense',
    defenseSubtype: 'active_defense',
    description: '主动混合防御，增加拒绝类输出欺骗攻击者',
  },

  // ── Defenses: Ensemble Defense ─────────────────────────
  {
    id: 'dwe',
    name: 'DWE',
    category: 'defense',
    defenseSubtype: 'ensemble_defense',
    description: '多样性加权集成，10 模型集成防御',
  },

  // ── Result ─────────────────────────────────────────────
  {
    id: 'result',
    name: '结果',
    category: 'result',
    description: '执行工作流并查看对抗攻击评估结果',
  },
];

// ── Lookup helpers ──────────────────────────────────────────────
const cardMap = new Map(CARDS.map(c => [c.id, c]));
export const getCardDef = (id: string): CardDef | undefined => cardMap.get(id);
export const getCardsByCategory = (category: CardDef['category']): CardDef[] =>
  CARDS.filter(c => c.category === category);
