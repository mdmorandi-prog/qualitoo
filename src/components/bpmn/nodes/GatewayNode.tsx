import { Handle, Position, type NodeProps } from "@xyflow/react";

const GatewayNode = ({ data, selected }: NodeProps) => (
  <div className="relative flex items-center justify-center" style={{ width: 70, height: 70 }}>
    <div
      className={`absolute h-[50px] w-[50px] rotate-45 border-2 bg-amber-50 shadow-sm transition-all dark:bg-amber-950 ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-amber-400 dark:border-amber-600"
      }`}
    />
    <span className="relative z-10 text-[10px] font-bold text-amber-800 dark:text-amber-200">
      {(data.label as string) ?? "?"}
    </span>
    <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-amber-500 !bg-amber-200" />
    <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-amber-500 !bg-amber-200" />
    <Handle type="source" position={Position.Right} id="right" className="!h-3 !w-3 !border-2 !border-amber-500 !bg-amber-200" />
    <Handle type="source" position={Position.Left} id="left" className="!h-3 !w-3 !border-2 !border-amber-500 !bg-amber-200" />
  </div>
);

export default GatewayNode;
