import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type Node, type Edge } from '@xyflow/react';
import { RootState } from '@/store';
import { loadWorkflow } from '@/store/slices/flowSlice';
import { setThemeMode } from '@/store/slices/uiSlice';
import { NodeData } from '@/types';

const STORAGE_KEY = 'adversarial-defense-workflow';

// ── Safe serialization — only persist essential fields ────────

interface PersistedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonStyle = any;

interface PersistedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  style?: JsonStyle;
  labelStyle?: JsonStyle;
  labelBgStyle?: JsonStyle;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  markerEnd?: JsonStyle;
  animated?: boolean;
}

interface PersistedWorkflow {
  nodes: PersistedNode[];
  edges: PersistedEdge[];
}

function toPersisted(nodes: Node<NodeData>[], edges: Edge[]): PersistedWorkflow {
  return {
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type || 'default',
      position: { x: n.position.x, y: n.position.y },
      data: n.data,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined,
      type: e.type || undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
      style: e.style ? { ...e.style } : undefined,
      labelStyle: e.labelStyle ? { ...e.labelStyle } : undefined,
      labelBgStyle: e.labelBgStyle ? { ...e.labelBgStyle } : undefined,
      labelBgPadding: e.labelBgPadding || undefined,
      labelBgBorderRadius: e.labelBgBorderRadius ?? undefined,
      markerEnd: (e.markerEnd && typeof e.markerEnd === 'object') ? { ...e.markerEnd } : undefined,
      animated: e.animated || undefined,
    })),
  };
}

// ── Hook ──────────────────────────────────────────────────────

export function useWorkflowPersistence() {
  const dispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.flow);
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const initialLoadDone = useRef(false);

  // Load theme preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adversarial-defense-theme');
      if (saved === 'light' || saved === 'dark') {
        dispatch(setThemeMode(saved));
      }
    } catch { /* ignore */ }
  }, [dispatch]);

  // Persist theme changes
  useEffect(() => {
    try {
      localStorage.setItem('adversarial-defense-theme', themeMode);
    } catch { /* ignore */ }
  }, [themeMode]);

  // Load workflow once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: PersistedWorkflow = JSON.parse(raw);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges) && data.nodes.length > 0) {
          // Restore missing visual properties for edges saved by older versions
          const edges = data.edges.map((e: PersistedEdge) => {
            const strokeColor = (e.style && typeof e.style === 'object' && 'stroke' in e.style)
              ? String(e.style.stroke) : '#94a3b8';
            return {
              ...e,
              labelStyle: e.labelStyle || { fill: strokeColor, fontWeight: 500, fontSize: 11 },
              labelBgStyle: e.labelBgStyle || { fill: '#1e293b', fillOpacity: 0.9 },
              labelBgPadding: e.labelBgPadding || [8, 4],
              labelBgBorderRadius: e.labelBgBorderRadius ?? 4,
              markerEnd: e.markerEnd || { type: 'arrowclosed', color: strokeColor, width: 16, height: 16 },
            };
          });
          dispatch(loadWorkflow({
            nodes: data.nodes as Node<NodeData>[],
            edges: edges as Edge[],
          }));
          initialLoadDone.current = true;
        }
      }
    } catch (e) {
      console.warn('工作流加载失败，将使用空画布:', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Save on every change (debounced), skip before any data exists
  useEffect(() => {
    if (!initialLoadDone.current && nodes.length === 0) return;
    if (!initialLoadDone.current && nodes.length > 0) {
      initialLoadDone.current = true;
    }

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const slim = toPersisted(nodes, edges);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch (e) {
        console.warn('工作流保存失败:', e);
      }
    }, 400);
  }, [nodes, edges]);

  // Cleanup
  useEffect(() => {
    return () => clearTimeout(saveTimer.current);
  }, []);
}
