export type LogicNodeType =
    | "start"
    | "process"
    | "decision"
    | "output";

export type LogicNode = {
    id: string;
    type: LogicNodeType;
    label?: string;
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
