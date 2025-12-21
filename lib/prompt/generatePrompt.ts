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

    lines.push("", "LOGIC FLOW:");

    /* ---------- Nodes ---------- */
    for (const node of graph.nodes) {
        if (node.type === "start") {
            lines.push(`- Start`);
        }

        if (node.type === "process") {
            lines.push(`- Process: ${node.label}`);
        }

        if (node.type === "decision") {
            lines.push(`- Decision: ${node.condition}`);
        }

        if (node.type === "output") {
            lines.push(`- Output: ${node.label}`);
        }
    }

    lines.push("", "DECISIONS:");

    /* ---------- Edges ---------- */
    for (const edge of graph.edges) {
        if (edge.branch) {
            lines.push(
                `- If ${edge.branch.toUpperCase()}: go from ${edge.from} to ${edge.to}`
            );
        }
    }

    lines.push(
        "",
        "CONSTRAINTS:",
        "- Do not invent additional logic",
        "- Follow the flow exactly",
        "- Use clear naming and structure"
    );

    return lines.join("\n");
}
