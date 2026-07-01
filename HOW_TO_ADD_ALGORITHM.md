# 如何新增算法

本文档说明在对抗防御工作流系统中新增算法（攻击 / 防御 / 数据集 / 模型）的完整步骤。

---

## 目录

- [攻击方法](#攻击方法)
- [防御方法](#防御方法)
- [数据集](#数据集)
- [模型](#模型)

---

## 攻击方法

以新增 `PGD-L2` 为例。

### 步骤 1：后端实现攻击类

在 `backend/attack/main.py` 中新增攻击类：

```python
# backend/attack/main.py

class PGDL2Attack:
    def __init__(self, model, num_class):
        self.model = model
        # L2-norm PGD 实现
    def attack(self, inputs, targets):
        # 返回对抗样本
        return adv_inputs
```

> **命名规则**：类名必须为 `{内部名}Attack`，例如内部名 `PGDL2` → 类名 `PGDL2Attack`。
> 类必须有 `__init__(self, model, num_class)` 和 `attack(self, inputs, targets)` 两个方法。
> 如果用到 `AutoAttack` 库，参考已有的 `SQUAREAttack`、`AAAttack` 写法。

### 步骤 2：注册名称映射

在 `backend/main.py` 的 `ATTACK_NAME_MAP` 中新增：

```python
# backend/main.py  ~第50行
ATTACK_NAME_MAP = {
    "Clean":      "NONE",
    "PGD":        "PGD",
    "FGSM":       "FGSM",
    "AutoAttack": "AA",
    "CW":         "CW",
    "SQUARE":     "SQUARE",
    "PGD-L2":     "PGDL2",   # ← key 为前端显示名，value 为内部标识
}
```

### 步骤 3：前端卡片定义

在 `src/data/cards.ts` 的 `availableAttacks` 中添加：

```typescript
// src/data/cards.ts ~第48-58行
{
  id: 'adversary',
  name: '对抗攻击',
  category: 'attack',
  description: '经典对抗攻击方法集合',
  availableAttacks: ['PGD', 'FGSM', 'AutoAttack', 'CW', 'SQUARE', 'PGD-L2'], // ← 新增
},
```

### 步骤 4：前端颜色注册

在 `src/components/nodes/AttackNode.tsx` 和 `src/components/panels/AttackConfig.tsx` 的颜色表中新增：

```typescript
const ATTACK_COLORS: Record<string, ...> = {
  // ... existing ...
  'PGD-L2': 'error',   // ← 可选: success/error/warning/info/secondary
};
```

### 步骤 5：排序列表（可选）

在 `src/components/nodes/ResultNode.tsx` 和 `src/components/layout/BottomBar.tsx` 中更新排序：

```typescript
const order = ['Clean', 'FGSM', 'PGD', 'AutoAttack', 'CW', 'SQUARE', 'PGD-L2'];
```

---

## 防御方法

防御分为 4 个子类型，标识了颜色和连线样式：

| 子类型 | 标识符 | 颜色 | 示例 |
|---|---|---|---|
| 输入重构 | `input_reconstruction` | `#06b6d4` cyan | DiffPure, EBM, IEDN |
| 对抗训练 | `adversarial_training` | `#10b981` green | PGD-AT, TRADES |
| 主动防御 | `active_defense` | `#f97316` orange | AHD |
| 集成防御 | `ensemble_defense` | `#8b5cf6` violet | DWE |

以在「对抗训练」中新增 `FreeAT` 为例。

### 步骤 1：后端实现

根据防御类型，在对应模块中实现：

| 防御子类型 | 后端目录 |
|---|---|
| 输入重构 | `backend/reconstruction_defense/` |
| 对抗训练 | 训练阶段生效，推理时在模型加载中传入 |
| 主动防御 | `backend/active_defense/` |
| 集成防御 | `backend/ensemble_defense/` |

### 步骤 2：注册名称映射

在 `backend/main.py` 的 `DEFENSE_NAMES_CN` 中新增：

```python
# backend/main.py ~第58行
DEFENSE_NAMES_CN = {
    # ... existing ...
    "FreeAT": "FreeAT 对抗训练",   # ← key 为前端显示名，value 为中文描述
}
```

> **注意**：key 必须与前端卡片 `name` 字段完全一致。

### 步骤 3：前端卡片定义

在 `src/data/cards.ts` 的防御区域新增：

```typescript
// src/data/cards.ts
{
  id: 'freeat',                       // 唯一 ID
  name: 'FreeAT',                     // 显示名（需与 DEFENSE_NAMES_CN 的 key 一致）
  category: 'defense',
  defenseSubtype: 'adversarial_training',  // 子类型
  description: 'Free Adversarial Training — 快速对抗训练方法',
},
```

> 颜色和连线标签按 `defenseSubtype` 自动分配，无需额外配置。

---

## 数据集

### 步骤 1：后端数据加载

`backend/dataset/load_dataset.py` 中实现加载逻辑。

### 步骤 2：注册名称映射

```python
# backend/main.py ~第38行
DATASET_NAME_MAP = {
    # ... existing ...
    "MNIST": "mnist",   # ← 新增
}
```

### 步骤 3：前端卡片定义

```typescript
// src/data/cards.ts
{
  id: 'mnist',
  name: 'MNIST',
  category: 'dataset',
  description: '手写数字数据集，28×28 灰度图，10 类',
},
```

---

## 模型

### 步骤 1：后端模型实现

`backend/models/` 中实现模型结构和加载逻辑。

### 步骤 2：注册名称映射

```python
# backend/main.py ~第45行
MODEL_NAME_MAP = {
    # ... existing ...
    "VGG-16": "vgg16",   # ← 新增
}
```

### 步骤 3：前端卡片定义

```typescript
// src/data/cards.ts
{
  id: 'vgg16',
  name: 'VGG-16',
  category: 'model',
  description: '16 层 VGG 卷积网络',
},
```

---

## 快速检查清单

按类型确定要改哪些文件：

| 类型 | 后端实现 | 后端 Map | 前端 cards.ts | 前端颜色/排序 |
|---|---|---|---|---|
| 攻击 | `attack/main.py` | `ATTACK_NAME_MAP` | `availableAttacks` | AttackNode + AttackConfig + ResultNode + BottomBar |
| 防御 | 对应模块 | `DEFENSE_NAMES_CN` | 新增卡片 | 自动继承子类型颜色 |
| 数据集 | `dataset/` | `DATASET_NAME_MAP` | 新增卡片 | 无需 |
| 模型 | `models/` | `MODEL_NAME_MAP` | 新增卡片 | 无需 |

### 后端 Map 的关键约定

- Map 的 **key** 必须与前端卡片 `name` 字段**完全一致**（包括大小写、空格、连字符）
- 前端 name 来自 `cards.ts` 中的 `name` 字段
- 攻击节点：实际发送的是 `selectedAttacks` 数组中的字符串（不是攻击卡片的 `name`）

### 前端验证规则

新增防御子类型后，如需自定义连接规则，在 `src/utils/validation.ts` 的 `RULES` 数组和 `getConnectionError` 函数中添加对应规则。
