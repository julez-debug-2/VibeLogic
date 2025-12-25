"use client";

import type { ValidationIssue } from "@/core/logic/analyzer";

interface ValidationPanelProps {
    issues: ValidationIssue[];
    onNodeClick?: (nodeId: string) => void;
}

export function ValidationPanel({ issues = [], onNodeClick }: ValidationPanelProps) {
    // Defensive: Ensure issues is always an array
    const issuesArray = Array.isArray(issues) ? issues : [];

    const errors = issuesArray.filter((i) => i.severity === "error");
    const warnings = issuesArray.filter((i) => i.severity === "warning");

    if (issuesArray.length === 0) {
        return (
            <div className="p-4 text-sm text-green-700 bg-green-50 rounded">
                ✓ Flow ist valide
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">
                        ⚠️ Fehler ({errors.length})
                    </h3>
                    <ul className="space-y-1">
                        {errors.map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-700">
                                <button
                                    onClick={() => issue.nodeId && onNodeClick?.(issue.nodeId)}
                                    className={`text-left w-full hover:underline ${issue.nodeId ? "cursor-pointer" : ""
                                        }`}
                                >
                                    • {issue.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                        ⚡ Warnungen ({warnings.length})
                    </h3>
                    <ul className="space-y-1">
                        {warnings.map((issue, idx) => (
                            <li key={idx} className="text-sm text-yellow-700">
                                <button
                                    onClick={() => issue.nodeId && onNodeClick?.(issue.nodeId)}
                                    className={`text-left w-full hover:underline ${issue.nodeId ? "cursor-pointer" : ""
                                        }`}
                                >
                                    • {issue.message}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
