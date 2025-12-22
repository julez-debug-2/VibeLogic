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
    const nodeMap = new Map(
        graph.nodes.map(n => [n.id, n.label || "Unnamed"])
    );

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

    /* ---------- Sortiere Nodes nach Flow-Logik ---------- */
    const sortedNodes = sortNodesByFlow(graph);

    /* ---------- Nodes ---------- */
    let stepNumber = 1;
    for (const node of sortedNodes) {
        const label = node.label || "Untitled";
        const desc = node.description ? `\n   ${node.description}` : "";

        if (node.type === "input") {
            lines.push(`${stepNumber}. **Input:** ${label}${desc}`);
        }

        if (node.type === "process") {
            lines.push(`${stepNumber}. **Process:** ${label}${desc}`);
        }

        if (node.type === "decision") {
            const condition = node.condition || label;
            lines.push(`${stepNumber}. **Decision:** ${condition}${desc}`);
        }

        if (node.type === "output") {
            lines.push(`${stepNumber}. **Output:** ${label}${desc}`);
        }

        stepNumber++;
    }

    /* ---------- Decisions mit lesbaren Namen ---------- */
    const decisionEdges = graph.edges.filter(e => e.branch);

    if (decisionEdges.length > 0) {
        lines.push("", "## DECISION BRANCHES");

        for (const edge of decisionEdges) {
            const fromName = nodeMap.get(edge.from) || edge.from;
            const toName = nodeMap.get(edge.to) || edge.to;

            lines.push(
                `- **${edge.branch?.toUpperCase()}:** "${fromName}" → "${toName}"`
            );
        }
    }

    lines.push(
        "",
        "## CONSTRAINTS",
        "- Do not invent additional logic",
        "- Follow the flow exactly as described",
        "- Use clear, descriptive naming",
        "- Implement error handling where appropriate"
    );

    return lines.join("\n");
}
