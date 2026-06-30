import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { NodeData } from '@/types';

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
}

const initialState: FlowState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
};

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    onNodesChange(state, action: PayloadAction<NodeChange<Node<NodeData>>[]>) {
      state.nodes = applyNodeChanges(action.payload, state.nodes) as Node<NodeData>[];
    },
    onEdgesChange(state, action: PayloadAction<EdgeChange<Edge>[]>) {
      state.edges = applyEdgeChanges(action.payload, state.edges) as Edge[];
    },
    addNode(state, action: PayloadAction<Node<NodeData>>) {
      state.nodes.push(action.payload);
    },
    removeNode(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter(n => n.id !== action.payload);
      state.edges = state.edges.filter(
        e => e.source !== action.payload && e.target !== action.payload
      );
      if (state.selectedNodeId === action.payload) {
        state.selectedNodeId = null;
      }
    },
    addEdge(state, action: PayloadAction<Edge>) {
      // Prevent duplicate edges
      const exists = state.edges.some(
        e => e.source === action.payload.source && e.target === action.payload.target
      );
      if (!exists) {
        state.edges.push(action.payload);
      }
    },
    removeEdges(state, action: PayloadAction<Edge[]>) {
      const ids = new Set(action.payload.map(e => e.id));
      state.edges = state.edges.filter(e => !ids.has(e.id));
    },
    onConnect(state, action: PayloadAction<Connection>) {
      // Handled by WorkflowCanvas isValidConnection — this is a fallback
    },
    updateNodeData(state, action: PayloadAction<{ nodeId: string; data: Partial<NodeData> }>) {
      const node = state.nodes.find(n => n.id === action.payload.nodeId);
      if (node) {
        Object.assign(node.data, action.payload.data);
      }
    },
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    clearCanvas(state) {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
    },
    loadWorkflow(state, action: PayloadAction<{ nodes: Node<NodeData>[]; edges: Edge[] }>) {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.selectedNodeId = null;
    },
  },
});

export const {
  onNodesChange,
  onEdgesChange,
  addNode,
  removeNode,
  addEdge,
  removeEdges,
  onConnect,
  updateNodeData,
  selectNode,
  clearCanvas,
  loadWorkflow,
} = flowSlice.actions;
export default flowSlice.reducer;
