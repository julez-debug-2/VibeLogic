"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
    flowText?: string; // AI response includes generated flow
}

interface AIFlowGeneratorProps {
    onGenerate: (userPrompt: string, conversationHistory: Message[]) => void;
    onApply: () => void;
    onClose: () => void;
    ollamaEndpoint: string;
    ollamaModel: string;
    isGenerating: boolean;
    messages: Message[];
    currentFlow: string | null;
}

export function AIFlowGenerator({
    onGenerate,
    onApply,
    onClose,
    ollamaEndpoint,
    ollamaModel,
    isGenerating,
    messages: externalMessages,
    currentFlow
}: AIFlowGeneratorProps) {
    const [userInput, setUserInput] = useState("");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [externalMessages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const examplePrompts = [
        "Login-System mit Email und Passwort-Validierung",
        "Warenkorb-Checkout mit Lagerprüfung und Zahlung",
        "Registrierung mit Email-Verifizierung",
        "Datei-Upload mit Validierung und Komprimierung",
        "Tabelle mit Checkboxen und Batch-Aktionen"
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

    const handleApplyFlow = () => {
        onApply();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            💬 Flow-Generator Chat
                        </h2>
                        <p className="text-sm text-green-100 mt-1">
                            Beschreibe deinen Prozess und verfeinere ihn im Dialog
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-green-100 transition-colors"
                        disabled={isGenerating}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {externalMessages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Starte die Konversation
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Beschreibe deinen Prozess und ich erstelle einen Flow daraus
                                    </p>
                                    
                                    {/* Example Prompts */}
                                    <div className="max-w-md mx-auto space-y-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-3">Beispiele:</p>
                                        {examplePrompts.map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleExampleClick(example)}
                                                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg text-sm text-gray-700 transition-all"
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
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-lg px-4 py-3 ${
                                            msg.role === "user"
                                                ? "bg-green-600 text-white"
                                                : "bg-gray-100 text-gray-900"
                                        }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                        {msg.flowText && (
                                            <div className="mt-2 pt-2 border-t border-gray-300">
                                                <div className="text-xs font-mono bg-white text-gray-900 p-2 rounded max-h-40 overflow-y-auto">
                                                    {msg.flowText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isGenerating && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm">Generiere Flow...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t bg-gray-50 p-4">
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
                                    placeholder="Beschreibe deinen Prozess oder gib Feedback zum Flow..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    rows={2}
                                    disabled={isGenerating}
                                />
                                <button
                                    type="submit"
                                    disabled={!userInput.trim() || isGenerating}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
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

                    {/* Flow Preview Sidebar */}
                    {currentFlow && (
                        <div className="w-96 border-l bg-gray-50 flex flex-col">
                            <div className="px-4 py-3 border-b bg-white">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <span>📊</span>
                                    Aktueller Flow
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <pre className="text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded p-3 whitespace-pre-wrap">
                                    {currentFlow}
                                </pre>
                            </div>
                            <div className="p-4 border-t bg-white">
                                <button
                                    onClick={handleApplyFlow}
                                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <span>✓</span>
                                    Flow übernehmen
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
