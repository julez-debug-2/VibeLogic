import { DecisionNode, LogicGraph, LogicNode } from "../logic/types";
import { PromptPreset, PromptTarget } from "./presets";

/**
 * Generate a deterministic, structured prompt from a LogicGraph.
 * This prompt is meant for coding-focused LLMs (Copilot, Cursor, ChatGPT).
 */

export interface PromptOptions {
    target: PromptTarget;
    strictness: "low" | "medium" | "high";
    detailLevel: "brief" | "normal" | "detailed";
}

export function generatePrompt(
    graph: LogicGraph,
    options: PromptOptions
): string {
    const { target, strictness, detailLevel } = options;

    const lines: string[] = [];

    /* -----------------------------------------
     * Header / framing
     * ----------------------------------------- */

    lines.push(`You are a senior software engineer.`);
    lines.push(
        `Your task is to implement the following logic as ${target}.`
    );

    if (strictness === "high") {
        lines.push(
            `Follow the described logic strictly. Do not add features or assumptions.`
        );
    } else if (strictness === "medium") {
        lines.push(
            `Follow the logic carefully. Minor improvements are allowed if explicitly justified.`
        );
    } else {
        lines.push(
            `Use the logic as guidance. You may make reasonable design decisions.`
        );
    }

    lines.push("");

    /* -----------------------------------------
     * Logic overview
     * ----------------------------------------- */

    lines.push(`## Logic Overview`);
    lines.push(`Title: ${graph.title}`);

    if (graph.description) {
        lines.push(`Description: ${graph.description}`);
    }

    lines.push("");

    /* -----------------------------------------
     * Step-by-step logic
     * ----------------------------------------- */

    lines.push(`## Step-by-Step Logic`);

    graph.nodes.forEach((node, index) => {
        lines.push(formatNode(node, index + 1));
    });

    lines.push("");

    /* -----------------------------------------
     * Decision details
     * ----------------------------------------- */

    const decisions = graph.nodes.filter(
        (n): n is DecisionNode => n.type === "decision"
    );

    if (decisions.length > 0) {
        lines.push(`## Decisions`);

        for (const decision of decisions) {
            lines.push(`- Condition: ${decision.condition}`);
            lines.push(`  - Yes → node ${decision.branches.yes}`);
            lines.push(`  - No  → node ${decision.branches.no}`);
        }

        lines.push("");
    }

    /* -----------------------------------------
     * Output instructions
     * ----------------------------------------- */

    lines.push(`## Output Requirements`);

    switch (detailLevel) {
        case "brief":
            lines.push(`- Provide only the core implementation.`);
            break;
        case "normal":
            lines.push(
                `- Provide clean, readable code with minimal comments.`
            );
            break;
        case "detailed":
            lines.push(
                `- Provide well-structured code with comments explaining decisions.`
            );
            lines.push(
                `- Highlight any edge cases or assumptions explicitly.`
            );
            break;
    }

    lines.push("");

    /* -----------------------------------------
     * Target preset
     * ----------------------------------------- */

    const preset = PromptPreset[target];
    lines.push(`## Target-Specific Instructions`);
    lines.push(preset);

    return lines.join("\n");
}

/* -----------------------------------------
 * Helpers
 * ----------------------------------------- */

function formatNode(node: LogicNode, index: number): string {
    switch (node.type) {
        case "start":
            return `${index}. START`;
        case "end":
            return `${index}. END`;
        case "input":
            return `${index}. INPUT: ${node.label}`;
        case "process":
            return `${index}. PROCESS: ${node.label}`;
        case "decision":
            return `${index}. DECISION: ${node.condition}`;
        case "output":
            return `${index}. OUTPUT: ${node.label}`;
        default:
            return `${index}. ${node.label}`;
    }
}
