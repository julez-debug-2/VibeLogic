import { LogicGraph } from "../logic/LogicGraph";

type PromptTarget = "code" | "architecture" | "tests";

type PromptOptions = {
    target: PromptTarget;
};

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

    /* ---------- Nodes ---------- */
    let stepNumber = 1;
    for (const node of graph.nodes) {
        const label = node.label || "Untitled";
        
        if (node.type === "input") {
            lines.push(`${stepNumber}. **Input:** ${label}`);
        }

        if (node.type === "process") {
            lines.push(`${stepNumber}. **Process:** ${label}`);
        }

        if (node.type === "decision") {
            const condition = node.condition || label;
            lines.push(`${stepNumber}. **Decision:** ${condition}`);
        }

        if (node.type === "output") {
            lines.push(`${stepNumber}. **Output:** ${label}`);
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
