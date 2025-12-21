/**
 * Core logic types
 * ----------------
 * These types represent the user's idea as structured logic.
 * They are UI-agnostic and LLM-agnostic.
 */

/* -----------------------------------------
 * Basic building blocks
 * ----------------------------------------- */

export type LogicId = string;

export type LogicNodeType =
    | "start"
    | "process"
    | "decision"
    | "input"
    | "output"
    | "end";

/* -----------------------------------------
 * Node definitions
 * ----------------------------------------- */

export interface BaseLogicNode {
    id: LogicId;
    type: LogicNodeType;
    label: string;
    description?: string;
}

/**
 * A logic node representing a data input
 * Example: user enters email, API receives payload
 */
export interface InputNode extends BaseLogicNode {
    type: "input";
    dataType?: string;
    required?: boolean;
}

/**
 * A processing step
 * Example: validate email, calculate total price
 */
export interface ProcessNode extends BaseLogicNode {
    type: "process";
}

/**
 * A decision point with conditions
 * Example: if user is authenticated
 */
export interface DecisionNode extends BaseLogicNode {
    type: "decision";
    condition: string;
    branches: {
        yes: LogicId;
        no: LogicId;
    };
}

/**
 * Output / result
 * Example: return success response, show error message
 */
export interface OutputNode extends BaseLogicNode {
    type: "output";
    format?: string;
}

/**
 * Start & end nodes
 */
export interface StartNode extends BaseLogicNode {
    type: "start";
}

export interface EndNode extends BaseLogicNode {
    type: "end";
}

/* -----------------------------------------
 * Union type for all nodes
 * ----------------------------------------- */

export type LogicNode =
    | StartNode
    | InputNode
    | ProcessNode
    | DecisionNode
    | OutputNode
    | EndNode;

/* -----------------------------------------
 * Connections between nodes
 * ----------------------------------------- */

export interface LogicEdge {
    from: LogicId;
    to: LogicId;
    condition?: string; // e.g. "yes", "no", "fallback"
}

/* -----------------------------------------
 * Complete logic graph
 * ----------------------------------------- */

export interface LogicGraph {
    id: string;
    title: string;
    description?: string;

    nodes: LogicNode[];
    edges: LogicEdge[];
}

/* -----------------------------------------
 * Analysis result (derived, not user input)
 * ----------------------------------------- */

export interface LogicAnalysis {
    inputs: InputNode[];
    decisions: DecisionNode[];
    outputs: OutputNode[];

    hasLoops: boolean;
    complexityScore: number; // rough heuristic
}
