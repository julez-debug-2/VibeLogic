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
        <div className="w-[200px] border-r bg-gray-50 p-3 overflow-y-auto">
            <div className="font-semibold text-sm mb-3 text-gray-900">Blocks</div>

            <div className="space-y-2">
                {PRESETS.map((p, i) => (
                    <div key={i} className="relative group">
                        <button
                            onClick={() => onAdd(p)}
                            className="w-full rounded bg-white border px-3 py-2 text-left hover:bg-gray-100 transition"
                            title={p.usage}
                        >
                            <div className="font-medium text-sm text-gray-900">
                                + {p.title}
                            </div>
                            <div className="text-xs text-gray-600">
                                {p.description}
                            </div>
                        </button>
                        
                        {/* Tooltip */}
                        <div className="
                            absolute left-full ml-2 top-0 z-50
                            invisible group-hover:visible
                            w-64 p-2 
                            bg-gray-900 text-white text-xs rounded shadow-lg
                            pointer-events-none
                        ">
                            💡 {p.usage}
                        </div>
                    </div>
                ))}
            </div>

            {/* Flow-Logik als Info-Button */}
            <details className="mt-6">
                <summary className="
                    cursor-pointer text-xs font-semibold text-gray-700 
                    hover:text-gray-900 flex items-center gap-1
                ">
                    <span>ℹ️</span>
                    <span>Typischer Flow</span>
                </summary>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700 leading-relaxed">
                    <div className="space-y-1">
                        <div>1. <b>Input</b> → Startpunkt</div>
                        <div>2. <b>Process</b> → Verarbeitung</div>
                        <div>3. <b>Decision</b> → Optional</div>
                        <div className="ml-4 text-gray-600">→ ja/nein: Process/Output</div>
                        <div>4. <b>Output</b> → Ergebnis</div>
                    </div>
                </div>
            </details>
        </div>
    );
}
