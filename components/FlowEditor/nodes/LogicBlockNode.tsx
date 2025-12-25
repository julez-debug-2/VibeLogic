import { Handle, Position } from "reactflow";

const ROLE_STYLES = {
    input: {
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        border: "border-blue-500/30",
        glow: "shadow-blue-500/20",
        gradient: "from-blue-500/10 to-blue-600/10",
        label: "Input",
        iconColor: "text-blue-400"
    },
    process: {
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        border: "border-purple-500/30",
        glow: "shadow-purple-500/20",
        gradient: "from-purple-500/10 to-purple-600/10",
        label: "Process",
        iconColor: "text-purple-400"
    },
    decision: {
        badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        border: "border-orange-500/30",
        glow: "shadow-orange-500/20",
        gradient: "from-orange-500/10 to-orange-600/10",
        label: "Decision",
        iconColor: "text-orange-400"
    },
    output: {
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        border: "border-emerald-500/30",
        glow: "shadow-emerald-500/20",
        gradient: "from-emerald-500/10 to-emerald-600/10",
        label: "Output",
        iconColor: "text-emerald-400"
    },
};

const NodeIcon = ({ role, className }: { role: string; className?: string }) => {
    switch (role) {
        case "input":
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            );
        case "process":
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
        case "decision":
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case "output":
            return (
                <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
            );
        default:
            return null;
    }
};

export function LogicBlockNode({ data }: any) {
    const role = data.role || "process";
    const style = ROLE_STYLES[role as keyof typeof ROLE_STYLES] || ROLE_STYLES.process;
    const isDecision = role === "decision";

    return (
        <div className={`
      rounded-xl 
      border-2
      ${style.border}
      bg-gradient-to-br ${style.gradient}
      backdrop-blur-xl
      bg-neutral-900/90
      px-4 
      py-3 
      shadow-lg
      ${style.glow}
      hover:shadow-xl
      hover:${style.glow}
      min-w-[180px]
      text-white
      transition-all
      duration-200
      ${isDecision ? 'relative' : ''}
    `}>
            <div className="flex items-center gap-2 mb-2">
                <NodeIcon role={role} className={`w-4 h-4 ${style.iconColor}`} />
                <span className={`
                    text-[10px] 
                    font-bold 
                    uppercase
                    tracking-wide
                    px-2 
                    py-1 
                    rounded-lg 
                    border 
                    ${style.badge}
                    backdrop-blur-sm
                `}>
                    {style.label}
                </span>
            </div>

            <div className="font-semibold text-sm text-white mb-1">
                {data.title || "Untitled block"}
            </div>

            {data.description && (
                <div className="text-xs text-gray-400 leading-relaxed">
                    {data.description}
                </div>
            )}

            {/* Top Handle - für alle */}
            <Handle 
                type="target" 
                position={Position.Top}
                className="!w-3 !h-3 !bg-white/20 !border-2 !border-white/40 backdrop-blur-sm hover:!bg-white/40 transition-all"
            />

            {/* Bottom/Side Handles - unterschiedlich je nach Role */}
            {isDecision ? (
                <>
                    {/* Decision: Zwei Ausgänge für ja/nein */}
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-3 text-[10px] text-red-400 font-bold pointer-events-none uppercase tracking-wide">
                        nein
                    </span>
                    <Handle 
                        type="source" 
                        position={Position.Left} 
                        id="no"
                        style={{ top: '50%', left: '-12px' }}
                        className="!w-3 !h-3 !bg-red-500/30 !border-2 !border-red-500/50 backdrop-blur-sm hover:!bg-red-500/60 transition-all"
                    />

                    <Handle 
                        type="source" 
                        position={Position.Right} 
                        id="yes"
                        style={{ top: '50%', right: '-12px' }}
                        className="!w-3 !h-3 !bg-green-500/30 !border-2 !border-green-500/50 backdrop-blur-sm hover:!bg-green-500/60 transition-all"
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3 text-[10px] text-green-400 font-bold pointer-events-none uppercase tracking-wide">
                        ja
                    </span>
                </>
            ) : (
                /* Standard: Ein Ausgang unten */
                <Handle 
                    type="source" 
                    position={Position.Bottom}
                    className="!w-3 !h-3 !bg-white/20 !border-2 !border-white/40 backdrop-blur-sm hover:!bg-white/40 transition-all"
                />
            )}
        </div>
    );
}
