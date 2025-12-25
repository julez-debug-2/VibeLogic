import { LogicGraph, LogicNode } from "../logic/LogicGraph";

type PromptTarget = "code" | "architecture" | "tests";

type PromptOptions = {
    target: PromptTarget;
};

/**
 * Sortiert Nodes nach Flow-Logik: Start-Node → folgt Edges → Ende
 * Nutzt topologische Sortierung (Breadth-First Search)
 */
function sortNodesByFlow(graph: LogicGraph): LogicNode[] {
    const { nodes, edges } = graph;

    // Baue Adjazenzliste: nodeId → [targetIds]
    const adjList = new Map<string, string[]>();
    nodes.forEach(n => adjList.set(n.id, []));
    edges.forEach(e => {
        const targets = adjList.get(e.from) || [];
        targets.push(e.to);
        adjList.set(e.from, targets);
    });

    // Finde Start-Nodes (keine eingehenden Edges)
    const incomingCount = new Map<string, number>();
    nodes.forEach(n => incomingCount.set(n.id, 0));
    edges.forEach(e => {
        incomingCount.set(e.to, (incomingCount.get(e.to) || 0) + 1);
    });

    const startNodes = nodes.filter(n => incomingCount.get(n.id) === 0);

    // BFS Traversierung
    const sorted: LogicNode[] = [];
    const visited = new Set<string>();
    const queue = [...startNodes];

    while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;

        visited.add(node.id);
        sorted.push(node);

        const targets = adjList.get(node.id) || [];
        for (const targetId of targets) {
            const targetNode = nodes.find(n => n.id === targetId);
            if (targetNode && !visited.has(targetId)) {
                queue.push(targetNode);
            }
        }
    }

    // Falls Nodes nicht verbunden sind, hänge sie ans Ende
    const remaining = nodes.filter(n => !visited.has(n.id));
    sorted.push(...remaining);

    return sorted;
}

export function generatePrompt(
    graph: LogicGraph,
    options: PromptOptions
): string {
    const lines: string[] = [];

    /* ---------- ID → Name Mapping für lesbare Referenzen ---------- */
    const nodeMap = new Map<string, string>();
    graph.nodes.forEach(n => {
        // Use label (title) as display name, fallback to "Unnamed"
        nodeMap.set(n.id, n.label || "Unnamed");
    });

    /* ---------- Sortiere Nodes nach Flow-Logik ---------- */
    const sortedNodes = sortNodesByFlow(graph);

    console.log("📊 Graph nodes:", graph.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })));
    console.log("📊 Graph edges:", graph.edges);
    console.log("📊 Sorted nodes:", sortedNodes.map(n => ({ type: n.type, label: n.label })));

    /* ---------- Rolle ---------- */
    lines.push(
        "You are a senior software engineer.",
        "Generate clean, maintainable code based strictly on the following logic."
    );

    /* ---------- Ziel ---------- */
    if (options.target === "code") {
        lines.push(
            "The goal is to implement the described logic as production-ready code."
        );
    }

    if (options.target === "architecture") {
        lines.push(
            "The goal is to design a clean software architecture for the described logic."
        );
    }

    if (options.target === "tests") {
        lines.push(
            "The goal is to generate meaningful automated tests for the described logic."
        );
    }

    lines.push("", "## LOGIC FLOW");
    lines.push("```mermaid");
    lines.push("graph TD");

    /* ---------- Generate Mermaid Nodes ---------- */
    const nodeIds = new Map<string, string>(); // originalId -> mermaidId
    let mermaidIdCounter = 1;

    for (const node of sortedNodes) {
        const mermaidId = `N${mermaidIdCounter++}`;
        nodeIds.set(node.id, mermaidId);

        const label = node.label || "Untitled";
        const desc = node.description ? ` | ${node.description}` : "";
        const fullLabel = `${label}${desc}`;

        // Node Shapes basierend auf Typ
        if (node.type === "input") {
            lines.push(`    ${mermaidId}[/"${fullLabel}"/]`); // Parallelogram (Input)
        } else if (node.type === "decision") {
            lines.push(`    ${mermaidId}{"${fullLabel}"}`); // Diamond (Decision)
        } else if (node.type === "output") {
            lines.push(`    ${mermaidId}(["${fullLabel}"])`); // Stadium (Output)
        } else { // process
            lines.push(`    ${mermaidId}["${fullLabel}"]`); // Rectangle (Process)
        }
    }

    /* ---------- Generate Mermaid Edges ---------- */
    for (const edge of graph.edges) {
        const fromId = nodeIds.get(edge.from);
        const toId = nodeIds.get(edge.to);

        if (!fromId || !toId) continue;

        if (edge.condition) {
            // Decision branch with label
            lines.push(`    ${fromId} -->|${edge.condition.toUpperCase()}| ${toId}`);
        } else {
            // Normal connection
            lines.push(`    ${fromId} --> ${toId}`);
        }
    }

    lines.push("```");
    lines.push("");
    lines.push("### Flow Explanation");

    /* ---------- Text Summary for Context ---------- */
    const inputs = sortedNodes.filter(n => n.type === "input");
    const decisions = sortedNodes.filter(n => n.type === "decision");
    const outputs = sortedNodes.filter(n => n.type === "output");

    if (inputs.length > 0) {
        lines.push("**Inputs:**");
        inputs.forEach(n => {
            lines.push(`- ${n.label}${n.description ? `: ${n.description}` : ""}`);
        });
    }

    if (decisions.length > 0) {
        lines.push("", "**Key Decisions:**");
        decisions.forEach(n => {
            const condition = n.condition || n.label;
            lines.push(`- ${condition}${n.description ? ` (${n.description})` : ""}`);
        });
    }

    if (outputs.length > 0) {
        lines.push("", "**Possible Outcomes:**");
        outputs.forEach(n => {
            lines.push(`- ${n.label}${n.description ? `: ${n.description}` : ""}`);
        });
    }

    lines.push(
        "",
        "## CONSTRAINTS",
        "- **Follow the exact flow:** Do not skip, reorder, or add steps",
        "- **Respect all decision branches:** Implement both YES and NO paths",
        "- **Use descriptions as implementation hints:** Node descriptions contain technical details (e.g., \"bcrypt/argon2\", \"JWT Token\")",
        "- **Error handling:** Each OUTPUT node represents a distinct outcome (success or specific error)",
        "- **Clean code:** Use clear naming, proper structure, and maintainable patterns",
        "- **Production-ready:** Include validation, logging, and security best practices where appropriate"
    );

    return lines.join("\n");
}
