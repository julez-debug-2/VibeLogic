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
    insertPosition?: string; // e.g. "Zwischen Login und Validierung" or "Nach Validierung"

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
    return callOllama(metaPrompt, endpoint, model);
}

/**
 * Generic Ollama API call with JSON parsing
 */
async function callOllama(
    metaPrompt: string,
    endpoint: string,
    model: string,
    parseJson: boolean = true
): Promise<any> {
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
                format: parseJson ? "json" : undefined
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.message?.content || (parseJson ? "{}" : "");

        if (!parseJson) {
            return content; // Return raw string for Step 3
        }

        // Parse JSON response
        let parsed: any;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse Ollama response:", content);
            throw new Error("Invalid JSON response from Ollama");
        }

        return parsed;
    } catch (error) {
        console.error("Ollama call failed:", error);
        throw error;
    }
}

/**
 * Build flow context string for meta-prompts
 */
function buildFlowContext(logicGraph?: PromptAnalysisOptions['logicGraph']): string {
    if (!logicGraph) return "";

    const nodeNames = new Map<string, string>();
    logicGraph.nodes.forEach((n, i) => {
        const typeName = n.type.toUpperCase();
        const label = n.label || `Unbenannt ${i + 1}`;
        nodeNames.set(n.id, `[${typeName}] "${label}"`);
    });

    return `## FLOW-KONTEXT (${logicGraph.nodes.length} Nodes):
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

/**
 * Sends prompt to LLM for analysis (Ollama, OpenAI, Anthropic)
 * Uses multi-step approach for better quality
 */
export async function analyzePromptWithAI(
    prompt: string,
    options: PromptAnalysisOptions
): Promise<PromptAnalysisResult> {
    if (options.provider === "ollama") {
        return analyzeWithOllamaMultiStep(
            prompt,
            options.logicGraph,
            options.ollamaEndpoint,
            options.ollamaModel
        );
    }

    // Fallback to mock for now
    return mockAnalysis();
}

/**
 * Multi-step analysis for better quality
 */
async function analyzeWithOllamaMultiStep(
    prompt: string,
    logicGraph: PromptAnalysisOptions['logicGraph'],
    endpoint: string = "http://localhost:11434",
    model: string = "qwen3:14b"
): Promise<PromptAnalysisResult> {
    console.log("🔄 Starting multi-step analysis...");

    // Step 1: Basic Analysis (scores, strengths, weaknesses)
    const step1 = await analyzeStep1(prompt, logicGraph, endpoint, model);
    console.log("✅ Step 1 complete:", { analyzable: step1.analyzable, scores: [step1.completenessScore, step1.clarityScore] });

    if (!step1.analyzable) {
        // If not analyzable, return early
        return {
            ...step1,
            suggestions: [],
            improvedPrompt: undefined
        };
    }

    // Step 2: Generate Suggestions
    const suggestions = await analyzeStep2(prompt, logicGraph, step1, endpoint, model);
    console.log("✅ Step 2 complete:", suggestions.length, "suggestions");

    // Step 3: Generate Improved Prompt
    const improvedPrompt = await analyzeStep3(prompt, step1, suggestions, endpoint, model);
    console.log("✅ Step 3 complete: improvedPrompt length:", improvedPrompt?.length || 0);

    return {
        ...step1,
        suggestions,
        improvedPrompt
    };
}

/**
 * Step 1: Analyze prompt quality (scores, strengths, weaknesses)
 */
async function analyzeStep1(
    prompt: string,
    logicGraph: PromptAnalysisOptions['logicGraph'],
    endpoint: string,
    model: string
): Promise<Omit<PromptAnalysisResult, 'suggestions' | 'improvedPrompt'>> {
    const flowContext = buildFlowContext(logicGraph);

    const metaPrompt = `Du bist ein Logik-Flow-Analyst. Bewerte NUR die Struktur und Verständlichkeit der Logik, KEINE fachlichen Software-Engineering-Tipps!

**SPRACHE: NUR DEUTSCH!**

${flowContext}

## PROMPT ZU ANALYSIEREN:
${prompt}

## DEINE AUFGABE (Fokus: Logik, nicht Code!):
1. Ist die **Logik verständlich und umsetzbar**? (analyzable: true/false)
2. Bewerte **Vollständigkeit** (alle Schritte da?) und **Klarheit** (Namen/Bedingungen eindeutig?) (0-100)
3. Finde Stärken (was steht WÖRTLICH im Prompt und ist logisch klar)
4. Finde Schwächen (was ist unklar, fehlt, oder verletzt Strukturregeln)

**⚠️ VERBOTEN (keine fachlichen Code-Tipps!):**
- ❌ NICHT: "SQL-Injection-Schutz fehlt" oder "Verwende parametrisierte Abfragen"
- ❌ NICHT: "Fehlercodes wie AUTH-001 hinzufügen"
- ❌ NICHT: "Passwort sollte min. 8 Zeichen haben"
- ❌ NICHT: "Implementiere Rate Limiting"
→ Das sind Implementierungsdetails, nicht Logik-Probleme!

**✅ ERLAUBT (Logik-Struktur bewerten + konkrete Umformulierungs-Vorschläge):**

**A) Strukturprobleme benennen:**
- ✅ "Regel 3.1 verletzt: Validierung und DB-Abfrage im gleichen Node"
- ✅ "Decision-Name unklar - 'Datenbankabgleich' beschreibt keinen Entscheidungspunkt"
- ✅ "Fehlerpfad 'Abbruch' ohne Differenzierung - mehrere Fehlerursachen"

**B) Konkrete Logik-Verbesserungen vorschlagen:**
- ✅ "Node umbenennen: 'Datenbankabgleich' → 'User gefunden und Passwort korrekt?'"
- ✅ "Node aufteilen: 'Eingabevalidierung' → 1) [Process] Format-Check, 2) [Process] DB-Suche"
- ✅ "Fehlerpfade differenzieren: Statt 1x 'Abbruch' → 'Abbruch: User nicht gefunden' + 'Abbruch: Falsches Passwort'"
- ✅ "Zwischenschritt hinzufügen: [Process] User in DB suchen → [Decision] User gefunden?"

**Kriterien für analyzable:**
- false: Nodes heißen nur "Input", "Process" ohne echte Namen
- false: Keine konkreten Bedingungen in Decisions
- true: Konkrete Namen, Felder, Bedingungen vorhanden

**Score-Regeln (STRIKT ANWENDEN - SEI KRITISCH!):**
- Nur generische Namen ("Username", "Passwort" ohne Details) → 20-35/100
- Konkrete Felder + einfache Decision OHNE klare Struktur → 35-50/100
- Mit klaren Schritten aber unvollständig (fehlende Pfade) → 50-65/100
- Mit allen Pfaden + klaren Bedingungen → 65-80/100
- Vollständig mit allen Edge-Cases und regelkonform → 80-95/100

**BEISPIEL für typischen Login-Flow:**
- "Username, Passwort" sind nur Namen → 35/100 Vollständigkeit
- "Datenbankabgleich" als Decision-Name ist unklar → 40/100 Klarheit
- Wenn Validierung + DB-Abfrage im gleichen Node → Regel 3.1 verletzt → MAX 50/100!
- Wenn Fehlerpfad ohne Differenzierung (Timeout vs falsches PW) → MAX 55/100!

**WICHTIG für Stärken/Schwächen:**
- Stärken = NUR was WÖRTLICH im Prompt steht UND logisch klar ist
- Schwächen = Was unklar, unvollständig oder strukturell falsch ist
- LIES DEN PROMPT GENAU! Erfinde keine Details!
- KEINE fachlichen Tipps (Security, Performance, Best Practices)!
- NUR Logik-Struktur bewerten: Ist es verständlich? Ist es vollständig? Ist es umsetzbar?

**⚠️ PFLICHT: STRUKTURREGELN PRÜFEN (Top-Priorität!):**

Prüfe ZUERST diese formalen Logik-Strukturregeln. Bei Verstoß → MUSS in weaknesses:

**🔴 KRITISCHE REGELN (immer prüfen):**
- **Regel 3.1** - Validierung VOR Verarbeitung? 
  → Wenn Eingabe-Check (Format) und Datenverarbeitung (DB-Suche) im gleichen Node → VERLETZT!
  ✅ RICHTIG: "Regel 3.1: Validierung und DB-Abfrage im gleichen Node 'Eingabevalidierung'"
  ❌ FALSCH: "SQL-Injection-Schutz fehlt" (das ist fachlich, nicht strukturell!)
  
- **Regel 3.2** - Existenzprüfung VOR Inhaltsprüfung?
  → Erst prüfen ob User existiert, DANN ob Passwort korrekt
  ✅ RICHTIG: "Regel 3.2: Passwort-Check ohne vorherige Existenzprüfung"
  
- **Regel 2.1** - Prüfbare Bedingung in Decision?
  → Decision-Name muss eine Frage/Kriterium sein
  ✅ RICHTIG: "Regel 2.1: 'Datenbankabgleich' ist kein prüfbares Kriterium - besser 'User gefunden?'"
  ❌ FALSCH: "Decision-Name sollte aussagekräftiger sein" (zu vage!)
  
- **Regel 5.1** - Fehlerpfade explizit?
  → "Abbruch" ohne Differenzierung = unklar
  ✅ RICHTIG: "Regel 5.1: Fehlerpfad 'Abbruch' ohne Details - was bei Timeout vs falsches PW vs User nicht gefunden?"
  ❌ FALSCH: "Keine Fehlercodes definiert" (Implementierungsdetail!)
  
- **Regel 1.3** - Jeder Pfad endet in Output?
  → Gut wenn ja, sonst VERLETZT!

**🟡 WICHTIGE REGELN:**
- **Regel 1.1** - Genau ein Start-Node?
- **Regel 1.5** - Alle Nodes erreichbar vom Start?
- **Regel 1.7** - Keine Endlosschleifen?
- **Regel 2.3** - Bedingungen eindeutig?
- **Regel 2.6** - Alle Decision-Fälle (YES/NO) abgedeckt?
- **Regel 5.2** - Fehlerpfade führen zu Output?
- **Regel 6.1** - Keine doppelten Prüfungen?
- **Regel 7.3** - Namen beschreiben WAS, nicht WARUM?

**[TYP] Kategorien für Stärken:**
- [Konkrete Felder] - Eingaben/Ausgaben benannt (z.B. "Username, Passwort")
- [Klare Bedingungen] - Decision hat prüfbare Bedingung (z.B. "User gefunden?")
- [Eindeutige Outputs] - Was passiert ist definiert (z.B. "Fehlermeldung ausgeben")
- [Logischer Ablauf] - Flow-Struktur ist logisch (Input → Process → Decision → Output)
- [Regelkonform] - Strukturregel eingehalten (z.B. "Regel 1.3: Jeder Pfad endet in Output")

**[TYP] Kategorien für Schwächen (mit konkreten Logik-Verbesserungen!):**
- [Strukturregel verletzt] - **MUSS verwendet werden!** Format: "Regel X.Y: Problem → Vorschlag"
  Beispiele:
  • "Regel 3.1: Validierung und DB-Abfrage im gleichen Node 'Eingabevalidierung' → Aufteilen in 1) Format-Check, 2) DB-Suche"
  • "Regel 5.1: Fehlerpfad 'Abbruch' ohne Differenzierung → Separate Outputs: 'User nicht gefunden' + 'Falsches Passwort'"
  • "Regel 2.1: Decision-Name 'Datenbankabgleich' ist kein prüfbares Kriterium → Umbenennen: 'User gefunden und PW korrekt?'"
  
- [Unklare Logik] - Namen/Bedingungen sind vage → konkrete Alternative vorschlagen
  Beispiele:
  • "Process-Node 'Verarbeitung' ohne konkrete Beschreibung → Umbenennen: 'Formular-Daten validieren'"
  • "Decision ohne klare Bedingung → Konkretisieren: 'Ist Eingabe gültig?' statt nur 'Prüfung'"
  
- [Fehlende Schritte] - Logik-Lücken im Flow → fehlenden Schritt benennen
  Beispiele:
  • "Kein Schritt definiert WIE User gesucht wird → Einfügen: [Process] 'Username in DB suchen'"
  • "Sprung von Input zu Decision → Zwischenschritt: [Process] 'Eingaben bereinigen (trim, lowercase)'"
  
- [Unvollständige Pfade] - Nicht alle Fälle abgedeckt → fehlende Branches hinzufügen
  Beispiele:
  • "Decision hat nur YES-Branch → NO-Branch hinzufügen: 'Fehlermeldung ausgeben'"
  • "Fehlerpfad endet nicht in Output → Output-Node ergänzen: 'Login fehlgeschlagen'"

**❌ VERMEIDE diese Schwächen-Typen (zu fachlich!):**
- ❌ [Fehlende Validierung] mit "min. 8 Zeichen Passwort" → zu technisch!
- ❌ [Unklare Implementierung] mit "SQL-Injection-Schutz" → Code-Detail!
- ❌ [Fehlende Edge Cases] mit "Rate Limiting" → Security-Thema!

JSON-ANTWORT (NUR DEUTSCH - nutze EXAKT dieses Format!):
{
    "analyzable": true/false,
    "reason": "Nur wenn false: Warum?",
    "completenessScore": 0-100,
    "clarityScore": 0-100,
    "strengths": [
        "[Konkrete Felder] Username und Passwort sind explizit benannt",
        "[Klare Bedingungen] 'Username gefunden und Kennwort korrekt?' ist eindeutig formuliert"
    ],
    "weaknesses": [
        "[Strukturregel verletzt] Regel 3.1: Validierung und DB-Abfrage im gleichen Node 'Eingabevalidierung' → Aufteilen in 1) Format-Check, 2) DB-Suche",
        "[Strukturregel verletzt] Regel 5.1: Fehlerpfad 'Abbruch' ohne Differenzierung → Separate Outputs: 'Abbruch: User nicht gefunden' + 'Abbruch: Falsches Passwort'",
        "[Unklare Logik] Process-Node 'Eingabevalidierung' zu vage → Konkretisieren: 'Username-Format prüfen (3-20 Zeichen, alphanumerisch)'"
    ]
}

**⚠️ WICHTIG: 
1. Prüfe ZUERST die 🔴 KRITISCHEN REGELN!
2. Bei Verstoß → "[Strukturregel verletzt] Regel X.Y: Problem → Vorschlag"
3. Gib KONKRETE Umformulierungs-Tipps (Node umbenennen, aufteilen, ergänzen)
4. KEINE fachlichen Code-Tipps (SQL, Security, Fehlercodes)!
5. Fokus: Wie kann die LOGIK klarer/vollständiger werden?**
`;

    const parsed = await callOllama(metaPrompt, endpoint, model);

    // Normalize arrays
    const normalizeToStrings = (arr: any[]): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
                return item.text || item.title || item.description || JSON.stringify(item);
            }
            return String(item);
        });
    };

    return {
        analyzable: parsed.analyzable !== false,
        reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
        completenessScore: typeof parsed.completenessScore === 'number' ? parsed.completenessScore : 0,
        clarityScore: typeof parsed.clarityScore === 'number' ? parsed.clarityScore : 0,
        strengths: normalizeToStrings(parsed.strengths || []),
        weaknesses: normalizeToStrings(parsed.weaknesses || [])
    };
}

/**
 * Step 2: Generate suggestions based on weaknesses
 * Uses multiple API calls (1 per weakness) for better reliability with smaller models
 */
async function analyzeStep2(
    prompt: string,
    logicGraph: PromptAnalysisOptions['logicGraph'],
    step1Result: Omit<PromptAnalysisResult, 'suggestions' | 'improvedPrompt'>,
    endpoint: string,
    model: string
): Promise<PromptSuggestion[]> {
    const flowContext = buildFlowContext(logicGraph);
    const suggestions: PromptSuggestion[] = [];

    // Take top 3-4 weaknesses (or all if less than 4)
    const topWeaknesses = step1Result.weaknesses.slice(0, 4);

    console.log(`🔄 Generating ${topWeaknesses.length} suggestions (1 per weakness)...`);

    // Generate 1 suggestion per weakness with separate API calls
    for (let i = 0; i < topWeaknesses.length; i++) {
        const weakness = topWeaknesses[i];

        try {
            const suggestion = await generateSuggestionForWeakness(
                prompt,
                flowContext,
                weakness,
                i,
                topWeaknesses.length,
                endpoint,
                model
            );

            if (suggestion) {
                suggestions.push(suggestion);
                console.log(`  ✓ Suggestion ${i + 1}/${topWeaknesses.length}: ${suggestion.title}`);
            }
        } catch (error) {
            console.warn(`  ⚠️ Failed to generate suggestion for weakness ${i + 1}:`, error);
        }
    }

    return suggestions;
}

/**
 * Generate a single suggestion for a specific weakness
 */
async function generateSuggestionForWeakness(
    prompt: string,
    flowContext: string,
    weakness: string,
    index: number,
    total: number,
    endpoint: string,
    model: string
): Promise<PromptSuggestion | null> {
    // Determine priority based on position (first weaknesses are usually more critical)
    const priority = index === 0 ? "high" : index < 2 ? "medium" : "low";

    const metaPrompt = `Du bist ein erfahrener Code-Reviewer. Generiere EINE konkrete Verbesserungsvorschlag.

**SPRACHE: NUR DEUTSCH!**

${flowContext}

## ORIGINAL PROMPT:
${prompt}

## SCHWÄCHE DIE ADRESSIERT WERDEN SOLL:
${weakness}

## AUFGABE:
Generiere EINE Suggestion die EXAKT diese Schwäche behebt.

**Priorität:** ${priority}

**JSON-FORMAT (genau ein Objekt!):**
{
  "type": "missing_node",
  "priority": "${priority}",
  "title": "Konkreter Titel der diese Schwäche behebt",
  "description": "Was fehlt und warum es wichtig ist",
  "insertPosition": "Wo im Flow (z.B. 'Zwischen Login und Validierung')",
  "suggestedNode": {
    "role": "process",
    "title": "Node-Titel",
    "description": "Detaillierte Beschreibung was dieser Node tut"
  }
}

**Wichtig:**
- Beziehe dich DIREKT auf die oben genannte Schwäche
- Sei konkret und spezifisch für DIESEN Flow
- type kann sein: "missing_node", "unclear_step", "edge_case", "best_practice"
- role kann sein: "input", "process", "decision", "output"

Antworte NUR mit dem JSON-Objekt (keine Erklärungen):`;

    const result = await callOllama(metaPrompt, endpoint, model);

    // Validate result
    if (!result || typeof result !== 'object') {
        console.error(`Invalid result for weakness ${index + 1}:`, result);
        return null;
    }

    // Ensure priority matches
    if (result.priority !== priority) {
        result.priority = priority;
    }

    return result as PromptSuggestion;
}

/**
 * Step 3: Generate improved prompt
 */
async function analyzeStep3(
    prompt: string,
    step1Result: Omit<PromptAnalysisResult, 'suggestions' | 'improvedPrompt'>,
    suggestions: PromptSuggestion[],
    endpoint: string,
    model: string
): Promise<string | undefined> {
    const metaPrompt = `Du bist ein erfahrener Code-Reviewer. Verbessere den Prompt.

**SPRACHE: NUR DEUTSCH!**

## ORIGINAL PROMPT:
${prompt}

## SCHWÄCHEN:
${step1Result.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## VORSCHLÄGE:
${suggestions.slice(0, 5).map((s, i) => `${i + 1}. [${s.priority.toUpperCase()}] ${s.title}`).join('\n')}

## AUFGABE:
Erstelle einen verbesserten Prompt mit [VORSCHLAG: ...] Markierungen.

**AUSGABE-FORMAT (WICHTIG!):**
- Kopiere den Original-Prompt komplett
- Füge [VORSCHLAG: Details] inline hinzu (z.B. "Username [VORSCHLAG: min. 3-20 Zeichen]")
- Füge neue Nodes am Ende mit "[VORSCHLAG: Neuer Node - Titel] Beschreibung" hinzu

**KRITISCH - AUSGABE DARF NUR ENTHALTEN:**
- ✅ Den Original-Prompt mit [VORSCHLAG: ...] Ergänzungen
- ❌ KEINE Meta-Erklärungen wie "## AUFGABE" oder "## SCHWÄCHEN"
- ❌ KEINE Liste "## VORSCHLÄGE: 1. [HIGH]..."
- ❌ KEIN JSON-Wrapper wie { "prompt": "..." }

Antworte NUR mit dem verbesserten Prompt-Text (keine Erklärungen, keine Meta-Texte!):`;

    const result = await callOllama(metaPrompt, endpoint, model, false); // No JSON parsing
    return typeof result === 'string' ? result : undefined;
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
