# Logic2Vibe - AI Agent Instructions

## Project Vision

Logic2Vibe hilft Entwicklern, aus **Logik statt losem Text** hochwertige Prompts für "Vibe Coding" zu generieren. Die Anwendung erfasst Ideen visuell oder textuell, strukturiert sie in eine logische Repräsentation und erzeugt daraus klare, reproduzierbare Prompts für LLM-Coding-Tools.

**Zentrale Philosophie:** Logik statt Syntax • Klarheit statt Chaos • Iteration mit Feedback

## Project Overview

Logic2Vibe ist eine Next.js-Anwendung, die visuelle Logik-Flows in strukturierte LLM-Prompts transformiert. Nutzer erstellen Flussdiagramme mit ReactFlow, die dann in präzise Programmieranweisungen übersetzt werden.

**Kernarchitektur:** Visual Editor → Logic Graph → Prompt Generation

### Erfassungsmodi (MVP: Visuell)

1. **Visuell** (✅ implementiert): Flowchart mit ReactFlow (Start, Process, Decision, Output Nodes)
2. **Text** (🔜 geplant): Natürliche Sprache oder Pseudocode
3. **Import** (🔜 geplant): Mermaid, JSON

## Architecture & Data Flow

### Layered Architecture (Strict Separation)

1. **`core/`** - Reine TypeScript-Logik (kein React, kein JSX)
   - `core/logic/types.ts` - Zentrale Datenstrukturen (`LogicGraph`, `LogicNode`, `LogicEdge`)
   - `core/prompt/generator.ts` - Deterministische Prompt-Generierung
   - `core/prompt/presets.ts` - Target-spezifische Templates (code, architecture, tests, refactor)

2. **`lib/`** - Brücke zwischen UI und Core
   - `lib/logic/LogicGraph.ts` - Vereinfachte Typen für UI-Transformationen
   - `lib/logic/flowToLogicGraph.ts` - ReactFlow → LogicGraph Konverter
   - `lib/prompt/generatePrompt.ts` - Wrapper für core/prompt mit UI-spezifischen Optionen

3. **`components/`** - React-Komponenten (nur UI)
   - `FlowEditor/FlowCanvas.tsx` - Haupteditor mit ReactFlow
   - `FlowEditor/BlockPalette.tsx` - Drag-and-drop Block-Typen
   - `FlowEditor/nodes/LogicBlockNode.tsx` - Custom Node-Renderer

4. **`app/`** - Next.js App Router (Seiten & Layout)

### Kritische Datenfluss-Pipeline

```
ReactFlow Nodes/Edges 
  → flowToLogicGraph() 
  → LogicGraph { nodes, edges }
  → generatePrompt(graph, options)
  → String (LLM-ready prompt)
```

## Design Principles

1. **Die App codiert nicht selbst** - sie generiert bessere Prompts für andere LLMs
2. **Jeder Schritt ist nachvollziehbar** - keine Black-Box-Magie
3. **UI ist klar und ruhig** - keine verspielten Elemente, Fokus auf Funktionalität
4. **Datenmodell zuerst** - strikte Trennung: Logikdaten ≠ UI ≠ Prompt-Generierung
5. **Erweiterbarkeit** - Prompt-Historie, Vibe-Tuning, alternative Zieltypen

## Development Conventions

### TypeScript Patterns

- **Strikte Typen-Trennung:** `core/logic/types.ts` hat vollständige Definitionen mit `InputNode`, `DecisionNode` etc. `lib/logic/LogicGraph.ts` nutzt vereinfachte Varianten für UI-Mapping
- **Type Guards:** Nutze `(n): n is DecisionNode` für Node-Filterung in Prompt-Generierung
- **No React in Core:** `core/` Dateien dürfen niemals React oder JSX importieren

### ReactFlow Integration

- **Single Node Type:** Alle Logic-Blöcke nutzen `logicBlock` als einzigen Node-Typ mit unterschiedlichen `data.role` Properties (`input`, `process`, `decision`, `output`)
- **Node Data Schema:**
  ```typescript
  {
    role: "input" | "process" | "decision" | "output",
    title: string,
    description?: string,
    condition?: string  // nur für decisions
  }
  ```
- **IDs:** Generiere mit `nanoid()` (bereits importiert in FlowCanvas)
- **Handles:** Nodes haben immer `Top` (target) und `Bottom` (source) Handles

### Naming & File Organization

- **Deutsch in UI:** Nutzer-sichtbare Texte sind deutsch (z.B. "Skizziere deine Logik visuell")
- **Englisch im Code:** Alle Variablen, Funktionen, Kommentare sind englisch
- **Dateinamen:** PascalCase für Components (`FlowCanvas.tsx`), camelCase für Utils (`flowToLogicGraph.ts`)

## Development Workflow

### Build & Run

```bash
npm run dev        # Start development server on http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint check
```

### Key Entry Points

- **Main Editor:** [app/page.tsx](../app/page.tsx) rendert `<FlowCanvas />`
- **Export Logic:** Button in FlowCanvas ruft `flowToLogicGraph(nodes, edges)` → console.log
- **Generate Prompt:** Button ruft `generatePrompt(graph, { target: "code" })` → zeigt in PromptPreview

### Testing Logic Changes

1. Ändere `core/logic/types.ts` für neue Node-Typen
2. Update `lib/logic/flowToLogicGraph.ts` für für **Vibe-Iteration**:
- **high:** "Follow strictly. Do not add features" → präzise Umsetzung
- **medium:** "Minor improvements allowed if justified" → pragmatischer Flow
- **low:** "Use as guidance. Reasonable design decisions allowed" → kreative Freiheit

Nutze diese für unterschiedliche User-Szenarien (z.B. high für Anfänger, low für erfahrene Devs)

### Prompt-Zieltypen

Implementiert in `core/prompt/presets.ts`:
- **code:** Production-ready Code-Generierung
- **architecture:** System-Design und Komponenten-Architektur
- **refactor:** Bestehenden Code an Logik anpassen
- **tests:** Testfälle aus Logik-Flows ableiten
### Prompt Generation Strictness

`generatePrompt()` hat drei Strictness-Levels:
- **high:** "Follow strictly. Do not add features"
- **medium:** "Minor improvements allowed if justified"
- **low:** "Use as guidance. Reasonable design decisions allowed"

Nutze diese für unterschiedliche User-Szenarien (z.B. high für Anfänger, low für erfahrene Devs)

### Decision Node Branching

Decision Nodes haben explizite yes/no branches:
```typescript
{
  type: "decision",
  condition: "user is authenticated",
  branches: { yes: "node-abc", no: "node-xyz" }
}
```

ReactFlow Edges nutzen `sourceHandle` für Branch-Markierung → wird in `flowToLogicGraph()` zu `edge.branch`

### Path Alias
 (Kernprinzip der Architektur)
- **Node Type Consistency**: Alle Logic-Blöcke müssen `type: "logicBlock"` haben, unterscheide via `data.role`
- **Edge Mapping**: ReactFlow nutzt `source`/`target`, LogicGraph nutzt `from`/`to` - siehe `flowToLogicGraph()`
- **Prompt Formatting**: Nutze `lines.push()` Pattern in generator.ts für konsistente Formatierung
- **Nicht selbst coden**: Die App generiert Prompts, implementiert aber keine Logik für den User

## Future Extensions (nicht MVP)

- **Vibe-Feedback Loops:** "Was fühlt sich falsch an?" → Prompt-Refinement
- **Prompt-Historie:** Versioning und Vergleich verschiedener Prompt-Varianten
- **Mermaid Import:** Textuelle Flowchart-Definition als Input
- **Lern-Features:** Aus guten/schlechten Prompts lernen (Tuning-Parameter in `core/vibe/`)
```

## Common Pitfalls

- **Keine React-Imports in core/**: Würde die strikte Trennung brechen
- **Node Type Consistency**: Alle Logic-Blöcke müssen `type: "logicBlock"` haben, unterscheide via `data.role`
- **Edge Mapping**: ReactFlow nutzt `source`/`target`, LogicGraph nutzt `from`/`to` - siehe `flowToLogicGraph()`
- **Prompt Formatting**: Nutze `lines.push()` Pattern in generator.ts für konsistente Formatierung

## External Dependencies

- **ReactFlow 11.11.4:** Vollständige Flow-Editor-Logik (Nodes, Edges, Controls, MiniMap)
- **nanoid:** ID-Generierung für Nodes
- **Tailwind CSS 4:** Utility-first Styling (keine custom CSS files nötig)
- **Next.js 16.1:** App Router mit Server Components (aber FlowCanvas ist "use client")
