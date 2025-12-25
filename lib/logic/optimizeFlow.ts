import { Edge, Node } from "reactflow";

/**
 * Convert ReactFlow nodes/edges to simple text format
 */
export function flowToText(nodes: Node[], edges: Edge[]): string {
    // Sort nodes by Y position (top to bottom)
    const sortedNodes = [...nodes].sort((a, b) =>
        (a.position?.y || 0) - (b.position?.y || 0)
    );

    const lines: string[] = [];

    for (const node of sortedNodes) {
        const role = node.data.role;
        const title = node.data.title || "Unnamed";
        const description = node.data.description || "";

        const type = role.toUpperCase();

        if (role === "decision") {
            // Find YES and NO edges
            const outEdges = edges.filter(e => e.source === node.id);
            const yesEdge = outEdges.find(e => e.sourceHandle === "yes");
            const noEdge = outEdges.find(e => e.sourceHandle === "no");

            // Resolve target titles
            const yesTarget = yesEdge ? nodes.find(n => n.id === yesEdge.target)?.data.title : "";
            const noTarget = noEdge ? nodes.find(n => n.id === noEdge.target)?.data.title : "";

            lines.push(`${type}: ${title}${description ? ' | ' + description : ''}`);
            if (yesTarget) lines.push(`  YES -> ${yesTarget}`);
            if (noTarget) lines.push(`  NO -> ${noTarget}`);
        } else {
            lines.push(`${type}: ${title}${description ? ' | ' + description : ''}`);
        }
    }

    return lines.join('\n');
}

/**
 * Send flow text to AI for optimization
 */
export async function optimizeWithAI(
    flowText: string,
    endpoint: string = "http://localhost:11434",
    model: string = "qwen2.5:32b",
    apiKey?: string
): Promise<string> {

    const prompt = `Du bist ein Senior Software Engineer. Der User hat folgenden Logik-Flow erstellt.

**FLOW:**
\`\`\`
${flowText}
\`\`\`

**DEINE AUFGABE:**

Stelle dir die kritische Frage: **Ist dieser Flow logisch und vollständig?**

- Macht die Reihenfolge Sinn?
- Sind alle notwendigen Schritte da?
- Führen alle Branches zu sinnvollen Zielen?
- Gibt es fehlende Verbindungen?
- Sind Decision-Fragen klar und atomar?
- Passen die Error-Outputs zu den Fail-Cases?
- Fehlt eine Loop-Struktur wo sie benötigt wird?

**Wenn der Flow logisch ist:** Gib ihn unverändert zurück (eventuell mit verbesserten Beschreibungen).

**Wenn der Flow NICHT logisch ist:** Korrigiere die Probleme und gib die korrigierte Version aus.

---

**Technische Orientierung:**

**Node-Typen:**
- INPUT = Datenquelle, Parameter
- PROCESS = Verarbeitung, Transformation, Iteration
- DECISION = Eine konkrete Ja/Nein-Frage
- OUTPUT = Ergebnis, Fehlermeldung

**Wichtige Patterns:**
- **Mehrere Inputs:** Bei Datenabgleich/Matching sind zwei separate Inputs OK (z.B. zwei Tabellen)
- **Atomare Decisions:** Eine Decision = eine Frage
- **Process → Output:** Parser verbindet Process NICHT automatisch zu Output
  - Lösung: Decision nach Process die zum Output führt
  - Beispiel: Process "Sammeln" → Decision "Fertig?" YES → Output "Ergebnis"

---

**FORMAT (STRIKTE PFLICHT - sonst Parser-Fehler):**

Das System erwartet EXAKT dieses Format, sonst Parser-Fehler:

\`\`\`
INPUT: <titel> | <beschreibung>
PROCESS: <titel> | <beschreibung>
DECISION: <titel> | <beschreibung>
  YES -> <exakter-node-titel>
  NO -> <exakter-node-titel>
OUTPUT: <titel> | <beschreibung>
\`\`\`

**Kritische Format-Regeln:**
- Zeile MUSS beginnen mit: \`INPUT:\`, \`PROCESS:\`, \`DECISION:\`, \`OUTPUT:\`
- Titel und Beschreibung MÜSSEN getrennt sein durch \` | \` (Leerzeichen-Pipe-Leerzeichen)
- Decision-Branches: EXAKT 2 Leerzeichen, dann \`YES ->\` oder \`NO ->\`
- Branch-Ziel ist der exakte Titel eines anderen Nodes (Groß-/Kleinschreibung wichtig!)
- Jeden Decision-Node MÜSSEN beide Branches haben (YES UND NO)

**Wie Verbindungen funktionieren:**
- \`YES -> Dashboard\` bedeutet: Finde Node mit Titel "Dashboard" und verbinde
- Wenn kein Node "Dashboard" existiert → Parser-Fehler, Verbindung bricht
- Titel müssen exakt matchen: "Dashboard" ≠ "dashboard" ≠ "Dashboard Ansicht"

---

**BEISPIEL - Vorher/Nachher:**

**Vorher:**
\`\`\`
INPUT: login | user + password
DECISION: validation
  YES -> success
  NO -> error
OUTPUT: success
OUTPUT: error
\`\`\`

**Nachher:**
\`\`\`
INPUT: login | user + password
DECISION: Benutzer existiert? | Prüfe DB
  YES -> Passwort korrekt?
  NO -> Benutzer nicht gefunden
DECISION: Passwort korrekt? | Hash-Vergleich
  YES -> Dashboard
  NO -> Passwort falsch
OUTPUT: Dashboard | Erfolgreich eingeloggt
OUTPUT: Benutzer nicht gefunden | Error 404
OUTPUT: Passwort falsch | Error 401
\`\`\`

---

**OUTPUT:**
Gib den vollständig überarbeiteten Flow aus. NUR das Format, keine Erklärung.`;

    console.log("🤖 Sending to AI...");

    // Use Next.js API route to avoid CORS issues with Ollama Cloud
    const response = await fetch('/api/ollama', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            endpoint,
            model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            options: {
                temperature: 0.2,
                top_p: 0.9,
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI request failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    // Ollama package returns response directly with 'message' property
    const aiResponse = data.message?.content || "";

    console.log("✅ AI Response:\n", aiResponse);

    // Extract flow from code blocks if present
    const codeBlockMatch = aiResponse.match(/```(?:text|plaintext)?\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    // Otherwise return as-is
    return aiResponse.trim();
}
