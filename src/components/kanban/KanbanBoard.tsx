import { useState } from "react";
import { GripVertical, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KanbanItem {
  id: string;
  title: string;
  who: string | null;
  when_end: string | null;
  progress: number;
  origin_type: string | null;
  sector: string | null;
}

interface KanbanBoardProps {
  items: KanbanItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onItemClick: (item: KanbanItem) => void;
}

const columns = [
  { key: "pendente", label: "📋 Pendente", color: "border-t-warning" },
  { key: "em_andamento", label: "🔄 Em Andamento", color: "border-t-accent" },
  { key: "concluido", label: "✅ Concluído", color: "border-t-safe" },
];

const originLabels: Record<string, string> = {
  non_conformity: "NC", audit: "Auditoria", capa: "CAPA",
  risk: "Risco", adverse_event: "EA", change_request: "Mudança", manual: "Manual",
};

export default function KanbanBoard({ items, onStatusChange, onItemClick }: KanbanBoardProps) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  };

  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (dragItem) {
      onStatusChange(dragItem, colKey);
    }
    setDragItem(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDragOverCol(null);
  };

  const getItemsByStatus = (status: string) => items.filter(i => {
    if (status === "pendente") return !["em_andamento", "concluido"].includes((i as any).status ?? "pendente") || (i as any).status === "pendente";
    return (i as any).status === status;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {columns.map(col => {
        const colItems = items.filter((i: any) => i.status === col.key);
        return (
          <div
            key={col.key}
            className={`rounded-xl border-t-4 ${col.color} border bg-card min-h-[200px] transition-colors ${dragOverCol === col.key ? "bg-primary/5" : ""}`}
            onDragOver={e => handleDragOver(e, col.key)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => handleDrop(e, col.key)}
          >
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{col.label}</h4>
                <Badge variant="outline" className="text-[10px]">{colItems.length}</Badge>
              </div>
            </div>
            <div className="p-2 space-y-2">
              {colItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onItemClick(item)}
                  className={`cursor-grab active:cursor-grabbing rounded-lg border bg-background p-3 shadow-sm hover:shadow-md transition-all ${dragItem === item.id ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.origin_type && item.origin_type !== "manual" && (
                          <Badge variant="outline" className="text-[9px] h-4">{originLabels[item.origin_type] || item.origin_type}</Badge>
                        )}
                        {item.sector && <Badge variant="outline" className="text-[9px] h-4">{item.sector}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        {item.who && <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{item.who}</span>}
                        {item.when_end && (
                          <span className={`flex items-center gap-0.5 ${new Date(item.when_end) < new Date() && col.key !== "concluido" ? "text-destructive font-medium" : ""}`}>
                            <Clock className="h-2.5 w-2.5" />{new Date(item.when_end).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {colItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Arraste itens aqui</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
