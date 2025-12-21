"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
    Background,
    Connection,
    Controls,
    Edge,
    MiniMap,
    Node,
    addEdge,
    useEdgesState,
    useNodesState,
} from "reactflow";

import { nanoid } from "nanoid";

import { BlockPalette, BlockPreset } from "./BlockPalette";
import { NodeInspector } from "./NodeInspector";
import { LogicBlockNode } from "./nodes/LogicBlockNode";
import { PromptPreview } from "./PromptPreview";

import { flowToLogicGraph } from "@/lib/logic/flowToLogicGraph";
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

    /* ---------- Prompt generieren ---------- */
    const generatePromptText = () => {
        const graph = flowToLogicGraph(nodes, edges);
        const text = generatePrompt(graph, { target: "code" });
        setPrompt(text);
    };

    /* ---------- Prompt kopieren ---------- */
    const copyPrompt = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt);
    };

    /* -------------------------------------------------
       RENDER
    -------------------------------------------------- */
    return (
        <div className="flex w-full h-[800px] border rounded-md overflow-hidden">
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

            {/* Right Panel */}
            <div className="w-[360px] border-l bg-gray-50 flex flex-col">
                {/* Inspector */}
                <div className="h-[260px] border-b overflow-auto">
                    <NodeInspector node={selectedNode} onChange={updateNodeData} />
                </div>

                {/* Prompt Preview */}
                <div className="flex-1">
                    <PromptPreview prompt={prompt} onCopy={copyPrompt} />
                </div>
            </div>
        </div>
    );
}
