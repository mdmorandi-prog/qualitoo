import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
  MarkerType,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Upload, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import StartNode from "./nodes/StartNode";
import EndNode from "./nodes/EndNode";
import TaskNode from "./nodes/TaskNode";
import GatewayNode from "./nodes/GatewayNode";
import EventNode from "./nodes/EventNode";
import NodePalette from "./NodePalette";
import NodePropertiesPanel from "./NodePropertiesPanel";

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  taskNode: TaskNode,
  gatewayNode: GatewayNode,
  eventNode: EventNode,
};

interface BpmnEditorProps {
  process: {
    id: string;
    title: string;
    status: string;
    nodes: any[];
    edges: any[];
  };
  onBack: () => void;
}

const BpmnEditor = ({ process, onBack }: BpmnEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (process.nodes as Node[]) ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (process.edges as Edge[]) ?? []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [title, setTitle] = useState(process.title);
  const [saving, setSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const labels: Record<string, string> = {
        startNode: "Início",
        endNode: "Fim",
        taskNode: "Nova Tarefa",
        gatewayNode: "Decisão",
        eventNode: "Evento",
      };

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: labels[type] ?? "Nó",
          description: "",
          responsible: "",
          duration: "",
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    const updateData: any = {
      title,
      nodes: nodes as any,
      edges: edges as any,
    };
    if (newStatus) updateData.status = newStatus;

    const { error } = await supabase
      .from("bpmn_processes")
      .update(updateData)
      .eq("id", process.id);

    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success(newStatus === "publicado" ? "Processo publicado!" : "Processo salvo!");
  };

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) =>
        prev ? { ...prev, data: { ...prev.data, ...data } } : null
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b bg-card p-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-xs font-semibold"
        />
        <Badge variant="outline">
          {process.status === "publicado" ? "Publicado" : process.status === "arquivado" ? "Arquivado" : "Rascunho"}
        </Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
          {process.status !== "publicado" && (
            <Button size="sm" onClick={() => handleSave("publicado")} disabled={saving}>
              <Upload className="mr-1 h-4 w-4" /> Publicar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <NodePalette />

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            className="bg-muted/30"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <MiniMap
              nodeStrokeColor="hsl(var(--primary))"
              nodeColor="hsl(var(--card))"
              maskColor="hsl(var(--background) / 0.7)"
              className="!bg-card !border-border"
            />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <NodePropertiesPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
};

export default BpmnEditor;
