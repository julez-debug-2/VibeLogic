"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    Controls,
    Edge,
    MiniMap,
    Node,
    useEdgesState,
    useNodesState,
} from "reactflow";

import { nanoid } from "nanoid";

import { BlockPalette, BlockPreset } from "./BlockPalette";
import { LogicBlockNode } from "./nodes/LogicBlockNode";
import { ValidationPanel } from "./ValidationPanel";
import { AIChatSidebar } from "./AIChatSidebar";

import { validateLogicGraph, ValidationIssue } from "@/core/logic/analyzer";
import { flowToLogicGraph } from "@/lib/logic/flowToLogicGraph";
import { generateFlowFromPrompt } from "@/lib/logic/generateFlowFromPrompt";
import { flowToText, optimizeWithAI } from "@/lib/logic/optimizeFlow";
import { analyzePromptWithAI, PromptAnalysisResult, PromptSuggestion } from "@/lib/prompt/analyzePrompt";
import { generatePrompt } from "@/lib/prompt/generatePrompt";

import "reactflow/dist/style.css";

/* -------------------------------------------------
   Node Types
-------------------------------------------------- */
const nodeTypes = {
    logicBlock: LogicBlockNode,
};

/* -------------------------------------------------
   Initial State
-------------------------------------------------- */
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/* -------------------------------------------------
   Main Component
-------------------------------------------------- */
export function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

    const [prompt, setPrompt] = useState<string>("");
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);

    // AI Flow Generator (now in sidebar)
    const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; flowText?: string }>>([]);
    const [currentGeneratedFlow, setCurrentGeneratedFlow] = useState<string | null>(null);
    const [autoApply, setAutoApply] = useState(true); // Auto-apply nach Generierung

    // Flow History for Undo/Redo
    const [flowHistory, setFlowHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Modals
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [messageModal, setMessageModal] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

    // Ollama settings
    const [ollamaEndpoint, setOllamaEndpoint] = useState(
        typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT || "http://localhost:11434") : "http://localhost:11434"
    );
    const [ollamaModel, setOllamaModel] = useState(
        typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_OLLAMA_MODEL || "qwen2.5:32b") : "qwen2.5:32b"
    );
    const [ollamaApiKey, setOllamaApiKey] = useState(
        typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_OLLAMA_API_KEY || "") : ""
    );
    const [showSettings, setShowSettings] = useState(false);

    /* ---------- Track changes for history ---------- */
    useEffect(() => {
        // Skip if we're loading from history (undo/redo)
        if (flowHistory.length > 0 && historyIndex < flowHistory.length) {
            const currentHistoryState = flowHistory[historyIndex];
            const isSameState = 
                JSON.stringify(currentHistoryState?.nodes) === JSON.stringify(nodes) &&
                JSON.stringify(currentHistoryState?.edges) === JSON.stringify(edges);
            
            if (isSameState) return; // We're in undo/redo, don't add to history
        }

        // Only track if there are actual nodes
        if (nodes.length === 0 && edges.length === 0) return;

        // Debounce: don't save every single change immediately
        const timeoutId = setTimeout(() => {
            const newHistory = flowHistory.slice(0, historyIndex + 1);
            newHistory.push({ nodes, edges });
            setFlowHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [nodes, edges]); // Track nodes and edges changes

    /* ---------- Add Block ---------- */
    const addBlock = (preset: BlockPreset) => {
        // Save current state before adding
        saveToHistory();

        const newNode: Node = {
            id: nanoid(),
            type: "logicBlock",
            position: {
                x: 200 + Math.random() * 200,
                y: 100 + nodes.length * 90,
            },
            data: {
                role: preset.role,
                title: preset.title,
                description: preset.description ?? "",
            },
        };

        setNodes((nds) => [...nds, newNode]);
    };

    /* ---------- Save to History ---------- */
    const saveToHistory = () => {
        // Remove any "future" history after current index
        const newHistory = flowHistory.slice(0, historyIndex + 1);
        // Add current state
        newHistory.push({ nodes, edges });
        setFlowHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    /* ---------- Node Selection ---------- */
    const onNodeClick = (_: any, node: Node) => {
        setSelectedNodeId(node.id);
    };

    /* ---------- Update Node Data ---------- */
    const updateNodeData = (newData: any) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((n) =>
                n.id === selectedNode.id ? { ...n, data: newData } : n
            )
        );
    };

    /* ---------- Connect Nodes ---------- */
    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges((eds) => addEdge(connection, eds)),
        []
    );

    /* ---------- Export Logic ---------- */
    const exportLogic = () => {
        const graph = flowToLogicGraph(nodes, edges);
        console.log("LogicGraph:", graph);
    };

    /* ---------- Undo/Redo ---------- */
    const undo = () => {
        if (historyIndex > 0) {
            const prevState = flowHistory[historyIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < flowHistory.length - 1) {
            const nextState = flowHistory[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    };

    /* ---------- Session Reset ---------- */
    const resetSession = () => {
        setChatMessages([]);
        setCurrentGeneratedFlow(null);
        setFlowHistory([]);
        setHistoryIndex(-1);
        setNodes([]);
        setEdges([]);
        setMessageModal({ type: "info", message: "🔄 Session zurückgesetzt. Starte eine neue Konversation!" });
    };

    /* ---------- Validate Flow ---------- */
    const validateFlow = useCallback(() => {
        const graph = flowToLogicGraph(nodes, edges);
        const result = validateLogicGraph(graph);
        setValidationIssues(result.issues);
        return result.isValid;
    }, [nodes, edges]);

    /* ---------- Generate Prompt ---------- */
    const generatePromptText = () => {
        const isValid = validateFlow();
        if (!isValid) {
            setMessageModal({ type: "error", message: "Flow hat Fehler. Bitte behebe die Fehler vor der Prompt-Generierung." });
            return;
        }
        const graph = flowToLogicGraph(nodes, edges);
        const text = generatePrompt(graph, { target: "code" });
        setPrompt(text);
        setShowPromptModal(true);
    };

    /* ---------- Copy Prompt ---------- */
    const copyPrompt = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt);
        setMessageModal({ type: "success", message: "✓ Prompt in Zwischenablage kopiert!" });
    };

    /* ---------- AI Flow Optimization (Text-Based) ---------- */
    const optimizeFlow = async () => {
        if (nodes.length === 0) {
            setMessageModal({ type: "error", message: "Flow ist leer - erstelle erst ein paar Nodes!" });
            return;
        }

        setIsOptimizing(true);

        try {
            // Step 1: Convert flow to text
            const flowText = flowToText(nodes, edges);
            console.log("📄 Flow als Text:\n", flowText);

            // Step 2: Send to AI for optimization
            const correctedText = await optimizeWithAI(flowText, ollamaEndpoint, ollamaModel, ollamaApiKey || undefined);
            console.log("🤖 AI Korrektur:\n", correctedText);

            // Step 3: Parse corrected text to LogicGraph
            const { parseFlowText } = await import("../../core/logic/parser");
            const logicGraph = parseFlowText(correctedText);
            console.log("📊 Parsed LogicGraph:", logicGraph);

            // Step 4: Convert LogicGraph to ReactFlow
            const { logicGraphToFlow } = await import("../../lib/logic/logicGraphToFlow");
            const { nodes: newNodes, edges: newEdges } = logicGraphToFlow(logicGraph);
            console.log("🎨 ReactFlow generiert:", { nodes: newNodes.length, edges: newEdges.length });

            // Step 5: Replace flow
            setNodes(newNodes);
            setEdges(newEdges);

            setMessageModal({ type: "success", message: `✅ Flow optimiert: ${newNodes.length} Nodes, ${newEdges.length} Edges` });
        } catch (error) {
            console.error("❌ Optimization failed:", error);
            setMessageModal({ type: "error", message: `Flow-Optimierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nStelle sicher, dass Ollama läuft: ollama serve` });
        } finally {
            setIsOptimizing(false);
        }
    };

    /* ---------- AI Flow Generation from Natural Language (Chat-based) ---------- */
    const handleGenerateFlow = async (userPrompt: string, conversationHistory: Array<{ role: "user" | "assistant"; content: string; flowText?: string }>) => {
        setIsGeneratingFlow(true);

        try {
            // Build conversation for API (without flowText property)
            const apiMessages = conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Step 1: Generate flow text from user prompt with context
            const flowText = await generateFlowFromPrompt(userPrompt, ollamaEndpoint, ollamaModel, {
                currentFlow: currentGeneratedFlow || undefined,
                conversationHistory: apiMessages,
                apiKey: ollamaApiKey || undefined
            });
            console.log("✨ Generated Flow:\n", flowText);

            // Step 2: Parse to LogicGraph
            const { parseFlowText } = await import("../../core/logic/parser");
            const logicGraph = parseFlowText(flowText);
            console.log("📊 Parsed LogicGraph:", logicGraph);

            // Step 3: Update state
            setCurrentGeneratedFlow(flowText);

            // Step 4: Auto-Apply wenn aktiviert
            if (autoApply) {
                // Convert to ReactFlow
                const { logicGraphToFlow } = await import("../../lib/logic/logicGraphToFlow");
                const { nodes: newNodes, edges: newEdges } = logicGraphToFlow(logicGraph);

                // Save current state to history (before applying)
                if (nodes.length > 0 || edges.length > 0) {
                    const newHistory = flowHistory.slice(0, historyIndex + 1);
                    newHistory.push({ nodes, edges });
                    setFlowHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);
                }

                // Apply to canvas
                setNodes(newNodes);
                setEdges(newEdges);

                // Add AI response to chat
                const aiMessage = {
                    role: "assistant" as const,
                    content: `✅ Flow ${currentGeneratedFlow ? 'aktualisiert' : 'erstellt'} und übernommen! (${newNodes.length} Nodes, ${newEdges.length} Verbindungen)\n\nDu kannst jetzt Änderungswünsche beschreiben.`,
                    flowText
                };
                setChatMessages([...conversationHistory, aiMessage]);
            } else {
                // Manual Apply mode
                const aiMessage = {
                    role: "assistant" as const,
                    content: `Flow ${currentGeneratedFlow ? 'aktualisiert' : 'generiert'}! Klicke "Flow übernehmen" oder beschreibe weitere Anpassungen.`,
                    flowText
                };
                setChatMessages([...conversationHistory, aiMessage]);
            }

        } catch (error) {
            console.error("❌ Flow generation failed:", error);

            // Add error message to chat
            const errorMessage = {
                role: "assistant" as const,
                content: `❌ Fehler: ${error instanceof Error ? error.message : 'Flow konnte nicht generiert werden'}\n\nStelle sicher, dass Ollama läuft (ollama serve).`
            };
            setChatMessages([...conversationHistory, errorMessage]);
        } finally {
            setIsGeneratingFlow(false);
        }
    };

    /* ---------- Apply Generated Flow to Canvas ---------- */
    const applyGeneratedFlow = async () => {
        if (!currentGeneratedFlow) return;

        try {
            // Parse to LogicGraph
            const { parseFlowText } = await import("../../core/logic/parser");
            const logicGraph = parseFlowText(currentGeneratedFlow);

            // Convert to ReactFlow
            const { logicGraphToFlow } = await import("../../lib/logic/logicGraphToFlow");
            const { nodes: newNodes, edges: newEdges } = logicGraphToFlow(logicGraph);

            // Save current state to history (before applying)
            if (nodes.length > 0 || edges.length > 0) {
                const newHistory = flowHistory.slice(0, historyIndex + 1);
                newHistory.push({ nodes, edges });
                setFlowHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }

            // Apply to canvas
            setNodes(newNodes);
            setEdges(newEdges);

            // Keep chat history, only reset generated flow
            setCurrentGeneratedFlow(null);

            // Add confirmation to chat
            const confirmMessage = {
                role: "assistant" as const,
                content: `✅ Flow manuell übernommen! (${newNodes.length} Nodes, ${newEdges.length} Verbindungen)`
            };
            setChatMessages([...chatMessages, confirmMessage]);
        } catch (error) {
            console.error("❌ Apply flow failed:", error);
            setMessageModal({ type: "error", message: `Fehler beim Übernehmen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` });
        }
    };

    // Re-validate after nodes/edges change
    useEffect(() => {
        if (nodes.length > 0) {
            const graph = flowToLogicGraph(nodes, edges);
            const result = validateLogicGraph(graph);
            setValidationIssues(result.issues);
        }
    }, [nodes, edges]);

    /* -------------------------------------------------
       RENDER
    -------------------------------------------------- */
    return (
        <div className="flex flex-col w-full h-screen overflow-hidden bg-neutral-950">
            {/* Header */}
            <header className="h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-2 shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Logic2Vibe</span>
                    </div>
                    <span className="text-gray-400 text-sm font-medium px-3 py-1 bg-white/5 rounded-full border border-white/10">Logik statt Text</span>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white group"
                    title="Ollama Einstellungen"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </header>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-auto">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Ollama Einstellungen</span>
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-gray-400 hover:text-white text-2xl hover:rotate-90 transition-all duration-300"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint</label>
                                <input
                                    type="text"
                                    value={ollamaEndpoint}
                                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="http://localhost:11434"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                                <input
                                    type="text"
                                    value={ollamaModel}
                                    onChange={(e) => setOllamaModel(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="qwen2.5:32b"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Empfohlene Modelle: qwen2.5:32b, qwen3:14b, gemma2:9b
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    API Key
                                    <span className="ml-1.5 text-xs text-gray-500">(optional, nur für Ollama Cloud)</span>
                                </label>
                                <input
                                    type="password"
                                    value={ollamaApiKey}
                                    onChange={(e) => setOllamaApiKey(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="Leer lassen für lokales Ollama"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Für Ollama Cloud: Endpoint auf <code className="px-1.5 py-0.5 bg-white/5 rounded">https://api.ollama.com</code> setzen
                                </p>
                            </div>
                            <div className="pt-3 border-t border-white/10">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20"
                                >
                                    Schließen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Block Palette + Node Inspector */}
                <div className="w-[260px] border-r border-white/10 bg-neutral-900/50 backdrop-blur-xl flex flex-col">
                    <BlockPalette onAdd={addBlock} />
                    
                    {/* Node Inspector */}
                    <div className="border-t border-white/10">
                        <div className="px-4 py-3 text-xs font-semibold text-gray-300 bg-black/20 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Block bearbeiten</span>
                        </div>
                        {selectedNode ? (
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                        Title
                                    </label>
                                    <input
                                        value={selectedNode.data?.title || ""}
                                        onChange={(e) =>
                                            updateNodeData({
                                                ...selectedNode.data,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={selectedNode.data?.description || ""}
                                        onChange={(e) =>
                                            updateNodeData({
                                                ...selectedNode.data,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-xs text-gray-500 text-center">
                                Wähle einen Block aus, um ihn zu bearbeiten
                            </div>
                        )}
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-neutral-900 flex flex-col">
                    <div className="p-3 border-b border-white/10 bg-black/20 backdrop-blur-xl flex gap-2 items-center">
                        {/* Undo/Redo Buttons */}
                        <div className="flex gap-1 mr-2 border-r border-white/10 pr-2">
                            <button
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="px-3 py-2 text-sm text-gray-300 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-all duration-200"
                                title="Undo (Strg+Z)"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </button>
                            <button
                                onClick={redo}
                                disabled={historyIndex >= flowHistory.length - 1}
                                className="px-3 py-2 text-sm text-gray-300 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-all duration-200"
                                title="Redo (Strg+Y)"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                                </svg>
                            </button>
                        </div>

                        {/* Session Reset */}
                        {(chatMessages.length > 0 || nodes.length > 0) && (
                            <button
                                onClick={resetSession}
                                className="px-3 py-2 text-sm text-orange-300 border border-orange-500/20 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 hover:text-orange-200 font-medium transition-all duration-200 flex items-center gap-2"
                                title="Session zurücksetzen"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        )}

                        <div className="flex-1" />

                        <button
                            onClick={optimizeFlow}
                            disabled={isOptimizing || nodes.length === 0}
                            className="px-4 py-2 text-sm text-white border border-purple-500/20 rounded-xl bg-gradient-to-r from-purple-600/80 to-purple-700/80 hover:from-purple-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                        >
                            {isOptimizing ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                            <span>{isOptimizing ? "Optimiere..." : "AI Optimize"}</span>
                        </button>

                        <button
                            onClick={exportLogic}
                            className="px-4 py-2 text-sm text-gray-300 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white font-medium transition-all duration-200 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export Logic</span>
                        </button>

                        <button
                            onClick={generatePromptText}
                            className="px-4 py-2 text-sm text-white border border-blue-500/20 rounded-xl bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600 hover:to-cyan-600 font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>Generate Prompt</span>
                        </button>
                    </div>

                    <div className="flex-1 w-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            fitView
                        >
                            <Background gap={16} />
                            <MiniMap />
                            <Controls />
                        </ReactFlow>
                    </div>
                </div>

                {/* Right Sidebar: AI Chat + Validation */}
                <AIChatSidebar
                    onGenerate={handleGenerateFlow}
                    onApply={applyGeneratedFlow}
                    ollamaEndpoint={ollamaEndpoint}
                    ollamaModel={ollamaModel}
                    isGenerating={isGeneratingFlow}
                    messages={chatMessages}
                    currentFlow={currentGeneratedFlow}
                    validationIssues={validationIssues}
                    onValidate={validateFlow}
                    onNodeClick={(nodeId) => setSelectedNodeId(nodeId)}
                    autoApply={autoApply}
                    onAutoApplyChange={setAutoApply}
                />
            </div>

            {/* Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
                                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Generierter Prompt</span>
                            </h3>
                            <button
                                onClick={() => setShowPromptModal(false)}
                                className="text-gray-400 hover:text-white text-2xl hover:rotate-90 transition-all duration-300"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-5">
                            <textarea
                                className="w-full h-full min-h-[450px] p-4 text-sm font-mono resize-none outline-none bg-black/40 text-gray-100 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                value={prompt}
                                readOnly
                            />
                        </div>
                        <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
                            <button
                                onClick={copyPrompt}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy</span>
                            </button>
                            <button
                                onClick={() => setShowPromptModal(false)}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {messageModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className={`p-5 border-b border-white/10 flex items-center gap-3 ${
                            messageModal.type === "success" ? "bg-green-500/10" :
                            messageModal.type === "error" ? "bg-red-500/10" :
                            "bg-blue-500/10"
                        }`}>
                            {messageModal.type === "success" ? (
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : messageModal.type === "error" ? (
                                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <h3 className={`text-lg font-semibold ${
                                messageModal.type === "success" ? "text-green-400" :
                                messageModal.type === "error" ? "text-red-400" :
                                "text-blue-400"
                            }`}>
                                {messageModal.type === "success" ? "Erfolg" :
                                 messageModal.type === "error" ? "Fehler" :
                                 "Information"}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{messageModal.message}</p>
                        </div>
                        <div className="p-5 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setMessageModal(null)}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
