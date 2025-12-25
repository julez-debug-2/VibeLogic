type PaletteProps = {
    onAdd: (preset: BlockPreset) => void;
};

export type BlockPreset = {
    role: "input" | "process" | "decision" | "output";
    title: string;
    description?: string;
    usage?: string;
};

const PRESETS: BlockPreset[] = [
    { 
        role: "input", 
        title: "Input",
        description: "Daten-Eingang",
        usage: "Start des Flows. Nutzer-Input, API-Daten, Parameter"
    },
    { 
        role: "process", 
        title: "Process",
        description: "Verarbeitung",
        usage: "Berechnung, Transformation, Validation. Kann nach Input oder Decision kommen"
    },
    { 
        role: "decision", 
        title: "Decision",
        description: "Verzweigung",
        usage: "If/else-Logik. Kommt nach Input/Process, führt zu Process oder Output"
    },
    { 
        role: "output", 
        title: "Output",
        description: "Ergebnis",
        usage: "Ende des Flows. Response, Speichern, UI-Update"
    },
];

export function BlockPalette({ onAdd }: PaletteProps) {
    return (
        <div className="w-full p-4">
            <div className="font-semibold text-sm mb-4 text-white">
                Blocks
            </div>

            <div className="space-y-2">
                {PRESETS.map((p, i) => (
                    <div key={i} className="relative group">
                        <button
                            onClick={() => onAdd(p)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-blue-500/10"
                            title={p.usage}
                        >
                            <div className="font-medium text-sm text-white mb-1 flex items-center gap-2">
                                <span className="text-blue-400">+</span>
                                <span>{p.title}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {p.description}
                            </div>
                        </button>
                        
                        {/* Tooltip */}
                        <div className="
                            absolute left-full ml-3 top-0 z-50
                            invisible group-hover:visible
                            w-64 p-3 
                            bg-neutral-800 border border-white/20 text-white text-xs rounded-xl shadow-2xl
                            pointer-events-none backdrop-blur-xl
                            animate-in fade-in slide-in-from-left-2 duration-200
                        ">
                            💡 {p.usage}
                        </div>
                    </div>
                ))}
            </div>

            {/* Flow-Logik als Info-Button */}
            <details className="mt-6">
                <summary className="
                    cursor-pointer text-xs font-semibold text-gray-400 
                    hover:text-gray-200 flex items-center gap-2 transition-colors duration-200
                ">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Typischer Flow</span>
                </summary>
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-gray-300 leading-relaxed backdrop-blur-sm">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400">•</span>
                            <span><b className="text-white">Input</b> → Startpunkt</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400">•</span>
                            <span><b className="text-white">Process</b> → Verarbeitung</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400">•</span>
                            <span><b className="text-white">Decision</b> → Optional</span>
                        </div>
                        <div className="ml-6 text-gray-400 flex items-center gap-2">
                            <span className="text-blue-400/60">→</span>
                            <span>ja/nein: Process/Output</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400">•</span>
                            <span><b className="text-white">Output</b> → Ergebnis</span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
}
