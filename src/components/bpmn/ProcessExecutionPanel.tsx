import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, Check, Pause, XCircle, SkipForward } from "lucide-react";
import { toast } from "sonner";
import StartNode from "./nodes/StartNode";
import EndNode from "./nodes/EndNode";
import TaskNode from "./nodes/TaskNode";
import GatewayNode from "./nodes/GatewayNode";
import EventNode from "./nodes/EventNode";

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  taskNode: TaskNode,
  gatewayNode: GatewayNode,
  eventNode: EventNode,
};

interface ProcessExecutionPanelProps {
  process: {
    id: string;
    title: string;
    nodes: any[];
    edges: any[];
  };
  onBack: () => void;
}

interface Instance {
  id: string;
  status: string;
  current_node_ids: string[];
  started_at: string;
  completed_at: string | null;
}

interface LogEntry {
  id: string;
  node_id: string;
  node_label: string | null;
  action: string;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

const ProcessExecutionPanel = ({ process, onBack }: ProcessExecutionPanelProps) => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [activeInstance, setActiveInstance] = useState<Instance | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  const processNodes = process.nodes as Node[];
  const processEdges = process.edges as Edge[];

  const fetchInstances = async () => {
    const { data } = await supabase
      .from("bpmn_process_instances")
      .select("*")
      .eq("process_id", process.id)
      .order("started_at", { ascending: false });
    setInstances((data as Instance[]) ?? []);
    setLoading(false);
  };

  const fetchLogs = async (instanceId: string) => {
    const { data } = await supabase
      .from("bpmn_execution_log")
      .select("*")
      .eq("instance_id", instanceId)
      .order("created_at", { ascending: true });
    setLogs((data as LogEntry[]) ?? []);
  };

  useEffect(() => { fetchInstances(); }, []);
  useEffect(() => {
    if (activeInstance) fetchLogs(activeInstance.id);
  }, [activeInstance]);

  const startNewInstance = async () => {
    const startNode = processNodes.find((n) => n.type === "startNode");
    if (!startNode) return toast.error("Processo não possui nó de início");

    const { data, error } = await supabase
      .from("bpmn_process_instances")
      .insert({
        process_id: process.id,
        title: `${process.title} - Execução`,
        started_by: user?.id ?? "",
        current_node_ids: [startNode.id],
      })
      .select()
      .single();

    if (error) return toast.error("Erro ao iniciar execução");

    // Log start
    await supabase.from("bpmn_execution_log").insert({
      instance_id: data.id,
      node_id: startNode.id,
      node_label: (startNode.data?.label as string) ?? "Início",
      action: "iniciado",
      performed_by: user?.email ?? "",
    });

    toast.success("Execução iniciada!");
    setActiveInstance(data as Instance);
    fetchInstances();
  };

  const advanceExecution = async () => {
    if (!activeInstance) return;
    const currentIds = activeInstance.current_node_ids;

    // Find next nodes
    const nextNodeIds: string[] = [];
    for (const currentId of currentIds) {
      const outEdges = processEdges.filter((e) => e.source === currentId);
      for (const edge of outEdges) {
        nextNodeIds.push(edge.target);
      }
    }

    if (nextNodeIds.length === 0) return toast.info("Nenhum nó conectado para avançar");

    const isEnd = nextNodeIds.some((id) => {
      const node = processNodes.find((n) => n.id === id);
      return node?.type === "endNode";
    });

    // Log transition
    for (const nodeId of nextNodeIds) {
      const node = processNodes.find((n) => n.id === nodeId);
      await supabase.from("bpmn_execution_log").insert({
        instance_id: activeInstance.id,
        node_id: nodeId,
        node_label: (node?.data?.label as string) ?? "Nó",
        action: isEnd ? "concluído" : "avançado",
        performed_by: user?.email ?? "",
        notes: notes || null,
      });
    }

    // Update instance
    const updateData: any = { current_node_ids: nextNodeIds };
    if (isEnd) {
      updateData.status = "concluida";
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from("bpmn_process_instances")
      .update(updateData)
      .eq("id", activeInstance.id);

    setNotes("");
    toast.success(isEnd ? "Processo concluído!" : "Avançado para próxima etapa");

    // Refresh
    const { data } = await supabase
      .from("bpmn_process_instances")
      .select("*")
      .eq("id", activeInstance.id)
      .single();
    setActiveInstance(data as Instance);
    fetchLogs(activeInstance.id);
    fetchInstances();
  };

  const cancelInstance = async () => {
    if (!activeInstance || !confirm("Cancelar esta execução?")) return;
    await supabase
      .from("bpmn_process_instances")
      .update({ status: "cancelada" })
      .eq("id", activeInstance.id);
    await supabase.from("bpmn_execution_log").insert({
      instance_id: activeInstance.id,
      node_id: "system",
      node_label: "Sistema",
      action: "cancelado",
      performed_by: user?.email ?? "",
    });
    toast.info("Execução cancelada");
    setActiveInstance(null);
    fetchInstances();
  };

  // Highlight current nodes on the flow
  const highlightedNodes: Node[] = processNodes.map((n) => ({
    ...n,
    style: activeInstance?.current_node_ids?.includes(n.id)
      ? { filter: "drop-shadow(0 0 8px hsl(var(--primary)))" } as React.CSSProperties
      : { opacity: 0.5 } as React.CSSProperties,
  }));

  const currentNodeLabels = activeInstance
    ? activeInstance.current_node_ids
        .map((id) => {
          const node = processNodes.find((n) => n.id === id);
          return (node?.data?.label as string) ?? id;
        })
        .join(", ")
    : "";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b bg-card p-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <h2 className="font-semibold">{process.title} — Execução</h2>
        <div className="ml-auto">
          <Button size="sm" onClick={startNewInstance}>
            <Play className="mr-1 h-4 w-4" /> Nova Execução
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Instances list */}
        <div className="w-72 shrink-0 overflow-y-auto border-r bg-card p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Execuções</p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : instances.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma execução</p>
          ) : (
            <div className="space-y-2">
              {instances.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setActiveInstance(inst)}
                  className={`w-full rounded-lg border p-2 text-left text-xs transition-colors ${
                    activeInstance?.id === inst.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={
                        inst.status === "concluida"
                          ? "border-emerald-300 text-emerald-700"
                          : inst.status === "cancelada"
                          ? "border-red-300 text-red-700"
                          : "border-blue-300 text-blue-700"
                      }
                    >
                      {inst.status === "em_andamento" ? "Em Andamento" : inst.status === "concluida" ? "Concluída" : "Cancelada"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(inst.started_at).toLocaleDateString("pt-BR")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flow + Controls */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1">
            <ReactFlow
              nodes={activeInstance ? highlightedNodes : processNodes}
              edges={processEdges}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              className="bg-muted/30"
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            </ReactFlow>
          </div>

          {activeInstance && activeInstance.status === "em_andamento" && (
            <div className="border-t bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge>Etapa Atual:</Badge>
                <span className="text-sm font-medium">{currentNodeLabels}</span>
              </div>
              <Textarea
                placeholder="Observações desta etapa (opcional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={advanceExecution}>
                  <SkipForward className="mr-1 h-4 w-4" /> Avançar
                </Button>
                <Button variant="destructive" size="sm" onClick={cancelInstance}>
                  <XCircle className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Execution Log */}
        {activeInstance && (
          <div className="w-72 shrink-0 overflow-y-auto border-l bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Trilha de Auditoria</p>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border p-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      <span className="font-medium">{log.node_label}</span>
                    </div>
                    {log.notes && <p className="mt-1 text-muted-foreground">{log.notes}</p>}
                    <p className="mt-1 text-muted-foreground">
                      {log.performed_by} · {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessExecutionPanel;
