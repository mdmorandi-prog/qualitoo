import { Handle, Position, type NodeProps } from "@xyflow/react";

const StartNode = ({ data, selected }: NodeProps) => (
  <div
    className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-emerald-50 text-emerald-700 shadow-sm transition-all dark:bg-emerald-950 dark:text-emerald-300 ${
      selected ? "border-primary ring-2 ring-primary/30" : "border-emerald-400 dark:border-emerald-600"
    }`}
  >
    <span className="text-[10px] font-bold">{(data.label as string) ?? "Início"}</span>
    <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-emerald-500 !bg-emerald-200" />
  </div>
);

export default StartNode;
