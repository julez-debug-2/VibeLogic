# Phase 3 Setup: Vollständiges Cloud-Setup mit Auth & Sharing

## 1. Dependencies installieren

```bash
npm install
```

## 2. Vercel Postgres einrichten

1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Wähle dein Projekt
3. **Storage** → **Create New**
4. Unter **Marketplace Database Providers** wähle **Neon** (Serverless Postgres)
5. Klicke **Continue** und folge dem Setup-Wizard
6. Die Connection-Strings werden automatisch als Environment Variables gesetzt (POSTGRES_URL etc.)

## 3. Database Schema erstellen

1. Im Vercel Dashboard: **Storage** → Deine Postgres-DB → **SQL Editor**
2. Kopiere den Inhalt von [`schema.sql`](./schema.sql)
3. Füge ein und klicke **Execute**

## 4. OAuth Apps erstellen

### GitHub OAuth App

1. Gehe zu [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. **New OAuth App**
   - **Application name:** VibeLogic
   - **Homepage URL:** `https://your-app.vercel.app`
   - **Authorization callback URL:** `https://your-app.vercel.app/api/auth/callback/github`
3. Kopiere **Client ID** und **Client Secret**

### Google OAuth App

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle neues Projekt: **VibeLogic**
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - **Application type:** Web application
   - **Authorized redirect URIs:** `https://your-app.vercel.app/api/auth/callback/google`
4. Kopiere **Client ID** und **Client Secret**

## 5. Environment Variables in Vercel setzen

Gehe zu **Settings → Environment Variables** und füge hinzu:

```bash
# Next-Auth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# Ollama (bereits vorhanden)
OLLAMA_API_KEY=a79f8d3316104b08b527f4ca3709f81e.utuduK5qNmxO3rc0_BwEbIJw
NEXT_PUBLIC_OLLAMA_ENDPOINT=https://ollama.com
NEXT_PUBLIC_OLLAMA_MODEL=gpt-oss:120b-cloud
```

## 6. Lokale Entwicklung (.env.local)

Erstelle `.env.local`:

```bash
# Next-Auth (lokal)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key-min-32-chars

# OAuth (gleiche Credentials, aber localhost callback URLs in OAuth Apps hinzufügen!)
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# Vercel Postgres Connection (aus Vercel Dashboard kopieren)
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NO_SSL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
POSTGRES_USER=default
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=verceldb

# Ollama
OLLAMA_API_KEY=a79f8d3316104b08b527f4ca3709f81e.utuduK5qNmxO3rc0_BwEbIJw
NEXT_PUBLIC_OLLAMA_ENDPOINT=https://ollama.com
NEXT_PUBLIC_OLLAMA_MODEL=gpt-oss:120b-cloud
```

## 7. OAuth Callback URLs für localhost

**Für lokale Entwicklung** musst du in deinen OAuth Apps zusätzlich hinzufügen:

**GitHub:**
- `http://localhost:3000/api/auth/callback/github`

**Google:**
- `http://localhost:3000/api/auth/callback/google`

## 8. Deploy und testen

```bash
git add .
git commit -m "Add Phase 3: Auth, Database, Flow Sharing"
git push
```

Vercel deployt automatisch!

## Neue Features nach Setup:

✅ **Login:** GitHub oder Google Account  
✅ **Auto-Save:** Flows werden alle 2s in Cloud gespeichert  
✅ **Flow-Liste:** "Meine Flows" Sidebar zeigt alle gespeicherten Flows  
✅ **Sharing:** "Teilen"-Button generiert öffentlichen Link  
✅ **Multi-Device:** Zugriff von überall mit gleichem Account  

## Troubleshooting

### "Invalid callback URL"
→ Prüfe ob Callback-URLs in GitHub/Google OAuth Apps korrekt sind

### "NEXTAUTH_SECRET not set"
→ Generiere mit: `openssl rand -base64 32`

### "Database connection failed"
→ Vercel Postgres Connection-Strings in ENV-Variables kopieren

### Lokaler Dev-Server startet nicht
→ Stelle sicher dass `.env.local` alle Postgres-Variablen hat
