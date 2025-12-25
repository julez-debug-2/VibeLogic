import { LogicGraph, LogicNode } from "../logic/types";
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
     * Logic flow with execution order
     * ----------------------------------------- */

    lines.push(`## LOGIC FLOW`);

    // Build execution order by traversing edges with inline branches
    const flowLines = buildFlowRepresentation(graph);
    lines.push(...flowLines);

    lines.push("");

    /* -----------------------------------------
     * Constraints
     * ----------------------------------------- */

    lines.push(`## CONSTRAINTS`);
    lines.push(`- Do not invent additional logic`);
    lines.push(`- Follow the flow exactly as described`);
    lines.push(`- Use clear, descriptive naming`);
    lines.push(`- Implement error handling where appropriate`);
    lines.push("");
    /* -----------------------------------------
     * Detail level instructions
     * ----------------------------------------- */

    lines.push(`## OUTPUT REQUIREMENTS`);
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

function capitalizeNodeType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Build a flow representation that shows branches inline with proper context
 */
function buildFlowRepresentation(graph: LogicGraph): string[] {
    const lines: string[] = [];
    const inputNode = graph.nodes.find(n => n.type === "input");
    
    if (!inputNode) {
        // Fallback: list all nodes
        graph.nodes.forEach((node, index) => {
            lines.push(`${index + 1}. **${capitalizeNodeType(node.type)}:** ${node.label}`);
            if (node.description && node.description !== node.label) {
                lines.push(`   ${node.description}`);
            }
        });
        return lines;
    }

    const visited = new Set<string>();
    let counter = 1;

    function traverse(nodeId: string, indent: string = ""): void {
        if (visited.has(nodeId)) return;
        
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return;

        visited.add(nodeId);

        // Format node line
        const num = counter++;
        lines.push(`${num}. **${capitalizeNodeType(node.type)}:** ${node.label}`);
        if (node.description && node.description !== node.label) {
            lines.push(`   ${node.description}`);
        }

        // Find outgoing edges
        const outgoingEdges = graph.edges.filter(e => e.from === nodeId);

        if (node.type === "decision") {
            // For decisions, follow YES branch completely first, then NO branch
            const yesEdge = outgoingEdges.find(e => e.condition === "yes");
            const noEdge = outgoingEdges.find(e => e.condition === "no");

            // Follow YES branch completely (recursive)
            if (yesEdge && !visited.has(yesEdge.to)) {
                traverse(yesEdge.to, indent);
            }

            // Then follow NO branch (this typically leads to an error/early exit OUTPUT)
            if (noEdge && !visited.has(noEdge.to)) {
                traverse(noEdge.to, indent);
            }
        } else {
            // For non-decisions, just follow the next edge
            outgoingEdges.forEach(edge => {
                if (!visited.has(edge.to)) {
                    traverse(edge.to, indent);
                }
            });
        }
    }

    traverse(inputNode.id);

    // Add unvisited nodes at the end
    graph.nodes.forEach(node => {
        if (!visited.has(node.id)) {
            const num = counter++;
            lines.push(`${num}. **${capitalizeNodeType(node.type)}:** ${node.label}`);
            if (node.description && node.description !== node.label) {
                lines.push(`   ${node.description}`);
            }
        }
    });

    return lines;
}

function buildExecutionOrder(graph: LogicGraph): LogicNode[] {
    // Find input node (entry point)
    const inputNode = graph.nodes.find(n => n.type === "input");

    if (!inputNode) {
        // Fallback: return nodes as-is
        return graph.nodes;
    }

    const visited = new Set<string>();
    const order: LogicNode[] = [];

    function traverse(nodeId: string) {
        if (visited.has(nodeId)) return;

        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return;

        visited.add(nodeId);
        order.push(node);

        // Find outgoing edges
        const outgoingEdges = graph.edges.filter(e => e.from === nodeId);

        // For decision nodes, follow YES branch first, then NO (using edges, not node properties!)
        if (node.type === "decision") {
            const yesEdge = outgoingEdges.find(e => e.condition === "yes");
            const noEdge = outgoingEdges.find(e => e.condition === "no");

            if (yesEdge && !visited.has(yesEdge.to)) {
                traverse(yesEdge.to);
            }
            if (noEdge && !visited.has(noEdge.to)) {
                traverse(noEdge.to);
            }
            // Handle edges without condition labels (fallback)
            outgoingEdges.forEach(edge => {
                if (!edge.condition && !visited.has(edge.to)) {
                    traverse(edge.to);
                }
            });
        } else {
            // For other nodes, follow all outgoing edges
            outgoingEdges.forEach(edge => {
                if (!visited.has(edge.to)) {
                    traverse(edge.to);
                }
            });
        }
    }

    traverse(inputNode.id);

    // Add any remaining unvisited nodes (isolated nodes)
    graph.nodes.forEach(node => {
        if (!visited.has(node.id)) {
            order.push(node);
        }
    });

    return order;
}

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
    }
}
