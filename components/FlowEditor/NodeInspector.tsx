type Props = {
    node: any | null;
    onChange: (data: any) => void;
};

export function NodeInspector({ node, onChange }: Props) {
    if (!node) {
        return (
            <div className="p-3 text-sm text-gray-500">
                Select a block to edit its content
            </div>
        );
    }

    const { title = "", description = "" } = node.data || {};

    return (
        <div className="p-3 space-y-3 text-gray-900">
            <div>
                <label className="block text-xs font-semibold mb-1">
                    Title
                </label>
                <input
                    value={title}
                    onChange={(e) =>
                        onChange({
                            ...node.data,
                            title: e.target.value,
                        })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold mb-1">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) =>
                        onChange({
                            ...node.data,
                            description: e.target.value,
                        })
                    }
                    rows={4}
                    className="w-full border rounded px-2 py-1 text-sm"
                />
            </div>
        </div>
    );
}
