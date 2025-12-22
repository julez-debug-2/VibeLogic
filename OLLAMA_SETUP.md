# Ollama Setup für VibeLogic

## Installation

### Windows
1. Download: https://ollama.com/download/windows
2. Installiere `OllamaSetup.exe`
3. Ollama startet automatisch als Service

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Model herunterladen

```bash
# Empfohlen: Llama 3.2 (klein, schnell)
ollama pull llama3.2

# Alternativen:
ollama pull mistral        # Bessere Code-Analyse
ollama pull codellama      # Spezialisiert auf Code
ollama pull llama3.1:8b    # Größeres Modell, bessere Qualität
```

## Server starten

```bash
ollama serve
```

Server läuft auf: **http://localhost:11434**

## Testen

```bash
# Terminal
ollama run llama3.2 "Hallo"

# API-Test
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [{"role": "user", "content": "Test"}],
  "stream": false
}'
```

## In VibeLogic nutzen

1. **Ollama starten:** `ollama serve`
2. **Model laden:** `ollama pull llama3.2`
3. **VibeLogic öffnen:** http://localhost:3000
4. **Einstellungen prüfen:**
   - Endpoint: `http://localhost:11434`
   - Model: `llama3.2`
5. **Prompt generieren** → **✨ Prompt analysieren** klicken

## Troubleshooting

### "Failed to connect to Ollama"
```bash
# Prüfe ob Server läuft
curl http://localhost:11434/api/version

# Wenn nicht, starte neu
ollama serve
```

### Model nicht gefunden
```bash
# Liste verfügbare Models
ollama list

# Lade fehlendes Model
ollama pull llama3.2
```

### Langsame Analyse
- Nutze kleineres Model: `llama3.2` statt `llama3.1:70b`
- GPU-Support aktivieren (falls verfügbar)
- Mehr RAM zuweisen (Ollama nutzt System-RAM)

## Model-Empfehlungen

| Model | Größe | Geschwindigkeit | Qualität | Use Case |
|-------|-------|----------------|----------|----------|
| **llama3.2** | 2GB | ⚡⚡⚡ Sehr schnell | ⭐⭐⭐ Gut | Dev (empfohlen) |
| mistral | 4GB | ⚡⚡ Schnell | ⭐⭐⭐⭐ Sehr gut | Production |
| llama3.1:8b | 5GB | ⚡ Mittel | ⭐⭐⭐⭐⭐ Exzellent | Beste Qualität |
| codellama | 4GB | ⚡⚡ Schnell | ⭐⭐⭐⭐ Code-fokussiert | Code-Analyse |
