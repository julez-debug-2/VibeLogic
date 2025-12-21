type PaletteProps = {
    onAdd: (preset: BlockPreset) => void;
};

export type BlockPreset = {
    role: "input" | "process" | "decision" | "output";
    title: string;
    description?: string;
};

const PRESETS: BlockPreset[] = [
    { role: "input", title: "Input" },
    { role: "process", title: "Process" },
    { role: "decision", title: "Decision" },
    { role: "output", title: "Output" },
];

export function BlockPalette({ onAdd }: PaletteProps) {
    return (
        <div className="w-[200px] border-r bg-gray-50 p-2 space-y-2">
            <div className="font-semibold text-sm mb-2">Blocks</div>

            {PRESETS.map((p, i) => (
                <button
                    key={i}
                    onClick={() => onAdd(p)}
                    className="w-full rounded bg-white border px-2 py-1 text-sm hover:bg-gray-100"
                >
                    + {p.title}
                </button>
            ))}
        </div>
    );
}
