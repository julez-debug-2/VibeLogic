import { Handle, Position } from "reactflow";

const ROLE_STYLES = {
    input: {
        badge: "bg-blue-100 text-blue-700 border-blue-300",
        border: "border-blue-300",
        label: "Input",
    },
    process: {
        badge: "bg-purple-100 text-purple-700 border-purple-300",
        border: "border-purple-300",
        label: "Process",
    },
    decision: {
        badge: "bg-orange-100 text-orange-700 border-orange-300",
        border: "border-orange-300",
        label: "Decision",
    },
    output: {
        badge: "bg-green-100 text-green-700 border-green-300",
        border: "border-green-300",
        label: "Output",
    },
};

export function LogicBlockNode({ data }: any) {
    const role = data.role || "process";
    const style = ROLE_STYLES[role as keyof typeof ROLE_STYLES] || ROLE_STYLES.process;
    const isDecision = role === "decision";

    return (
        <div className={`
      rounded-md 
      border-2
      ${style.border}
      bg-white 
      px-3 
      py-2 
      shadow-sm 
      min-w-[160px]
      text-gray-900
      ${isDecision ? 'relative' : ''}
    `}>
            <div className="flex items-center gap-2 mb-1">
                <span className={`
                    text-[10px] 
                    font-bold 
                    px-1.5 
                    py-0.5 
                    rounded 
                    border 
                    ${style.badge}
                `}>
                    {style.label}
                </span>
            </div>

            <div className="font-semibold text-sm text-gray-900">
                {data.title || "Untitled block"}
            </div>

            {data.description && (
                <div className="text-xs text-gray-700 mt-1">
                    {data.description}
                </div>
            )}

            {/* Top Handle - für alle */}
            <Handle type="target" position={Position.Top} />

            {/* Bottom/Side Handles - unterschiedlich je nach Role */}
            {isDecision ? (
                <>
                    {/* Decision: Zwei Ausgänge für ja/nein */}
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-[10px] text-gray-600 font-semibold pointer-events-none">
                        nein
                    </span>
                    <Handle 
                        type="source" 
                        position={Position.Left} 
                        id="no"
                        style={{ top: '50%', left: '-8px' }}
                    />

                    <Handle 
                        type="source" 
                        position={Position.Right} 
                        id="yes"
                        style={{ top: '50%', right: '-8px' }}
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 text-[10px] text-gray-600 font-semibold pointer-events-none">
                        ja
                    </span>
                </>
            ) : (
                /* Standard: Ein Ausgang unten */
                <Handle type="source" position={Position.Bottom} />
            )}
        </div>
    );
}
