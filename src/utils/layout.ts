import { type Node, type Edge } from '@xyflow/react';
import { NodeData } from '@/types';

const H_SPACING = 360; // horizontal gap — enough space for edge labels
const V_SPACING = 200; // vertical gap — avoid edge label collision
const NODE_W = 220;     // approximate node width for positioning
const NODE_H = 120;     // approximate node height

export function autoLayout(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  if (nodes.length === 0) return nodes;

  // 1. Build adjacency and in-degree
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const n of nodes) {
    adjacency.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    const list = adjacency.get(e.source);
    if (list && nodeMap.has(e.target)) list.push(e.target);
    if (nodeMap.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }

  // 2. Kahn topological sort into layers
  const layers: string[][] = [];
  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const layer: string[] = [];
    const nextQueue: string[] = [];

    for (const id of queue) {
      if (visited.has(id)) continue;
      visited.add(id);
      layer.push(id);
      for (const neighbor of adjacency.get(id) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0 && !visited.has(neighbor)) nextQueue.push(neighbor);
      }
    }

    if (layer.length > 0) layers.push(layer);
    queue.length = 0;
    queue.push(...nextQueue);
  }

  // 3. Add disconnected nodes as a trailing layer
  const remaining = nodes.filter(n => !visited.has(n.id));
  if (remaining.length > 0) layers.push(remaining.map(n => n.id));

  // 4. Sort nodes within each layer for minimal edge crossing
  for (let i = 1; i < layers.length; i++) {
    const prevLayer = layers[i - 1];
    const currentLayer = layers[i];

    // Weight nodes by the average index of their sources in the previous layer
    const barycenter = new Map<string, number>();
    for (const nodeId of currentLayer) {
      const sources = edges.filter(e => e.target === nodeId).map(e => e.source);
      if (sources.length === 0) {
        barycenter.set(nodeId, prevLayer.length / 2);
      } else {
        let sum = 0;
        let count = 0;
        for (const src of sources) {
          const idx = prevLayer.indexOf(src);
          if (idx >= 0) { sum += idx; count++; }
        }
        barycenter.set(nodeId, count > 0 ? sum / count : prevLayer.length / 2);
      }
    }
    currentLayer.sort((a, b) => (barycenter.get(a) || 0) - (barycenter.get(b) || 0));
  }

  // 5. Assign positions
  const positioned = nodes.map(n => ({ ...n }));
  const totalLayers = layers.length;

  for (let li = 0; li < totalLayers; li++) {
    const layer = layers[li];
    const layerHeight = (layer.length - 1) * V_SPACING;
    const baseY = 200 - layerHeight / 2;

    for (let ni = 0; ni < layer.length; ni++) {
      const node = positioned.find(n => n.id === layer[ni]);
      if (!node) continue;

      node.position = {
        x: 80 + li * H_SPACING,
        y: baseY + ni * V_SPACING,
      };
    }
  }

  return positioned;
}
