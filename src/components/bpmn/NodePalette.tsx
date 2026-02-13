import { Circle, Square, Diamond, Zap, StopCircle } from "lucide-react";

const paletteItems = [
  { type: "startNode", label: "Início", icon: Circle, color: "text-emerald-500" },
  { type: "taskNode", label: "Tarefa", icon: Square, color: "text-primary" },
  { type: "gatewayNode", label: "Decisão", icon: Diamond, color: "text-amber-500" },
  { type: "eventNode", label: "Evento", icon: Zap, color: "text-violet-500" },
  { type: "endNode", label: "Fim", icon: StopCircle, color: "text-destructive" },
];

const NodePalette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-48 shrink-0 border-r bg-card p-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Elementos BPMN
      </p>
      <div className="space-y-2">
        {paletteItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="flex cursor-grab items-center gap-2 rounded-lg border bg-background p-2.5 text-sm font-medium transition-colors hover:border-primary hover:bg-accent active:cursor-grabbing"
          >
            <item.icon className={`h-4 w-4 ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-dashed p-3">
        <p className="text-[11px] text-muted-foreground">
          Arraste os elementos para o canvas. Conecte-os clicando e arrastando dos pontos de conexão.
        </p>
      </div>
    </div>
  );
};

export default NodePalette;
