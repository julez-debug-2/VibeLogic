"use client";

type Props = {
    prompt: string;
    onCopy: () => void;
};

export function PromptPreview({ prompt, onCopy }: Props) {
    return (
        <div className="h-full flex flex-col bg-neutral-100">
            <div className="p-3 border-b text-sm font-semibold text-neutral-800 bg-neutral-200">
                Generated Prompt
            </div>

            <textarea
                className="
          flex-1
          p-4
          text-sm
          font-mono
          resize-none
          outline-none
          bg-neutral-50
          text-neutral-900
          placeholder:text-neutral-400
          leading-relaxed
        "
                value={prompt}
                readOnly
                placeholder="Click “Generate Prompt” to see the result here…"
            />

            <div className="p-2 border-t bg-neutral-200 flex justify-end">
                <button
                    onClick={onCopy}
                    disabled={!prompt}
                    className="
            px-4 py-1.5
            text-sm font-medium
            border
            rounded
            bg-white
            text-neutral-900
            hover:bg-neutral-100
            disabled:opacity-40
          "
                >
                    Copy
                </button>
            </div>
        </div>
    );
}
