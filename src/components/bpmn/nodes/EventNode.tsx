import { Handle, Position, type NodeProps } from "@xyflow/react";

const EventNode = ({ data, selected }: NodeProps) => (
  <div
    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed bg-violet-50 text-violet-700 shadow-sm transition-all dark:bg-violet-950 dark:text-violet-300 ${
      selected ? "border-primary ring-2 ring-primary/30" : "border-violet-400 dark:border-violet-600"
    }`}
  >
    <span className="text-[9px] font-bold text-center leading-tight">{(data.label as string) ?? "Evento"}</span>
    <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-violet-500 !bg-violet-200" />
    <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-violet-500 !bg-violet-200" />
  </div>
);

export default EventNode;
