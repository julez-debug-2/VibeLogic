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
 * Very simple deterministic text → logic parser (MVP)
 *
 * Supported syntax (line based):
 *
 * - input: User enters email
 * - process: Validate email
 * - decision: Is user authenticated?
 * - yes -> Process A
 * - no -> Process B
 * - output: Show success message
 *
 * Order matters. This is intentional.
 */

let idCounter = 0;
const nextId = (): LogicId => `node_${++idCounter}`;

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
            edges.push({ from: lastNodeId, to: node.id });
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
            edges.push({ from: lastNodeId, to: node.id });
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
            edges.push({ from: lastNodeId, to: node.id });

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
            edges.push({ from: lastNodeId, to: node.id });
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
        edges.push({ from: lastNodeId, to: node.id });
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
    edges.push({ from: lastNodeId, to: endNode.id });

    return {
        id: `graph_${Date.now()}`,
        title: meta?.title ?? "Untitled Logic",
        description: meta?.description,
        nodes,
        edges,
    };
}
