"use client";

import { useState, useRef, useEffect } from "react";
import { ValidationPanel } from "./ValidationPanel";
import type { ValidationIssue } from "@/core/logic/analyzer";

interface Message {
    role: "user" | "assistant";
    content: string;
    flowText?: string;
}

interface AIChatSidebarProps {
    onGenerate: (userPrompt: string, conversationHistory: Message[]) => void;
    onApply: () => void;
    ollamaEndpoint: string;
    ollamaModel: string;
    isGenerating: boolean;
    messages: Message[];
    currentFlow: string | null;
    validationIssues: ValidationIssue[];
    onValidate: () => boolean;
    onNodeClick: (nodeId: string) => void;
    autoApply: boolean;
    onAutoApplyChange: (enabled: boolean) => void;
}

export function AIChatSidebar({
    onGenerate,
    onApply,
    ollamaEndpoint,
    ollamaModel,
    isGenerating,
    messages: externalMessages,
    currentFlow,
    validationIssues,
    onValidate,
    onNodeClick,
    autoApply,
    onAutoApplyChange
}: AIChatSidebarProps) {
    const [userInput, setUserInput] = useState("");
    const [showValidation, setShowValidation] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [externalMessages]);

    const examplePrompts = [
        "Login-System (Email + Passwort)",
        "Warenkorb-Checkout mit Lagerprüfung und Zahlung",
        "Benutzer-Registrierung mit Email-Verifizierung",
        "Datei-Upload mit Validierung und Komprimierung"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isGenerating) return;

        const userMessage: Message = { role: "user", content: userInput };
        setUserInput("");

        // Call generate with history
        onGenerate(userInput, [...externalMessages, userMessage]);
    };

    const handleExampleClick = (example: string) => {
        setUserInput(example);
        inputRef.current?.focus();
    };

    return (
        <div className="w-[420px] border-l border-white/10 bg-neutral-900/50 backdrop-blur-xl flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-xl text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
                <div>
                    <h3 className="font-bold flex items-center gap-2.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>Flow-Generator</span>
                    </h3>
                    <p className="text-xs text-green-100 mt-1">
                        Beschreibe deinen Prozess
                    </p>
                </div>
            </div>

            {/* Validation Section */}
            <div className="border-b border-white/10">
                <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="w-full px-5 py-3 text-sm font-medium text-left flex items-center justify-between hover:bg-white/5 transition-all duration-200 group"
                >
                    <span className="flex items-center gap-2.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white">Validation</span>
                        {validationIssues.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-semibold border border-red-500/30">
                                {validationIssues.length}
                            </span>
                        )}
                    </span>
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{showValidation ? "▼" : "▶"}</span>
                </button>
                
                {showValidation && (
                    <div className="px-5 pb-4 animate-in slide-in-from-top-2 duration-200">
                        <button
                            onClick={onValidate}
                            className="w-full mb-3 px-4 py-2 text-sm font-medium text-white border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                            Flow validieren
                        </button>
                        <ValidationPanel
                            issues={validationIssues}
                            onNodeClick={onNodeClick}
                        />
                    </div>
                )}
            </div>

            {/* Auto-Apply Toggle */}
            <div className="border-b border-white/10 px-5 py-3 bg-black/10">
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div>
                            <span className="text-sm font-medium text-white">Auto-Apply</span>
                            <p className="text-xs text-gray-400">Flow sofort visualisieren</p>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={autoApply ?? true}
                            onChange={(e) => onAutoApplyChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </div>
                </label>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {externalMessages.length === 0 && (
                    <div className="text-center py-10">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h4 className="font-semibold text-white mb-2">
                            Starte die Konversation
                        </h4>
                        <p className="text-xs text-gray-400 mb-6">
                            Beschreibe deinen Prozess
                        </p>
                        
                        {/* Example Prompts */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-400 mb-3">Beispiele:</p>
                            {examplePrompts.map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example)}
                                    className="w-full text-left px-4 py-2.5 bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/30 rounded-xl text-xs text-gray-300 hover:text-white transition-all duration-200"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {externalMessages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-200`}
                    >
                        <div
                            className={`max-w-[85%] rounded-xl px-4 py-3 ${
                                msg.role === "user"
                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20"
                                    : "bg-white/5 border border-white/10 text-gray-100 backdrop-blur-sm"
                            }`}
                        >
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            {msg.flowText && (
                                <div className="mt-3 pt-3 border-t border-white/20">
                                    <div className="text-xs font-mono bg-black/40 text-gray-300 p-3 rounded-lg border border-white/10 whitespace-pre-wrap">
                                        {msg.flowText}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isGenerating && (
                    <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2.5 text-gray-400">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm">Generiere...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Apply Flow Button (nur bei Auto-Apply OFF) */}
            {currentFlow && !autoApply && (
                <div className="px-5 py-3 border-t border-white/10 bg-green-500/10 backdrop-blur-sm">
                    <button
                        onClick={onApply}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Flow übernehmen</span>
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Beschreibe deinen Prozess..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        rows={2}
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={!userInput.trim() || isGenerating}
                        className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    Enter = Senden • Shift+Enter = Neue Zeile
                </p>
            </div>
        </div>
    );
}
