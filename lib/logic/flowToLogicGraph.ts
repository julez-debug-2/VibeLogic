import { Edge, Node } from "reactflow";
import { LogicGraph } from "./LogicGraph";

export function flowToLogicGraph(
    nodes: Node[],
    edges: Edge[]
): LogicGraph {
    return {
        nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data?.role || n.type as any,
            label: n.data?.title || n.data?.label,
            condition: n.data?.condition,
        })),

        edges: edges.map((e) => ({
            from: e.source,
            to: e.target,
            branch:
                e.sourceHandle === "yes"
                    ? "yes"
                    : e.sourceHandle === "no"
                        ? "no"
                        : undefined,
        })),
    };
}
