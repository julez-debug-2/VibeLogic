# Formale Strukturregeln für Logic-Flows

Diese Regeln definieren, was einen **gültigen und qualitativ hochwertigen** Logic-Flow ausmacht.

## Verwendung

- **Phase 1 (✅ implementiert):** KI bewertet anhand dieser Regeln (siehe `lib/prompt/analyzePrompt.ts` Step 1)
- **Phase 2 (🔜 geplant):** Algorithmische Validierung in `core/logic/analyzer.ts`

---

## 1. Strukturregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 1.1  | Es existiert genau ein Startzustand                                  | HOCH      | TODO   |
| 1.2  | Jeder logische Pfad beginnt beim Startzustand                        | HOCH      | TODO   |
| 1.3  | Jeder logische Pfad endet in einem definierten Endzustand            | HOCH      | TODO   |
| 1.4  | Endzustände besitzen keine ausgehenden Übergänge                      | MITTEL    | TODO   |
| 1.5  | Jeder Knoten ist über mindestens einen Pfad vom Startzustand erreichbar | HOCH   | TODO   |
| 1.6  | Jeder Knoten besitzt mindestens einen ausgehenden Übergang, außer Endzustände | MITTEL | ✅ |
| 1.7  | Es existieren keine unbeabsichtigten Endlosschleifen                  | HOCH      | TODO   |
| 1.8  | Schleifen sind nur erlaubt, wenn eine explizite Abbruchbedingung existiert | HOCH | TODO   |
| 1.9  | Es existieren keine isolierten oder toten Knoten                      | MITTEL    | ✅     |
| 1.10 | Jeder Übergang ist eindeutig gerichtet                                | MITTEL    | ✅     |

## 2. Entscheidungsregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 2.1  | Jede Entscheidung basiert auf genau einer prüfbaren Bedingung        | HOCH      | ✅     |
| 2.2  | Jede Entscheidung besitzt mindestens zwei eindeutig unterscheidbare Ausgänge | HOCH | ✅ |
| 2.3  | Entscheidungsbedingungen sind eindeutig, nicht vage und nicht subjektiv | HOCH  | KI     |
| 2.4  | Entscheidungsbedingungen sind logisch prüfbar                         | HOCH      | KI     |
| 2.5  | Entscheidungsbedingungen überschneiden sich nicht                     | MITTEL    | TODO   |
| 2.6  | Jeder mögliche Entscheidungsfall ist abgedeckt                        | HOCH      | ✅     |
| 2.7  | Entscheidungen verändern selbst keinen Zustand, sondern leiten weiter | MITTEL   | KI     |
| 2.8  | Mehrfachentscheidungen sind in atomare Entscheidungen aufzulösen      | MITTEL    | KI     |

## 3. Reihenfolge- und Ablaufregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 3.1  | Validierungen erfolgen vor jeglicher Verarbeitung                     | HOCH      | KI     |
| 3.2  | Existenzprüfungen erfolgen vor Inhaltsprüfungen                       | HOCH      | KI     |
| 3.3  | Zustandsprüfungen erfolgen vor zustandsverändernden Aktionen          | MITTEL    | KI     |
| 3.4  | Kritische Prüfungen erfolgen frühestmöglich                           | MITTEL    | KI     |
| 3.5  | Abbruchbedingungen werden vor kostenintensiven Aktionen geprüft       | MITTEL    | KI     |
| 3.6  | Logische Abhängigkeiten bestimmen die Reihenfolge                     | NIEDRIG   | KI     |
| 3.7  | Kein Schritt darf ausgeführt werden, wenn seine Vorbedingungen nicht erfüllt sind | MITTEL | KI |
| 3.8  | Jeder Schritt hat einen klaren Zweck im Ablauf                        | NIEDRIG   | KI     |

## 4. Zustandsregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 4.1  | Jeder Zustand ist eindeutig definiert                                 | MITTEL    | KI     |
| 4.2  | Zustände sind voneinander unterscheidbar                              | MITTEL    | KI     |
| 4.3  | Zustandswechsel sind explizit und nachvollziehbar                     | MITTEL    | KI     |
| 4.4  | Kein Zustand wird übersprungen, wenn er logisch notwendig ist         | MITTEL    | KI     |
| 4.5  | Zustandswechsel erfolgen nur über definierte Übergänge                | MITTEL    | ✅     |
| 4.6  | Aktionen müssen einen Zustand verändern oder vorbereiten              | NIEDRIG   | KI     |
| 4.7  | Zustände dürfen nicht widersprüchlich sein                            | MITTEL    | KI     |
| 4.8  | Ein Zustand kann nicht gleichzeitig mehrere widersprüchliche Werte annehmen | MITTEL | KI |

## 5. Fehler- und Abbruchregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 5.1  | Fehlerpfade sind explizit modelliert                                  | HOCH      | KI     |
| 5.2  | Jeder Fehlerpfad führt zu einem definierten Endzustand                | HOCH      | KI     |
| 5.3  | Fehler verändern den Systemzustand eindeutig                          | MITTEL    | KI     |
| 5.4  | Fehler werden nicht stillschweigend ignoriert                         | HOCH      | KI     |
| 5.5  | Fehlerbedingungen sind prüfbar und eindeutig                          | MITTEL    | KI     |
| 5.6  | Fehlerpfade vermischen sich nicht mit Erfolgspfaden                   | MITTEL    | KI     |
| 5.7  | Abbrüche erfolgen kontrolliert und nachvollziehbar                    | MITTEL    | KI     |

## 6. Konsistenz- und Redundanzregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 6.1  | Gleiche Bedingungen werden nicht mehrfach geprüft                     | MITTEL    | KI     |
| 6.2  | Gleiche Aktionen werden nicht mehrfach ohne Zustandsänderung ausgeführt | MITTEL  | KI     |
| 6.3  | Redundante Knoten sind zu entfernen oder zusammenzuführen             | NIEDRIG   | KI     |
| 6.4  | Wiederholungen sind nur bei klarer Schleifenlogik erlaubt             | MITTEL    | TODO   |
| 6.5  | Logik darf nicht unnötig verkompliziert werden                        | NIEDRIG   | KI     |
| 6.6  | Jeder Knoten trägt zur Zielerreichung bei                             | NIEDRIG   | KI     |

## 7. Klarheits- und Interpretationsregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 7.1  | Jeder Knoten hat eine eindeutige Funktion                             | MITTEL    | KI     |
| 7.2  | Logik ist unabhängig vom Fachkontext interpretierbar                  | NIEDRIG   | KI     |
| 7.3  | Namen und Bedingungen beschreiben Funktion, nicht Absicht             | MITTEL    | KI     |
| 7.4  | Implizite Annahmen sind unzulässig                                    | MITTEL    | KI     |
| 7.5  | Jeder Ablauf ist logisch nachvollziehbar rekonstruierbar              | MITTEL    | KI     |

## 8. Änderungs- und Korrekturregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 8.1  | Korrekturen erfolgen minimalinvasiv                                   | NIEDRIG   | -      |
| 8.2  | Bestehende Struktur wird bevorzugt erhalten                           | NIEDRIG   | -      |
| 8.3  | Reihenfolgeänderungen haben Vorrang vor neuen Knoten                  | NIEDRIG   | -      |
| 8.4  | Neue Knoten werden nur eingeführt, wenn logisch zwingend erforderlich | NIEDRIG   | -      |
| 8.5  | Keine fachlichen Regeln werden ergänzt oder verändert                 | NIEDRIG   | -      |
| 8.6  | Jede Korrektur ist logisch begründbar                                 | NIEDRIG   | -      |

## 9. Bewertungsregeln

| ID   | Regel                                                                 | Priorität | Status |
|------|-----------------------------------------------------------------------|-----------|--------|
| 9.1  | Logik wird unabhängig vom Thema bewertet                              | -         | KI     |
| 9.2  | Bewertung basiert ausschließlich auf struktureller Qualität          | -         | KI     |
| 9.3  | Jeder erkannte Regelverstoß wird dokumentiert                         | -         | KI     |
| 9.4  | Schwere Regelverstöße haben höheren Einfluss als stilistische Mängel | -         | KI     |
| 9.5  | Bewertung ist reproduzierbar und konsistent                           | -         | KI     |

## 10. Grundprinzipien

| ID    | Regel                                                                 | Priorität | Status |
|-------|-----------------------------------------------------------------------|-----------|--------|
| 10.1  | Logik ist deterministisch                                             | HOCH      | KI     |
| 10.2  | Jeder Zustand, jede Entscheidung und jede Aktion ist erklärbar        | MITTEL    | KI     |
| 10.3  | Kein Schritt existiert ohne Zweck                                     | NIEDRIG   | KI     |
| 10.4  | Kein Zweck existiert ohne Schritt                                     | NIEDRIG   | KI     |
| 10.5  | Einfachere Logik ist bei gleicher Funktion zu bevorzugen              | NIEDRIG   | KI     |

---

## Status-Legende

- **✅** = Algorithmisch implementiert in `analyzer.ts`
- **KI** = Wird von KI in `analyzePrompt.ts` geprüft
- **TODO** = Geplant für algorithmische Implementierung
- **-** = Meta-Regel, nicht direkt prüfbar

## Priorität

- **HOCH**: Kritisch für Funktionalität, muss algorithmisch geprüft werden
- **MITTEL**: Wichtig für Qualität, KI-Bewertung ausreichend
- **NIEDRIG**: Best Practice, KI-Hinweise genügen

## Implementierungs-Roadmap

**Phase 1 (✅ Fertig):**
- KI-basierte Bewertung mit Top 15 Regeln
- Suggestions basierend auf Regel-Verstößen

**Phase 2 (Algorithmus):**
1. Strukturregeln 1.1, 1.3, 1.7 (Start, Ende, Zyklen)
2. Erreichbarkeitsanalyse 1.5
3. Reihenfolge-Validierung 3.1, 3.2
4. Fehlerpfad-Validierung 5.1

**Phase 3 (Erweiterungen):**
- UI: Regelverstoß-Icons im Flow
- Automatische Fixes für einfache Verstöße
- Export: Regelkonformitäts-Report
