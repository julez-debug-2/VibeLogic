import { Edge, Node } from "@xyflow/react";
import { LogicGraph } from "../../core/logic/types";

/**
 * Convert LogicGraph to ReactFlow nodes/edges (reverse of flowToLogicGraph).
 * Used for rendering AI-generated flows.
 */

export function logicGraphToFlow(graph: LogicGraph): {
    nodes: Node[];
    edges: Edge[];
} {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate positions using simple vertical layout
    let yOffset = 100;
    const xBase = 400;
    const yStep = 150;

    // Track decision branches for horizontal positioning
    const processedNodes = new Set<string>();
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Build position map (simple top-down flow)
    graph.nodes.forEach((node, index) => {
        nodePositions.set(node.id, {
            x: xBase,
            y: yOffset + index * yStep,
        });
    });

    // Create ReactFlow nodes
    graph.nodes.forEach((node) => {
        const position = nodePositions.get(node.id)!;

        nodes.push({
            id: node.id,
            type: "logicBlock", // All nodes use logicBlock type
            position,
            data: {
                role: node.type,
                title: node.label,
                description: node.description || node.label,
                ...(node.type === "decision" &&
                    "branches" in node &&
                    node.branches
                    ? { condition: node.label }
                    : {}),
            },
        });
    });

    // Create ReactFlow edges
    graph.edges.forEach((edge) => {
        const reactEdge: Edge = {
            id: edge.id,
            source: edge.from,
            target: edge.to,
            type: "smoothstep",
            animated: true,
        };

        // Add branch label for decisions
        if (edge.condition) {
            reactEdge.label = edge.condition.toUpperCase();
            reactEdge.sourceHandle = edge.condition; // YES/NO handle
            reactEdge.style = {
                stroke: edge.condition === "yes" ? "#22c55e" : "#ef4444",
            };
        }

        edges.push(reactEdge);
    });

    return { nodes, edges };
}
