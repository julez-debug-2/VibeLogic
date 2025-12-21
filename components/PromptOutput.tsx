"use client";

interface PromptOutputProps {
    prompt: string;
}

export function PromptOutput({ prompt }: PromptOutputProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
                Generated Prompt
            </label>
            <textarea
                className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono bg-gray-50"
                value={prompt}
                readOnly
            />
        </div>
    );
}
