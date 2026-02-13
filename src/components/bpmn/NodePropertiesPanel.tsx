import { type Node } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NodePropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

const NodePropertiesPanel = ({ node, onUpdate, onClose }: NodePropertiesPanelProps) => {
  const data = node.data as Record<string, any>;

  const typeLabels: Record<string, string> = {
    startNode: "Evento de Início",
    endNode: "Evento de Fim",
    taskNode: "Tarefa",
    gatewayNode: "Gateway (Decisão)",
    eventNode: "Evento Intermediário",
  };

  return (
    <div className="w-72 shrink-0 overflow-y-auto border-l bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Propriedades</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">{typeLabels[node.type ?? ""] ?? "Nó"}</p>

      <div className="space-y-4">
        <div>
          <Label className="text-xs">Rótulo</Label>
          <Input
            value={(data.label as string) ?? ""}
            onChange={(e) => onUpdate(node.id, { label: e.target.value })}
            className="mt-1"
          />
        </div>

        {(node.type === "taskNode" || node.type === "eventNode") && (
          <>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={(data.description as string) ?? ""}
                onChange={(e) => onUpdate(node.id, { description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                value={(data.responsible as string) ?? ""}
                onChange={(e) => onUpdate(node.id, { responsible: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Duração Estimada</Label>
              <Input
                value={(data.duration as string) ?? ""}
                onChange={(e) => onUpdate(node.id, { duration: e.target.value })}
                className="mt-1"
                placeholder="Ex: 2 horas"
              />
            </div>
          </>
        )}

        {node.type === "gatewayNode" && (
          <div>
            <Label className="text-xs">Condição</Label>
            <Textarea
              value={(data.condition as string) ?? ""}
              onChange={(e) => onUpdate(node.id, { condition: e.target.value })}
              className="mt-1"
              rows={3}
              placeholder="Ex: Documento aprovado?"
            />
          </div>
        )}

        <div className="rounded-lg bg-muted p-2 text-[11px] text-muted-foreground">
          ID: {node.id}
        </div>
      </div>
    </div>
  );
};

export default NodePropertiesPanel;
