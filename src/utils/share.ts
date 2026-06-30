import { type Node, type Edge } from '@xyflow/react';
import { NodeData } from '@/types';

/** Encode workflow to URL hash */
export function encodeWorkflow(nodes: Node<NodeData>[], edges: Edge[]): string {
  const slim = {
    nodes: nodes.map(n => ({
      id: n.id, type: n.type, position: n.position, data: n.data,
    })),
    edges: edges.map(e => ({
      id: e.id, source: e.source, target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined,
      type: e.type || undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
      style: e.style || undefined,
      labelStyle: e.labelStyle || undefined,
      labelBgStyle: e.labelBgStyle || undefined,
      labelBgPadding: e.labelBgPadding || undefined,
      markerEnd: e.markerEnd || undefined,
      animated: e.animated || undefined,
    })),
  };
  return btoa(encodeURIComponent(JSON.stringify(slim)));
}

/** Decode workflow from URL hash */
export function decodeWorkflow(hash: string): { nodes: Node<NodeData>[]; edges: Edge[] } | null {
  try {
    const json = decodeURIComponent(atob(hash.replace(/^#/, '')));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}
