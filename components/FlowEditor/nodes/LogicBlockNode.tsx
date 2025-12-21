import { Handle, Position } from "reactflow";

export function LogicBlockNode({ data }: any) {
    return (
        <div className="
      rounded-md 
      border 
      bg-white 
      px-3 
      py-2 
      shadow-sm 
      min-w-[160px]
      text-gray-900
    ">
            <div className="font-semibold text-sm text-gray-900">
                {data.title || "Untitled block"}
            </div>

            {data.description && (
                <div className="text-xs text-gray-700 mt-1">
                    {data.description}
                </div>
            )}

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
