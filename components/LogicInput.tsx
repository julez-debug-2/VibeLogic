"use client";

interface LogicInputProps {
    value: string;
    onChange: (value: string) => void;
}

export function LogicInput({ value, onChange }: LogicInputProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
                Logic Input
            </label>
            <textarea
                className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono"
                placeholder={`input: User submits form
process: Validate data
decision: Is data valid?
yes -> Save to database
no -> Show validation errors
output: Respond to user`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
