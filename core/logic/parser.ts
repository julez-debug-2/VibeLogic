import { nanoid } from "nanoid";
import {
    DecisionNode,
    EndNode,
    InputNode,
    LogicEdge,
    LogicGraph,
    LogicId,
    LogicNode,
    OutputNode,
    ProcessNode,
    StartNode,
} from "./types";

/**
 * Parse simple text format into LogicGraph.
 * 
 * Format:
 * INPUT: <title> | <description>
 * PROCESS: <title> | <description>
 * DECISION: <title> | <description>
 *   YES -> <target-title>
 *   NO -> <target-title>
 * OUTPUT: <title> | <description>
 */

interface ParsedNode {
    type: "input" | "process" | "decision" | "output";
    title: string;
    description?: string;
    branches?: {
        yes?: string;
        no?: string;
    };
}

export function parseFlowText(text: string): LogicGraph {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const parsedNodes: ParsedNode[] = [];

    let currentNode: ParsedNode | null = null;

    for (const line of lines) {
        // Parse main node line: "INPUT: title | description"
        const nodeMatch = line.match(/^(INPUT|PROCESS|DECISION|OUTPUT):\s*(.+)$/i);
        if (nodeMatch) {
            // Save previous node
            if (currentNode) {
                parsedNodes.push(currentNode);
            }

            const nodeType = nodeMatch[1].toLowerCase() as "input" | "process" | "decision" | "output";
            const content = nodeMatch[2];

            // Split title and description by " | "
            const parts = content.split('|').map(p => p.trim());
            const title = parts[0];
            const description = parts[1];

            currentNode = {
                type: nodeType,
                title,
                description,
                branches: {}
            };
            continue;
        }

        // Parse branch line: "YES -> target" or "NO -> target" (leading spaces already trimmed)
        const branchMatch = line.match(/^(YES|NO)\s*->\s*(.+)$/i);
        if (branchMatch && currentNode && currentNode.type === "decision") {
            const branch = branchMatch[1].toUpperCase();
            const target = branchMatch[2].trim();

            if (branch === "YES") {
                currentNode.branches!.yes = target;
            } else {
                currentNode.branches!.no = target;
            }
        }
    }

    // Save last node
    if (currentNode) {
        parsedNodes.push(currentNode);
    }

    console.log(`🔍 Parser: Parsed ${parsedNodes.length} nodes`);
    parsedNodes.forEach((n, i) => {
        console.log(`  ${i + 1}. ${n.type.toUpperCase()}: "${n.title}"${n.branches?.yes || n.branches?.no ? ` (YES→"${n.branches.yes}", NO→"${n.branches.no}")` : ''}`);
    });

    // Convert to LogicGraph
    const nodes: LogicNode[] = [];
    const edges: LogicEdge[] = [];
    const titleToId = new Map<string, string>();

    // First pass: Create nodes and ID mapping
    parsedNodes.forEach((parsed) => {
        const id = nanoid();
        titleToId.set(parsed.title, id);

        nodes.push({
            id,
            type: parsed.type,
            label: parsed.title,
            description: parsed.description || parsed.title,
            ...(parsed.type === "decision" && parsed.branches ? {
                branches: {
                    yes: parsed.branches.yes || "",
                    no: parsed.branches.no || ""
                }
            } : {})
        } as LogicNode);
    });

    // Second pass: Create edges
    for (let i = 0; i < parsedNodes.length; i++) {
        const parsed = parsedNodes[i];
        const fromId = titleToId.get(parsed.title);
        if (!fromId) continue;

        if (parsed.type === "decision" && parsed.branches) {
            // Decision branches to explicit targets
            if (parsed.branches.yes) {
                const toId = titleToId.get(parsed.branches.yes);
                if (toId) {
                    edges.push({
                        id: nanoid(),
                        from: fromId,
                        to: toId,
                        condition: "yes"
                    });
                } else {
                    console.warn(`⚠️ Parser: YES branch target "${parsed.branches.yes}" not found for decision "${parsed.title}"`);
                }
            }
            if (parsed.branches.no) {
                const toId = titleToId.get(parsed.branches.no);
                if (toId) {
                    edges.push({
                        id: nanoid(),
                        from: fromId,
                        to: toId,
                        condition: "no"
                    });
                } else {
                    console.warn(`⚠️ Parser: NO branch target "${parsed.branches.no}" not found for decision "${parsed.title}"`);
                }
            }
        } else if (i + 1 < parsedNodes.length && parsedNodes[i + 1].type !== "output") {
            // Sequential connection to next node (for INPUT/PROCESS → next node)
            // But NOT if next node is an Output (outputs have no outgoing edges)
            const nextTitle = parsedNodes[i + 1].title;
            const toId = titleToId.get(nextTitle);
            if (toId) {
                edges.push({
                    id: nanoid(),
                    from: fromId,
                    to: toId
                });
            }
        }
    }

    console.log(`✅ Parser created ${nodes.length} nodes and ${edges.length} edges`);
    console.log(`📊 Edges:`, edges.map(e => `${nodes.find(n => n.id === e.from)?.label} → ${nodes.find(n => n.id === e.to)?.label} ${e.branch ? `[${e.branch}]` : ''}`));

    return {
        title: "Optimized Flow",
        description: "AI-generated logic flow",
        nodes,
        edges
    };
}

export function parseLogicText(
    text: string,
    meta?: { title?: string; description?: string }
): LogicGraph {
    idCounter = 0;

    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const nodes: LogicNode[] = [];
    const edges: LogicEdge[] = [];

    // Always start with a start node
    const startNode: StartNode = {
        id: nextId(),
        type: "start",
        label: "Start",
    };

    nodes.push(startNode);

    let lastNodeId: LogicId = startNode.id;
    let pendingDecision: DecisionNode | null = null;

    for (const line of lines) {
        // INPUT
        if (line.startsWith("input:")) {
            const label = line.replace("input:", "").trim();

            const node: InputNode = {
                id: nextId(),
                type: "input",
                label,
            };

            nodes.push(node);
            edges.push({ id: nanoid(), from: lastNodeId, to: node.id });
            lastNodeId = node.id;
            pendingDecision = null;
            continue;
        }

        // PROCESS
        if (line.startsWith("process:")) {
            const label = line.replace("process:", "").trim();

            const node: ProcessNode = {
                id: nextId(),
                type: "process",
                label,
            };

            nodes.push(node);
            edges.push({ id: nanoid(), from: lastNodeId, to: node.id });
            lastNodeId = node.id;
            pendingDecision = null;
            continue;
        }

        // DECISION
        if (line.startsWith("decision:")) {
            const condition = line.replace("decision:", "").trim();

            const node: DecisionNode = {
                id: nextId(),
                type: "decision",
                label: "Decision",
                condition,
                branches: {
                    yes: "",
                    no: "",
                },
            };

            nodes.push(node);
            edges.push({ id: nanoid(), from: lastNodeId, to: node.id });

            pendingDecision = node;
            lastNodeId = node.id;
            continue;
        }

        // DECISION BRANCHES
        if (pendingDecision && line.startsWith("yes ->")) {
            const label = line.replace("yes ->", "").trim();

            const node: ProcessNode = {
                id: nextId(),
                type: "process",
                label,
            };

            nodes.push(node);

            pendingDecision.branches.yes = node.id;
            edges.push({
                id: nanoid(),
                from: pendingDecision.id,
                to: node.id,
                condition: "yes",
            });

            lastNodeId = node.id;
            continue;
        }

        if (pendingDecision && line.startsWith("no ->")) {
            const label = line.replace("no ->", "").trim();

            const node: ProcessNode = {
                id: nextId(),
                type: "process",
                label,
            };

            nodes.push(node);

            pendingDecision.branches.no = node.id;
            edges.push({
                id: nanoid(),
                from: pendingDecision.id,
                to: node.id,
                condition: "no",
            });

            lastNodeId = node.id;
            continue;
        }

        // OUTPUT
        if (line.startsWith("output:")) {
            const label = line.replace("output:", "").trim();

            const node: OutputNode = {
                id: nextId(),
                type: "output",
                label,
            };

            nodes.push(node);
            edges.push({ id: nanoid(), from: lastNodeId, to: node.id });
            lastNodeId = node.id;
            pendingDecision = null;
            continue;
        }

        // FALLBACK: treat as process
        const node: ProcessNode = {
            id: nextId(),
            type: "process",
            label: line,
        };

        nodes.push(node);
        edges.push({ id: nanoid(), from: lastNodeId, to: node.id });
        lastNodeId = node.id;
        pendingDecision = null;
    }

    // Always end with an end node
    const endNode: EndNode = {
        id: nextId(),
        type: "end",
        label: "End",
    };

    nodes.push(endNode);
    edges.push({ id: nanoid(), from: lastNodeId, to: endNode.id });

    return {
        id: `graph_${Date.now()}`,
        title: meta?.title ?? "Untitled Logic",
        description: meta?.description,
        nodes,
        edges,
    };
}
