import type {
    LogicGraph
} from "@/lib/logic/LogicGraph";

/* -----------------------------------------
 * Flow Validation & Analysis
 * ----------------------------------------- */

export interface ValidationIssue {
    severity: "error" | "warning";
    message: string;
    nodeId?: string;
}

export interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

/**
 * Validates a LogicGraph for common structural issues
 */
export function validateLogicGraph(graph: LogicGraph): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 1. Check if at least one Output node exists
    const outputNodes = graph.nodes.filter(n => n.type === "output");
    if (outputNodes.length === 0) {
        issues.push({
            severity: "error",
            message: "Flow muss mindestens einen Output-Node haben",
        });
    }

    // 2. Check if all Decision nodes have both yes/no branches
    const decisionNodes = graph.nodes.filter(n => n.type === "decision");
    for (const decision of decisionNodes) {
        // In lib structure, branches are stored in edges with branch: "yes"/"no"
        const yesEdge = graph.edges.find(e => e.from === decision.id && e.branch === "yes");
        const noEdge = graph.edges.find(e => e.from === decision.id && e.branch === "no");

        if (!yesEdge || !noEdge) {
            issues.push({
                severity: "error",
                message: `Decision "${decision.condition || decision.label}" fehlt yes/no Branch`,
                nodeId: decision.id,
            });
        }

        // Check if branches actually connect to existing nodes
        if (yesEdge && !graph.nodes.find((n) => n.id === yesEdge.to)) {
            issues.push({
                severity: "error",
                message: `Decision "${decision.condition || decision.label}" yes-Branch führt zu nicht existierendem Node`,
                nodeId: decision.id,
            });
        }
        if (noEdge && !graph.nodes.find((n) => n.id === noEdge.to)) {
            issues.push({
                severity: "error",
                message: `Decision "${decision.condition || decision.label}" no-Branch führt zu nicht existierendem Node`,
                nodeId: decision.id,
            });
        }
    }

    // 3. Check for isolated nodes (no incoming or outgoing edges)
    const connectedNodeIds = new Set<string>();
    for (const edge of graph.edges) {
        connectedNodeIds.add(edge.from);
        connectedNodeIds.add(edge.to);
    }

    for (const node of graph.nodes) {
        // Output nodes don't need outgoing edges
        if (node.type === "output") {
            if (!connectedNodeIds.has(node.id)) {
                issues.push({
                    severity: "warning",
                    message: `Node "${node.label || node.id}" ist isoliert (keine Verbindungen)`,
                    nodeId: node.id,
                });
            }
            continue;
        }

        // All other nodes should be connected
        if (!connectedNodeIds.has(node.id)) {
            issues.push({
                severity: "warning",
                message: `Node "${node.label || node.id}" ist isoliert (keine Verbindungen)`,
                nodeId: node.id,
            });
        }
    }

    // 4. Check for nodes without outgoing connections (dead ends)
    const nodeIdsWithOutgoing = new Set<string>();
    for (const edge of graph.edges) {
        nodeIdsWithOutgoing.add(edge.from);
    }

    for (const node of graph.nodes) {
        // Output nodes are allowed to have no outgoing edges
        if (node.type === "output") continue;

        if (!nodeIdsWithOutgoing.has(node.id)) {
            issues.push({
                severity: "warning",
                message: `Node "${node.label || node.id}" hat keine ausgehenden Verbindungen`,
                nodeId: node.id,
            });
        }
    }

    // 5. Check if all Input nodes lead somewhere
    const inputNodes = graph.nodes.filter(n => n.type === "input");
    if (inputNodes.length === 0) {
        issues.push({
            severity: "warning",
            message: "Flow hat keine Input-Nodes definiert",
        });
    }

    return {
        isValid: !issues.some((i) => i.severity === "error"),
        issues,
    };
}

/**
 * Performs reachability analysis to find unreachable nodes
 */
export function findUnreachableNodes(graph: LogicGraph): string[] {
    // Find input nodes as start points
    const inputNodes = graph.nodes.filter((n) => n.type === "input");
    const startIds: string[] = inputNodes.map((n) => n.id);

    if (startIds.length === 0 && graph.nodes.length > 0) {
        // Use first node as implicit start
        startIds.push(graph.nodes[0].id);
    }

    const reachable = new Set<string>();
    const queue: string[] = [...startIds];

    // BFS to find all reachable nodes
    while (queue.length > 0) {
        const current = queue.shift()!;
        if (reachable.has(current)) continue;
        reachable.add(current);

        // Find outgoing edges
        for (const edge of graph.edges) {
            if (edge.from === current && !reachable.has(edge.to)) {
                queue.push(edge.to);
            }
        }
    }

    // Return nodes that are NOT reachable
    return graph.nodes
        .filter((n) => !reachable.has(n.id))
        .map((n) => n.id);
}

/**
 * Calculates a rough complexity score based on nodes and branches
 */
export function calculateComplexity(graph: LogicGraph): number {
    let score = 0;

    // Base complexity from node count
    score += graph.nodes.length;

    // Add complexity for decisions (creates branches)
    const decisions = graph.nodes.filter((n) => n.type === "decision");
    score += decisions.length * 2; // Each decision doubles paths

    // Add complexity for edges (connections increase mental load)
    score += graph.edges.length * 0.5;

    return Math.round(score);
}

/**
 * Detects loops in the flow graph
 */
export function hasLoops(graph: LogicGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function dfs(nodeId: string): boolean {
        if (recursionStack.has(nodeId)) return true; // Cycle detected
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        // Check outgoing edges
        for (const edge of graph.edges) {
            if (edge.from === nodeId) {
                if (dfs(edge.to)) return true;
            }
        }

        recursionStack.delete(nodeId);
        return false;
    }

    // Check from all input nodes
    const inputNodes = graph.nodes.filter((n) => n.type === "input");
    if (inputNodes.length === 0 && graph.nodes.length > 0) {
        // Use first node if no input exists
        return dfs(graph.nodes[0].id);
    }

    for (const input of inputNodes) {
        if (dfs(input.id)) return true;
    }

    return false;
}
