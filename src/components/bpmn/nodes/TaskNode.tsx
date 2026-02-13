import { Handle, Position, type NodeProps } from "@xyflow/react";

const TaskNode = ({ data, selected }: NodeProps) => (
  <div
    className={`min-w-[140px] rounded-lg border-2 bg-card px-4 py-3 shadow-sm transition-all ${
      selected ? "border-primary ring-2 ring-primary/30" : "border-border"
    }`}
  >
    <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-primary !bg-primary/30" />
    <p className="text-center text-xs font-semibold text-foreground">{(data.label as string) ?? "Tarefa"}</p>
    {data.responsible && (
      <p className="mt-1 text-center text-[10px] text-muted-foreground">👤 {data.responsible as string}</p>
    )}
    {data.duration && (
      <p className="text-center text-[10px] text-muted-foreground">⏱ {data.duration as string}</p>
    )}
    <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-primary !bg-primary/30" />
  </div>
);

export default TaskNode;
