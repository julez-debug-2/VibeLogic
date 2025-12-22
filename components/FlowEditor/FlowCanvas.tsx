"use client";

import { useCallback, useState } from "react";
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
import { NodeInspector } from "./NodeInspector";
import { LogicBlockNode } from "./nodes/LogicBlockNode";
import { PromptAnalysisPanel } from "./PromptAnalysisPanel";
import { PromptPreview } from "./PromptPreview";
import { ValidationPanel } from "./ValidationPanel";

import { validateLogicGraph, ValidationIssue } from "@/core/logic/analyzer";
import { flowToLogicGraph } from "@/lib/logic/flowToLogicGraph";
import { analyzePromptWithAI, PromptAnalysisResult, PromptSuggestion } from "@/lib/prompt/analyzePrompt";
import { generatePrompt } from "@/lib/prompt/generatePrompt";

import "reactflow/dist/style.css";

/* -------------------------------------------------
   1️⃣ Node-Typen (nur EIN Typ!)
-------------------------------------------------- */
const nodeTypes = {
    logicBlock: LogicBlockNode,
};

/* -------------------------------------------------
   2️⃣ Initial leerer Canvas
-------------------------------------------------- */
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/* -------------------------------------------------
   3️⃣ Canvas-Komponente
-------------------------------------------------- */
export function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

    const [prompt, setPrompt] = useState<string>("");
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Ollama settings
    const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
    const [ollamaModel, setOllamaModel] = useState("qwen3:14b");

    /* ---------- Node hinzufügen ---------- */
    const addBlock = (preset: BlockPreset) => {
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


    /* ---------- Node auswählen ---------- */
    const onNodeClick = (_: any, node: Node) => {
        setSelectedNodeId(node.id);
    };

    /* ---------- Node-Daten ändern ---------- */
    const updateNodeData = (newData: any) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((n) =>
                n.id === selectedNode.id ? { ...n, data: newData } : n
            )
        );
    };

    /* ---------- Verbindung ---------- */
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

    /* ---------- Validierung ---------- */
    const validateFlow = useCallback(() => {
        const graph = flowToLogicGraph(nodes, edges);
        const result = validateLogicGraph(graph);
        setValidationIssues(result.issues);
        return result.isValid;
    }, [nodes, edges]);

    /* ---------- Prompt generieren ---------- */
    const generatePromptText = () => {
        const isValid = validateFlow();
        if (!isValid) {
            alert("Flow hat Fehler. Bitte behebe die Fehler vor der Prompt-Generierung.");
            return;
        }
        console.log("🔍 Current nodes beim Generieren:", nodes.map(n => ({ id: n.id, title: n.data?.title })));
        const graph = flowToLogicGraph(nodes, edges);
        const text = generatePrompt(graph, { target: "code" });
        setPrompt(text);
    };

    /* ---------- Prompt kopieren ---------- */
    const copyPrompt = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt);
    };

    /* ---------- Prompt analysieren ---------- */
    const analyzePrompt = async () => {
        if (!prompt) return;

        setIsAnalyzing(true);
        try {
            const graph = flowToLogicGraph(nodes, edges);
            const result = await analyzePromptWithAI(prompt, {
                provider: "ollama",
                ollamaEndpoint,
                ollamaModel,
                logicGraph: graph // Send full context
            });
            setPromptAnalysis(result);
        } catch (error) {
            console.error("Prompt analysis failed:", error);
            alert(`Prompt-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nStelle sicher, dass Ollama läuft: ollama serve`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    /* ---------- Apply Suggestion ---------- */
    const applySuggestion = (suggestion: PromptSuggestion) => {
        if (!suggestion.suggestedNode) return;

        const node = suggestion.suggestedNode;
        const newNode: Node = {
            id: nanoid(),
            type: "logicBlock",
            position: {
                x: 200 + Math.random() * 300,
                y: 100 + nodes.length * 90,
            },
            data: {
                role: node.role,
                title: node.title,
                description: node.description,
                condition: node.condition,
            },
        };

        setNodes((nds) => [...nds, newNode]);
        setSelectedNodeId(newNode.id);

        // Analyse bleibt sichtbar - User kann weitere Nodes hinzufügen
    };

    /* -------------------------------------------------
       RENDER
    -------------------------------------------------- */
    return (
        <div className="flex w-full h-screen border-t overflow-hidden">
            {/* Block Palette */}
            <BlockPalette onAdd={addBlock} />

            {/* Canvas */}
            <div className="flex-1 bg-white">
                <div className="p-2 border-b bg-gray-50 flex gap-2">
                    <button
                        onClick={exportLogic}
                        className="px-3 py-1 text-sm text-neutral-900 border rounded bg-white hover:bg-gray-100"
                    >
                        Export Logic
                    </button>

                    <button
                        onClick={generatePromptText}
                        className="px-3 py-1 text-sm text-neutral-900 border rounded bg-white hover:bg-gray-100"
                    >
                        Generate Prompt
                    </button>

                    <button
                        onClick={analyzePrompt}
                        disabled={!prompt || isAnalyzing}
                        className="px-3 py-1 text-sm text-white border rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? "Analysiere..." : "✨ Prompt analysieren"}
                    </button>
                </div>

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

            {/* Ollama Settings */}
            <div className="p-3 border-b bg-blue-50">
                <h3 className="text-xs font-semibold text-blue-900 mb-2">🤖 Ollama Einstellungen</h3>
                <div className="space-y-2 text-xs">
                    <div>
                        <label className="block text-gray-900 font-medium mb-1">Endpoint</label>
                        <input
                            type="text"
                            value={ollamaEndpoint}
                            onChange={(e) => setOllamaEndpoint(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                            placeholder="http://localhost:11434"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-900 font-medium mb-1">Model</label>
                        <input
                            type="text"
                            value={ollamaModel}
                            onChange={(e) => setOllamaModel(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                            placeholder="llama3.2"
                        />
                    </div>
                </div>
            </div>

            {/* t Panel */}
            <div className="w-[360px] border-l bg-gray-50 flex flex-col">
                {/* Validation */}
                <div className="p-3 border-b">
                    <button
                        onClick={validateFlow}
                        className="w-full px-3 py-2 text-sm font-medium text-neutral-900 border rounded bg-white hover:bg-gray-100"
                    >
                        Flow validieren
                    </button>
                    <div className="mt-3">
                        <ValidationPanel
                            issues={validationIssues}
                            onNodeClick={(nodeId) => setSelectedNodeId(nodeId)}
                        />
                    </div>
                </div>

                {/* Inspector */}
                <div className="h-[200px] border-b overflow-auto">
                    <NodeInspector node={selectedNode} onChange={updateNodeData} />
                </div>

                {/* Prompt Preview */}
                <div className="flex-1 flex flex-col border-b">
                    <PromptPreview prompt={prompt} onCopy={copyPrompt} />
                </div>

                {/* Prompt Analysis */}
                <div className="flex-1 overflow-auto">
                    <h3 className="px-4 py-2 font-semibold text-sm border-b bg-gray-50">
                        🤖 KI-Analyse
                    </h3>
                    <PromptAnalysisPanel
                        analysis={promptAnalysis}
                        onApplySuggestion={applySuggestion}
                    />
                </div>
            </div>
        </div>
    );
}
