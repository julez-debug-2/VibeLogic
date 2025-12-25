"use client";

import type { PromptAnalysisResult, PromptSuggestion } from "@/lib/prompt/analyzePrompt";
import { useState } from "react";

interface PromptAnalysisPanelProps {
    analysis: PromptAnalysisResult | null;
    onApplySuggestion?: (suggestion: PromptSuggestion) => void;
}

export function PromptAnalysisPanel({ analysis, onApplySuggestion }: PromptAnalysisPanelProps) {
    const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

    if (!analysis) {
        return (
            <div className="p-4 text-sm text-gray-500 text-center">
                Generiere einen Prompt und analysiere ihn mit KI
            </div>
        );
    }

    // Check if prompt is analyzable
    if (analysis.analyzable === false) {
        return (
            <div className="p-4 space-y-4 text-sm">
                <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-4">
                    <h3 className="font-bold text-amber-900 text-lg mb-2">⚠️ Prompt zu vage für Analyse</h3>
                    <p className="text-amber-800 mb-3">
                        Die KI kann diesen Flow nicht sinnvoll analysieren, weil zu wenig Details vorhanden sind.
                    </p>
                    {analysis.reason && (
                        <div className="bg-amber-50 p-3 rounded border border-amber-300">
                            <strong className="text-amber-900">Grund:</strong>
                            <p className="text-amber-700 mt-1">{analysis.reason}</p>
                        </div>
                    )}
                    <div className="mt-4 text-amber-800">
                        <strong>Was du tun kannst:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Füge Beschreibungen zu deinen Nodes hinzu</li>
                            <li>Konkretisiere Decision-Bedingungen</li>
                            <li>Beschreibe WAS genau passieren soll, nicht nur DASS etwas passiert</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const { completenessScore, clarityScore, strengths, weaknesses, suggestions, improvedPrompt } = analysis;

    // Ensure arrays
    const strengthsList = Array.isArray(strengths) ? strengths : [];
    const weaknessesList = Array.isArray(weaknesses) ? weaknesses : [];
    const suggestionsList = Array.isArray(suggestions) ? suggestions : [];

    const highPriority = suggestionsList.filter(s => s?.priority === "high");
    const mediumPriority = suggestionsList.filter(s => s?.priority === "medium");
    const lowPriority = suggestionsList.filter(s => s?.priority === "low");

    return (
        <div className="p-4 space-y-4 text-sm">
            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Vollständigkeit" score={completenessScore} />
                <ScoreCard label="Klarheit" score={clarityScore} />
            </div>

            {/* Improved Prompt */}
            {improvedPrompt && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="font-semibold text-blue-900 mb-2">✨ Verbesserter Prompt</h4>
                    <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-blue-100 max-h-60 overflow-y-auto">
                        {improvedPrompt}
                    </pre>
                </div>
            )}

            {/* Strengths */}
            {strengthsList.length > 0 && (
                <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-semibold text-green-800 mb-2">✓ Stärken</h4>
                    <ul className="space-y-1 text-green-700">
                        {strengthsList.map((s, i) => (
                            <li key={i}>• {String(s)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Weaknesses */}
            {weaknessesList.length > 0 && (
                <div className="bg-orange-50 p-3 rounded">
                    <h4 className="font-semibold text-orange-800 mb-2">⚠ Schwächen</h4>
                    <ul className="space-y-1 text-orange-700">
                        {weaknessesList.map((w, i) => (
                            <li key={i}>• {String(w)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Suggestions by Priority */}
            <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">💡 Verbesserungsvorschläge</h4>

                {highPriority.length > 0 && (
                    <SuggestionGroup
                        title="Hohe Priorität"
                        color="red"
                        suggestions={highPriority}
                        expandedIdx={expandedSuggestion}
                        onExpand={setExpandedSuggestion}
                        onApply={onApplySuggestion}
                        offset={0}
                    />
                )}

                {mediumPriority.length > 0 && (
                    <SuggestionGroup
                        title="Mittlere Priorität"
                        color="yellow"
                        suggestions={mediumPriority}
                        expandedIdx={expandedSuggestion}
                        onExpand={setExpandedSuggestion}
                        onApply={onApplySuggestion}
                        offset={highPriority.length}
                    />
                )}

                {lowPriority.length > 0 && (
                    <SuggestionGroup
                        title="Niedrige Priorität"
                        color="gray"
                        suggestions={lowPriority}
                        expandedIdx={expandedSuggestion}
                        onExpand={setExpandedSuggestion}
                        onApply={onApplySuggestion}
                        offset={highPriority.length + mediumPriority.length}
                    />
                )}
            </div>
        </div>
    );
}

/* ---------- Score Card ---------- */
interface ScoreCardProps {
    label: string;
    score: number;
}

function ScoreCard({ label, score }: ScoreCardProps) {
    const bgColor = score >= 80 ? "bg-green-100" : score >= 60 ? "bg-yellow-100" : "bg-red-100";
    const textColor = score >= 80 ? "text-green-800" : score >= 60 ? "text-yellow-800" : "text-red-800";

    return (
        <div className={`${bgColor} p-3 rounded`}>
            <div className="text-xs text-gray-600 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${textColor}`}>{score}/100</div>
        </div>
    );
}

/* ---------- Suggestion Group ---------- */
interface SuggestionGroupProps {
    title: string;
    color: "red" | "yellow" | "gray";
    suggestions: PromptSuggestion[];
    expandedIdx: number | null;
    onExpand: (idx: number | null) => void;
    onApply?: (suggestion: PromptSuggestion) => void;
    offset: number;
}

function SuggestionGroup({
    title,
    color,
    suggestions,
    expandedIdx,
    onExpand,
    onApply,
    offset
}: SuggestionGroupProps) {
    const bgColor = color === "red" ? "bg-red-50" : color === "yellow" ? "bg-yellow-50" : "bg-gray-50";
    const borderColor = color === "red" ? "border-red-200" : color === "yellow" ? "border-yellow-200" : "border-gray-200";
    const textColor = color === "red" ? "text-red-800" : color === "yellow" ? "text-yellow-800" : "text-gray-800";

    return (
        <div className={`${bgColor} border ${borderColor} rounded p-2`}>
            <div className={`text-xs font-semibold ${textColor} mb-2`}>{title}</div>
            <div className="space-y-2">
                {suggestions.map((suggestion, localIdx) => {
                    const globalIdx = offset + localIdx;
                    const isExpanded = expandedIdx === globalIdx;

                    // Safety checks
                    if (!suggestion || typeof suggestion !== 'object') {
                        return null;
                    }

                    const title = suggestion.title ? String(suggestion.title) : "Unnamed suggestion";
                    const description = suggestion.description ? String(suggestion.description) : "";

                    return (
                        <div key={globalIdx} className="bg-white rounded border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => onExpand(isExpanded ? null : globalIdx)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium text-gray-900">{title}</span>
                                    <span className="text-gray-400 text-xs">{isExpanded ? "▼" : "▶"}</span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-2">
                                    <p className="text-gray-700">{description}</p>

                                    {suggestion.insertPosition && (
                                        <div className="text-xs text-gray-600 italic bg-gray-100 px-2 py-1 rounded">
                                            📍 Position: {String(suggestion.insertPosition)}
                                        </div>
                                    )}

                                    {suggestion.suggestedNode && typeof suggestion.suggestedNode === 'object' && (
                                        <div className="bg-blue-50 p-2 rounded text-xs space-y-1">
                                            <div className="font-semibold text-blue-900">
                                                Vorgeschlagener Node: {String(suggestion.suggestedNode.title || "Unnamed")}
                                            </div>
                                            <div className="text-blue-700">
                                                Typ: {String(suggestion.suggestedNode.role || "unknown")}
                                            </div>
                                            {suggestion.suggestedNode.description && (
                                                <div className="text-blue-700">
                                                    {String(suggestion.suggestedNode.description)}
                                                </div>
                                            )}
                                            {suggestion.suggestedNode.condition && (
                                                <div className="text-blue-700 italic">
                                                    Condition: {String(suggestion.suggestedNode.condition)}
                                                </div>
                                            )}

                                            {onApply && (
                                                <button
                                                    onClick={() => onApply(suggestion)}
                                                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                                                >
                                                    ✓ Node zum Flow hinzufügen
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
