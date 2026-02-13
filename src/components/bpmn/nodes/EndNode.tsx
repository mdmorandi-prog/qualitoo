import { Handle, Position, type NodeProps } from "@xyflow/react";

const EndNode = ({ data, selected }: NodeProps) => (
  <div
    className={`flex h-14 w-14 items-center justify-center rounded-full border-[3px] bg-red-50 text-red-700 shadow-sm transition-all dark:bg-red-950 dark:text-red-300 ${
      selected ? "border-primary ring-2 ring-primary/30" : "border-red-400 dark:border-red-600"
    }`}
  >
    <span className="text-[10px] font-bold">{(data.label as string) ?? "Fim"}</span>
    <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-red-500 !bg-red-200" />
  </div>
);

export default EndNode;
