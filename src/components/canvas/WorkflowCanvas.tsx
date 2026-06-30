import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  onNodesChange,
  onEdgesChange,
  addNode,
  addEdge,
  selectNode,
} from '@/store/slices/flowSlice';
import { NodeData } from '@/types';
import { isValidConnection, getEdgeStyle } from '@/utils/validation';
import { getCardDef } from '@/data/cards';
import { DatasetNode } from '@/components/nodes/DatasetNode';
import { ModelNode } from '@/components/nodes/ModelNode';
import { AttackNode } from '@/components/nodes/AttackNode';
import { DefenseNode } from '@/components/nodes/DefenseNode';
import { ResultNode } from '@/components/nodes/ResultNode';

const nodeTypes = {
  dataset: DatasetNode,
  model: ModelNode,
  attack: AttackNode,
  defense: DefenseNode,
  result: ResultNode,
};

let nodeIdCounter = 0;
function nextNodeId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

export function WorkflowCanvas() {
  const dispatch = useDispatch();
  const { nodes, edges } = useSelector((state: RootState) => state.flow);
  const themeMode = useSelector((state: RootState) => state.ui.themeMode);
  const bgColor = themeMode === 'light' ? '#f8fafc' : '#0f172a';
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const isValid = useCallback(
    (connection: Connection | Edge) => isValidConnection(connection, nodes),
    [nodes]
  );

  const onNodesChangeHandler = useCallback(
    (changes: any[]) => dispatch(onNodesChange(changes)),
    [dispatch]
  );

  const onEdgesChangeHandler = useCallback(
    (changes: any[]) => dispatch(onEdgesChange(changes)),
    [dispatch]
  );

  const onConnectHandler = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection, nodes)) return;
      const sourceNode = nodes.find(n => n.id === connection.source);
      const edgeStyle = getEdgeStyle(sourceNode?.data as NodeData);

      const newEdge: Edge = {
        id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        type: 'smoothstep',
        animated: true,
        label: edgeStyle.text,
        style: {
          stroke: edgeStyle.color,
          strokeWidth: 2,
        },
        labelStyle: {
          fill: edgeStyle.color,
          fontWeight: 500,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: '#1e293b',
          fillOpacity: 0.9,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.color,
          width: 16,
          height: 16,
        },
      };

      dispatch(addEdge(newEdge));
    },
    [dispatch, nodes, themeMode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData('application/reactflow-card');
      if (!raw) return;

      const cardDef = JSON.parse(raw);

      // Convert screen coordinates to flow coordinates (handles zoom & pan correctly)
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: nextNodeId(),
        type: cardDef.category,
        position,
        data: {
          cardId: cardDef.id,
          label: cardDef.name,
          description: cardDef.description,
          category: cardDef.category,
          defenseSubtype: cardDef.defenseSubtype,
          selectedAttacks: ['Clean'],
          availableAttacks: cardDef.availableAttacks || [],
          defenseParams: cardDef.id === 'dwe' ? { atk: 1 } : {},
        },
      };

      dispatch(addNode(newNode));
    },
    [dispatch]
  );

  const onPaneClick = useCallback(() => {
    dispatch(selectNode(null));
  }, [dispatch]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      dispatch(selectNode(node.id));
    },
    [dispatch]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { stroke: themeMode === 'light' ? '#94a3b8' : '#64748b', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed as const, color: themeMode === 'light' ? '#94a3b8' : '#64748b', width: 14, height: 14 },
    }),
    [themeMode]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnectHandler}
        isValidConnection={isValid}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Control"
        snapToGrid
        snapGrid={[16, 16]}
        style={{ background: bgColor }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{ display: 'flex' }}
        />
        <MiniMap
          position="bottom-left"
          style={{ width: 160, height: 100 }}
          nodeColor={(node) => {
            const data = node.data as NodeData | undefined;
            if (!data) return '#64748b';
            const colors: Record<string, string> = {
              dataset: '#3b82f6',
              model: '#22c55e',
              attack: '#f59e0b',
              defense: '#a855f7',
              result: '#ec4899',
            };
            return colors[data.category] || '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}
