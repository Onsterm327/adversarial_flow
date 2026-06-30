import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type Node, type Edge } from '@xyflow/react';
import { RootState } from '@/store';
import { loadWorkflow } from '@/store/slices/flowSlice';
import { NodeData } from '@/types';

const MAX_HISTORY = 50;

interface Snapshot {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export function useUndoRedo() {
  const dispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.flow);

  const history = useRef<Snapshot[]>([]);
  const pointer = useRef(-1);
  const ignoring = useRef(false);
  // Force re-render so buttons enable/disable
  const [, setTick] = useState(0);

  // Push current state onto history stack (called before changes)
  const snapshot = useCallback(() => {
    if (ignoring.current) return;
    // Truncate any future history when a new action is taken
    if (pointer.current < history.current.length - 1) {
      history.current = history.current.slice(0, pointer.current + 1);
    }
    history.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (history.current.length > MAX_HISTORY) {
      history.current.shift();
    } else {
      pointer.current++;
    }
  }, [nodes, edges]);

  // Track changes: on every nodes/edges change, push previous state
  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);

  useEffect(() => {
    if (ignoring.current) return;
    if (nodes === prevNodesRef.current && edges === prevEdgesRef.current) return;
    // Push the OLD state before this change
    history.current.push({
      nodes: JSON.parse(JSON.stringify(prevNodesRef.current)),
      edges: JSON.parse(JSON.stringify(prevEdgesRef.current)),
    });
    if (history.current.length > MAX_HISTORY) {
      history.current.shift();
    } else {
      pointer.current = history.current.length - 1;
    }
    prevNodesRef.current = nodes;
    prevEdgesRef.current = edges;
    setTick(t => t + 1);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (pointer.current <= 0) return;
    ignoring.current = true;
    pointer.current--;
    const snap = history.current[pointer.current];
    dispatch(loadWorkflow({ nodes: snap.nodes, edges: snap.edges }));
    prevNodesRef.current = snap.nodes;
    prevEdgesRef.current = snap.edges;
    setTick(t => t + 1);
    setTimeout(() => { ignoring.current = false; }, 100);
  }, [dispatch]);

  const redo = useCallback(() => {
    if (pointer.current >= history.current.length - 1) return;
    ignoring.current = true;
    pointer.current++;
    const snap = history.current[pointer.current];
    dispatch(loadWorkflow({ nodes: snap.nodes, edges: snap.edges }));
    prevNodesRef.current = snap.nodes;
    prevEdgesRef.current = snap.edges;
    setTick(t => t + 1);
    setTimeout(() => { ignoring.current = false; }, 100);
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return {
    canUndo: pointer.current > 0,
    canRedo: pointer.current < history.current.length - 1,
    undo,
    redo,
  };
}
