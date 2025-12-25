export type LogicNodeType =
    | "input"
    | "process"
    | "decision"
    | "output";

export type LogicNode = {
    id: string;
    type: LogicNodeType;
    label?: string;
    description?: string;
    condition?: string;
};

// Updated: condition instead of branch for edge conditions
export type LogicEdge = {
    id: string;
    from: string;
    to: string;
    condition?: "yes" | "no" | string;
};

export type LogicGraph = {
    id?: string;
    title?: string;
    description?: string;
    nodes: LogicNode[];
    edges: LogicEdge[];
};
