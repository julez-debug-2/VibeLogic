/**
 * AI-Prompt Analysis & Improvement Suggestions
 * 
 * Analyzes a generated prompt and provides structured feedback
 * on completeness, clarity, and potential improvements.
 */

export interface PromptAnalysisResult {
    analyzable: boolean; // false = Prompt zu vage für sinnvolle Analyse
    reason?: string; // Grund warum nicht analysierbar

    completenessScore: number; // 0-100
    clarityScore: number; // 0-100

    strengths: string[];
    weaknesses: string[];

    suggestions: PromptSuggestion[];

    improvedPrompt?: string; // Optimierte Version des Prompts
}

export interface PromptSuggestion {
    type: "missing_node" | "unclear_step" | "edge_case" | "best_practice";
    priority: "high" | "medium" | "low";
    title: string;
    description: string;

    // Optional: suggested node to add
    suggestedNode?: {
        role: "input" | "process" | "decision" | "output";
        title: string;
        description: string;
        condition?: string; // for decisions
    };
}

export interface PromptAnalysisOptions {
    provider: "ollama" | "openai" | "anthropic";
    apiKey?: string;
    ollamaEndpoint?: string;
    ollamaModel?: string;

    // Additional context for better analysis
    logicGraph?: {
        nodes: Array<{
            id: string;
            type: string;
            label?: string;
            description?: string;
            condition?: string;
        }>;
        edges: Array<{
            from: string;
            to: string;
            branch?: string;
        }>;
    };
}

/**
 * Analyze prompt using local Ollama instance
 */
async function analyzeWithOllama(
    metaPrompt: string,
    endpoint: string = "http://localhost:11434",
    model: string = "llama3.2"
): Promise<PromptAnalysisResult> {
    try {
        const response = await fetch(`${endpoint}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "Du bist ein deutscher Software-Architekt. WICHTIG: Antworte IMMER auf DEUTSCH. Alle Texte müssen deutsch sein. Antworte mit gültigem JSON ohne Markdown."
                    },
                    {
                        role: "user",
                        content: metaPrompt
                    }
                ],
                stream: false,
                format: "json"
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.message?.content || "{}";

        // Parse JSON response
        let parsed: any;
        try {
            parsed = JSON.parse(content);
            console.log("✅ Ollama Response parsed:", {
                hasCompleteness: !!parsed.completenessScore,
                hasClarity: !!parsed.clarityScore,
                hasImprovedPrompt: !!parsed.improvedPrompt,
                improvedPromptLength: parsed.improvedPrompt?.length || 0,
                keys: Object.keys(parsed)
            });
        } catch (e) {
            console.error("Failed to parse Ollama response:", content);
            throw new Error("Invalid JSON response from Ollama");
        }

        // Validate that we have the required fields
        if (!parsed || typeof parsed !== 'object') {
            console.error("Invalid response structure:", parsed);
            throw new Error("Response is not an object");
        }

        // Normalize arrays - ensure strengths/weaknesses are strings not objects
        const normalizeToStrings = (arr: any[]): string[] => {
            if (!Array.isArray(arr)) return [];
            return arr.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    // If it's an object, extract meaningful text
                    return item.text || item.title || item.description || JSON.stringify(item);
                }
                return String(item);
            });
        };

        const result: PromptAnalysisResult = {
            analyzable: parsed.analyzable !== false, // Default true for backwards compatibility
            reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
            completenessScore: typeof parsed.completenessScore === 'number' ? parsed.completenessScore : 0,
            clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : 0,
            strengths: normalizeToStrings(parsed.strengths || []),
            weaknesses: normalizeToStrings(parsed.weaknesses || []),
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            improvedPrompt: typeof parsed.improvedPrompt === 'string' ? parsed.improvedPrompt : undefined
        };

        return result;
    } catch (error) {
        console.error("Ollama analysis failed:", error);
        throw error;
    }
}

/**
 * Sends prompt to LLM for analysis (Ollama, OpenAI, Anthropic)
 */
export async function analyzePromptWithAI(
    prompt: string,
    options: PromptAnalysisOptions
): Promise<PromptAnalysisResult> {
    const metaPrompt = buildMetaPrompt(prompt, options.logicGraph);

    if (options.provider === "ollama") {
        return analyzeWithOllama(metaPrompt, options.ollamaEndpoint, options.ollamaModel);
    }

    // Fallback to mock for now
    return mockAnalysis();
}

/**
 * Builds the meta-prompt for AI analysis - COMPACT VERSION
 */
function buildMetaPrompt(prompt: string, logicGraph?: PromptAnalysisOptions['logicGraph']): string {
    let contextSection = "";

    if (logicGraph) {
        // Create a map of id -> readable name for edges
        const nodeNames = new Map<string, string>();
        logicGraph.nodes.forEach((n, i) => {
            const typeName = n.type.toUpperCase();
            const label = n.label || `Unbenannt ${i + 1}`;
            nodeNames.set(n.id, `[${typeName}] "${label}"`);
        });

        contextSection = `
## FLOW-KONTEXT (${logicGraph.nodes.length} Nodes):
${logicGraph.nodes.map((n, i) => {
            const typeName = n.type.toUpperCase();
            const label = n.label || `Unbenannt ${i + 1}`;
            const desc = n.description ? ` → "${n.description}"` : ' → ⚠️ KEINE BESCHREIBUNG!';
            const cond = n.condition ? ` | Bedingung: "${n.condition}"` : '';
            return `${i + 1}. [${typeName}] "${label}"${desc}${cond}`;
        }).join('\n')}

**Verbindungen:**
${logicGraph.edges.map(e => {
            const fromName = nodeNames.get(e.from) || e.from;
            const toName = nodeNames.get(e.to) || e.to;
            return `  ${fromName} → ${toName}${e.branch ? ` (${e.branch})` : ''}`;
        }).join('\n')}`;
    }

    return `Du bist ein erfahrener Code-Reviewer. Deine Aufgabe: Bewerte ob dieser Prompt umsetzbar ist und gib hilfreiche Verbesserungsvorschläge.

**SPRACHE: NUR DEUTSCH!**

**WICHTIGE UNTERSCHEIDUNG:**
1. **Stärken/Schwächen**: Beziehen sich NUR auf das, was TATSÄCHLICH im Prompt steht
2. **Suggestions**: Hier DARFST du kontextbezogene Vorschläge machen (z.B. Validierungsregeln, Fehlerbehandlung)
3. **improvedPrompt**: Kopiere Original + füge [VORSCHLAG: konkrete Idee] hinzu

${contextSection}

## PROMPT ZU ANALYSIEREN:
${prompt}

## BEWERTUNGS-REGELN:

**LIES DEN PROMPT GENAU!**
- Wenn "Username" und "Passwort" genannt sind = konkrete Felder (Stärke!)
- Widersprich dir NICHT (nicht gleichzeitig Stärke und Schwäche für dasselbe)

**Score-Regeln:**
| Situation | Max Score |
|-----------|-----------|
| Generische Namen ("Input", "Process") | MAX 20 |
| Konkrete Felder aber keine Validierung | 50-70 |
| Vollständig mit Fehlerbehandlung | 70+ |

**WICHTIG für Stärken:**
- Nenne NUR Stärken die WÖRTLICH im Prompt stehen
- Beispiel: Wenn "Username, Passwort" steht → "[INPUT] nennt konkrete Felder: Username, Passwort"

**WICHTIG für Schwächen:**
- NICHT das gleiche wie bei Stärken nennen!
- Was FEHLT? (z.B. Validierungsregeln, Fehlerbehandlung)

**PFLICHTFELDER für jede Suggestion:**
- title: MUSS ausgefüllt sein! Niemals leer oder "Unnamed"
- type: MUSS einer von: missing_node, unclear_step, edge_case, best_practice
- priority: MUSS einer von: high, medium, low
- suggestedNode.role: MUSS einer von: input, process, decision, output (NICHT "unknown"!)

**WICHTIG für Suggestions:**
- Generiere 2-3 Vorschläge PRO Prioritätsstufe (high, medium, low)
- high: Fehlende Fehlerbehandlung, Sicherheitslücken
- medium: Fehlende Details, Optimierungen  
- low: Best Practices, Nice-to-have

**REGEL für suggestedNode bei "unclear_step":**
- NICHT den existierenden Node kopieren!
- suggestedNode.title = GLEICHER Titel wie Original
- suggestedNode.description = VERBESSERTE, konkretere Beschreibung
- description (im suggestion) = erklärt WAS fehlt und WARUM es wichtig ist
- Beispiel:
  - Original: "Validiere Eingabe" (ohne Details)
  - SCHLECHT: suggestedNode mit "Validiere Eingabe" → "Prüft die Eingabe"
  - GUT: suggestedNode mit "Validiere Eingabe" → "Prüfe: Username 3-20 Zeichen alphanumerisch, Passwort min. 8 Zeichen mit Sonderzeichen"

**Für improvedPrompt:**
- Kopiere Original 1:1
- Ersetze vage Teile durch [PLATZHALTER]
- ERFINDE NICHTS!

## ENTSCHEIDUNGSBAUM für analyzable:

Hat der Prompt KONKRETE Namen (nicht nur "Input", "Process")?
  → NEIN: analyzable = false
  → JA: Weiter prüfen...

Sind Eingabefelder/Parameter GENANNT (z.B. "Username", "Email")?
  → JA: Das ist GUT, analyzable = true möglich
  → NEIN bei Input-Node: Schwäche notieren

Hat Decision eine ECHTE Bedingung (nicht nur "valide?", "ok?")?
  → JA: analyzable = true
  → NEIN: analyzable = false

## BEISPIEL 1 - SCHLECHT (analyzable: false):
Prompt: "Input: Daten-Eingang, Decision: Verzweigung, Process: Verarbeitung"
→ Alles generisch, keine konkreten Details
{
    "analyzable": false,
    "reason": "Alle Nodes haben nur generische Namen ohne konkrete Details",
    "completenessScore": 15,
    "clarityScore": 20,
    "strengths": [],
    "weaknesses": ["[INPUT] 'Input' - Was für Daten?", "[DECISION] - Was wird geprüft?"]
}

## BEISPIEL 2 - NUR ZUR FORMAT-DEMONSTRATION:
{
    "analyzable": true,
    "completenessScore": 65,
    "clarityScore": 70,
    "strengths": ["[TYP] 'Titel' - was genau gut ist (nur was IM PROMPT steht)"],
    "weaknesses": ["[TYP] 'Titel' - was genau fehlt (nur was IM PROMPT fehlt)"],
    "suggestions": [
        {"type": "edge_case", "priority": "high", "title": "Fehlerfall: ...", "description": "Konkrete Beschreibung", "suggestedNode": {"role": "decision", "title": "...", "description": "Konkreter Vorschlag"}},
        {"type": "missing_node", "priority": "high", "title": "Fehlerbehandlung für ...", "description": "...", "suggestedNode": {"role": "decision", "title": "...", "description": "..."}},
        {"type": "unclear_step", "priority": "medium", "title": "[TYP] 'Titel' - konkretisieren", "description": "...", "suggestedNode": {"role": "process", "title": "...", "description": "Konkreter Verbesserungsvorschlag"}},
        {"type": "best_practice", "priority": "low", "title": "Best Practice: ...", "description": "...", "suggestedNode": {"role": "process", "title": "...", "description": "..."}}
    ],
    "improvedPrompt": "KOMPLETTER Prompt mit [VORSCHLAG: konkrete Verbesserung] Markierungen"
}

## KREATIVITÄTS-ANWEISUNG:
- Analysiere den KONKRETEN Prompt oben
- Finde PASSENDE Vorschläge für DIESEN Use-Case
- Denke: "Was kann bei DIESEM spezifischen Flow schiefgehen?"
- Bei Suggestions DARFST du konkrete Vorschläge machen!

**Für improvedPrompt:**
- Kopiere ALLE Nodes aus dem Original (1, 2, 3, 4, ...)
- Füge [VORSCHLAG: konkrete Idee] hinzu wo sinnvoll
- Beispiel: "Username [VORSCHLAG: min. 3 Zeichen, max. 20, alphanumerisch]"
- Beispiel: "[VORSCHLAG: Neuer Node - Rate-Limiting nach 5 Fehlversuchen]"
- Behalte das Format (## LOGIC FLOW, ## DECISION BRANCHES, etc.)

## DEINE JSON-ANTWORT (NUR DEUTSCH):`;
}

/**
 * Mock analysis for development (replace with real API call)
 */
function mockAnalysis(): PromptAnalysisResult {
    return {
        analyzable: true,
        completenessScore: 65,
        clarityScore: 70,

        strengths: [
            "Klare Input-Definition mit konkreten Feldern",
            "Explizite Decision-Branches (yes/no)",
            "Strukturierte Ablauflogik"
        ],

        weaknesses: [
            "Fehlerbehandlung nur für Validierung, nicht für Authentifizierung",
            "Keine Berücksichtigung von Rate-Limiting oder Bruteforce-Schutz",
            "Output-Nodes beschreiben nur was passiert, nicht wie (z.B. Redirect, Status-Code)",
            "Decision 'Input Validierung' zu vage - welche Regeln genau?"
        ],

        suggestions: [
            {
                type: "missing_node",
                priority: "high",
                title: "Fehlerbehandlung für Authentifizierung fehlt",
                description: "Was passiert, wenn die Datenbank nicht erreichbar ist oder ein Server-Fehler auftritt?",
                suggestedNode: {
                    role: "decision",
                    title: "DB-Verbindung erfolgreich?",
                    description: "Prüft ob Datenbankverbindung besteht",
                    condition: "Database connection successful"
                }
            },
            {
                type: "edge_case",
                priority: "high",
                title: "Rate-Limiting fehlt",
                description: "Schutz vor Bruteforce-Attacken sollte vor der Authentifizierung geprüft werden",
                suggestedNode: {
                    role: "decision",
                    title: "Max Login-Versuche erreicht?",
                    description: "Prüft ob User in den letzten 15 Minuten mehr als 5 Versuche hatte",
                    condition: "Login attempts < 5 in last 15 minutes"
                }
            },
            {
                type: "unclear_step",
                priority: "medium",
                title: "Validierungsregeln konkretisieren",
                description: "Der Decision-Node 'Input Validierung' ist zu vage. Besser: Vorherigen Process-Node mit konkreten Regeln.",
                suggestedNode: {
                    role: "process",
                    title: "Validiere Formular-Eingaben",
                    description: "E-Mail: gültiges Format, Passwort: min. 8 Zeichen, Pflichtfelder ausgefüllt"
                }
            },
            {
                type: "best_practice",
                priority: "medium",
                title: "Output-Nodes sollten technische Details enthalten",
                description: "Statt 'Leite zu Dashboard weiter' besser 'HTTP 302 Redirect zu /dashboard mit Session-Cookie'",
                suggestedNode: {
                    role: "output",
                    title: "Erfolgreicher Login",
                    description: "HTTP 302 Redirect zu /dashboard, setze Session-Cookie (httpOnly, secure), logge Login-Event"
                }
            },
            {
                type: "missing_node",
                priority: "low",
                title: "Logging für Security-Audit",
                description: "Best Practice: Failed Login-Attempts sollten geloggt werden für Security-Monitoring",
                suggestedNode: {
                    role: "process",
                    title: "Logge fehlgeschlagenen Login-Versuch",
                    description: "Speichere Timestamp, IP-Adresse, verwendete E-Mail für Audit-Trail"
                }
            }
        ]
    };
}
