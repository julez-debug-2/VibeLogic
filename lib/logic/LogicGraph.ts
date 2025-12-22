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

export type LogicEdge = {
    from: string;
    to: string;
    branch?: "yes" | "no";
};

export type LogicGraph = {
    nodes: LogicNode[];
    edges: LogicEdge[];
};
