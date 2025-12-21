export type PromptTarget =
    | "code"
    | "architecture"
    | "refactor"
    | "tests";

export const PromptPreset: Record<PromptTarget, string> = {
    code: `
Generate production-ready code.
Use clear naming and consistent structure.
Do not include explanations outside of code comments.
`,

    architecture: `
Describe the system architecture implied by the logic.
Focus on components, responsibilities, and data flow.
Avoid implementation details unless necessary.
`,

    refactor: `
Refactor existing code to better match the described logic.
Preserve external behavior unless explicitly stated otherwise.
Explain structural changes briefly.
`,

    tests: `
Generate tests that validate the described logic.
Cover happy paths, decision branches, and edge cases.
Use clear, deterministic test cases.
`,
};
