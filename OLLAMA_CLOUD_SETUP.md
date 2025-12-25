# Ollama Cloud Setup für VibeLogic

VibeLogic unterstützt **lokales Ollama** und **Ollama Cloud**. Mit Ollama Cloud musst du Ollama nicht lokal installieren.

---

## Option 1: Ollama Cloud (Empfohlen - Kein Setup nötig!)

### 1. API Key erhalten

1. Besuche [ollama.com](https://ollama.com)
2. Erstelle einen Account oder melde dich an
3. Gehe zu den API-Einstellungen und erstelle einen API Key

### 2. In VibeLogic konfigurieren

**Variante A: Über UI (Schnellste Methode)**

1. Starte die App: `npm run dev`
2. Öffne http://localhost:3000
3. Klicke auf das **Zahnrad-Symbol** (⚙️) in der rechten Sidebar
4. Trage ein:
   - **Endpoint:** `https://api.ollama.com`
   - **Model:** `llama3.2` (oder ein anderes verfügbares Modell)
   - **API Key:** Dein API Key von ollama.com
5. Fertig! Die App nutzt jetzt Ollama Cloud

**Variante B: Über Environment-Variablen (Persistent)**

1. Kopiere die Beispiel-Datei:
   ```bash
   cp .env.local.example .env.local
   ```

2. Bearbeite `.env.local`:
   ```bash
   NEXT_PUBLIC_OLLAMA_ENDPOINT=https://api.ollama.com
   NEXT_PUBLIC_OLLAMA_MODEL=llama3.2
   NEXT_PUBLIC_OLLAMA_API_KEY=dein-api-key-hier
   ```

3. Starte die App neu: `npm run dev`

---

## Option 2: Lokales Ollama (Für Offline-Nutzung)

### Installation

**Windows:**
1. Download: https://ollama.com/download/windows
2. Installiere `OllamaSetup.exe`
3. Ollama startet automatisch als Service

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Model herunterladen

```bash
# Empfohlen: Llama 3.2 (klein, schnell)
ollama pull llama3.2

# Alternativen:
ollama pull qwen2.5:32b   # Besser für Code (benötigt 20GB RAM)
ollama pull mistral       # Gute Balance
ollama pull codellama     # Spezialisiert auf Code
```

### Server starten

```bash
ollama serve
```

Server läuft auf: **http://localhost:11434**

### In VibeLogic nutzen

Die App ist standardmäßig für lokales Ollama konfiguriert:
- **Endpoint:** `http://localhost:11434`
- **Model:** `qwen2.5:32b`
- **API Key:** (leer lassen)

---

## Modell-Empfehlungen

| Modell | Größe | RAM | Geschwindigkeit | Code-Qualität |
|--------|-------|-----|-----------------|---------------|
| `llama3.2` | 2GB | 4GB | ⚡ Sehr schnell | ⭐⭐⭐ Gut |
| `qwen2.5:32b` | 18GB | 20GB | 🚀 Mittel | ⭐⭐⭐⭐⭐ Exzellent |
| `gemma2:9b` | 5GB | 8GB | ⚡ Schnell | ⭐⭐⭐⭐ Sehr gut |
| `mistral` | 4GB | 6GB | ⚡ Schnell | ⭐⭐⭐ Gut |

**Für Ollama Cloud:** Nutze kleinere Modelle wie `llama3.2` oder `gemma2:9b` (günstiger)  
**Für lokales Ollama:** Nutze `qwen2.5:32b` wenn genug RAM vorhanden (beste Qualität)

---

## Vergleich: Cloud vs. Lokal

| Feature | Ollama Cloud | Lokales Ollama |
|---------|--------------|----------------|
| Setup | ✅ Kein Setup | ❌ Installation nötig |
| Internet | ⚠️ Benötigt | ✅ Offline-fähig |
| Kosten | 💰 Pay-per-use | ✅ Kostenlos |
| Geschwindigkeit | 🌐 Netzwerk-abhängig | 🖥️ Lokal (schneller) |
| Datenschutz | ☁️ Daten verlassen System | ✅ Alles lokal |
| Große Modelle | ✅ Immer verfügbar | ⚠️ Benötigt viel RAM |

---

## Troubleshooting

### "Failed to connect to Ollama"

**Ollama Cloud:**
- Prüfe API Key (korrekt kopiert?)
- Endpoint korrekt: `https://api.ollama.com` (nicht `http://`)
- Internet-Verbindung vorhanden?

**Lokales Ollama:**
```bash
# Teste ob Server läuft
curl http://localhost:11434/api/version

# Falls nicht, starte manuell:
ollama serve
```

### "Model not found"

**Ollama Cloud:**
- Nutze verfügbare Modelle: `llama3.2`, `gemma2`, `mistral`

**Lokales Ollama:**
```bash
# Installiere das Modell
ollama pull llama3.2

# Liste installierte Modelle
ollama list
```

### "API Key invalid"

1. Gehe zu [ollama.com/api-keys](https://ollama.com)
2. Erstelle einen neuen API Key
3. Kopiere ihn vollständig (inkl. `sk-...` Präfix falls vorhanden)
4. Trage ihn in die App-Einstellungen ein

---

## Quick Start (für Eilige)

**Ollama Cloud in 2 Minuten:**
```bash
# 1. API Key holen: https://ollama.com
# 2. In App eintragen: ⚙️ → https://api.ollama.com + API Key
# 3. Fertig!
```

**Lokales Ollama:**
```bash
# Windows: OllamaSetup.exe installieren
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh

ollama pull llama3.2
ollama serve
# App öffnen → funktioniert automatisch
```
