# Product Requirements Document (PRD)

## GBA Research Hub

**Author:** GBA Design Team
**Date:** March 2026
**Status:** Live (MVP)

---

## 1. Overview

GBA Research Hub is an internal web application that serves as the centralized repository for all UX research studies conducted across the Global Banking & Account (GBA) organization. It enables researchers from Brazil, Mexico, USA, and Colombia to publish, browse, and analyze research findings in one shared space.

The tool integrates AI capabilities (Google Gemini) to automate research cataloging from PDF documents and to generate cross-country comparative insights — reducing manual effort and enabling data-driven decisions across geographies.

---

## 2. Problem Statement

The GBA team conducts UX research across multiple countries, squads, and methodologies. Currently:

- **Research is scattered** across Google Slides, Docs, local files, and Slack threads — making it hard to find past studies
- **No cross-country visibility** — a researcher in Mexico has no easy way to see what Brazil already learned about the same topic
- **Duplication of effort** — teams in different countries sometimes research the same questions without knowing
- **No structured catalog** — there is no single place to search, filter, and browse all research by country, squad, methodology, or topic
- **Manual documentation is slow** — filling out research metadata (tags, key learnings, descriptions) takes time away from actual research

---

## 3. Solution

A lightweight, fast web application that:

1. **Centralizes all research** in a searchable, filterable repository
2. **AI auto-fill** reads uploaded PDFs or linked Google Slides/Docs and automatically extracts title, description, tags, key learnings, and methodology
3. **Cross-geo AI insights** compares research findings across countries, identifies patterns, and generates strategic recommendations
4. **Research agenda tracking** shows planned research from the 2026 agenda with the ability to add, dismiss, or start new projects from suggestions
5. **Collaboration features** like a post-publish Slack message template for sharing with the team

---

## 4. Target Users

| Role | Use Case |
|---|---|
| **UX Researchers** (primary) | Publish research, browse past studies, use AI auto-fill from PDFs, get cross-geo insights |
| **Design Managers** | Track research agenda progress, identify gaps across countries, review cross-geo patterns |
| **Product Managers / Engineers** | Search for relevant research before starting new features, understand user pain points by country |
| **Leadership** | High-level view of research coverage across GBA, strategic insight reports |

---

## 5. Features

### 5.1 Home — Research Repository

- **Search** by title, tags, team, country, methodology, key learnings, squad, or researcher
- **Filter by country** (Brazil, Mexico, USA, Colombia, Global) via pill buttons
- **Filter by squad** (Money In, MB & Account XP, Payments Assistant, Troy, TOUT, Cross GBA, Payments & Core Infra, External, Other)
- **Filter by tag** — clickable tags on cards
- **Recently added** section showing the latest 3 studies as compact cards
- **All Research** grid sorted by date (newest first), each card showing: cover image, country flag, squad badge, external indicator, title, date, researcher, description preview, and tags
- **Research Suggestions** section with the 2026 planned agenda, filterable by squad, with ability to add custom suggestions or dismiss existing ones

### 5.2 Submit Research

- Full form: title, description, date, country, squad, researcher, methodology, team members, tags, key learnings, presentation link, PDF upload, screenshots
- **AI Auto-Fill** from two sources:
  - **Upload PDF** — extracts text from the document and uses Gemini to fill all fields
  - **Paste document link** — reads Google Slides/Docs (via OAuth sign-in with corporate Google account) and fills fields from the content
  - The AI **only extracts** from the provided document; it never invents information
- **Success modal** with a formatted Slack message ready to copy and share

### 5.3 Research Detail Page

- Full view of all research metadata, key learnings, screenshots, and links
- Edit and delete capabilities

### 5.4 Cross-geo Insights (AI)

- **Country Summary mode** — select a country and get AI-generated analysis of all its research: key themes, patterns & trends, strategic recommendations
- **Compare Countries mode** — select 2+ countries, optionally focus on a topic, and get: overview, comparative table, unique insights per country, cross-country patterns, and recommendations
- Visual indicators showing study count per country and data availability
- Results rendered as styled markdown with themed cards per section

### 5.5 Settings

- Customize squads, countries, researchers, and methodologies (shared across all users via Firestore)
- Configure **Gemini API Key** for AI features
- Configure **Google OAuth Client ID** for reading corporate Google Docs/Slides
- All settings are persisted globally — saved once, visible to everyone

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router 6 (hash-based) |
| Database | Firebase Cloud Firestore (real-time sync) |
| AI | Google Gemini 2.5 Flash (via OpenAI-compatible API) |
| PDF parsing | pdfjs-dist (client-side) |
| Google integration | Google Identity Services (OAuth 2.0) + Docs/Slides/Drive APIs |
| Hosting | GitHub Pages (static site, deployed via GitHub Actions) |
| CI/CD | GitHub Actions — auto-deploy on push to `main` |

### 6.2 Data Model (Firestore)

**Collection: `researches`**
```
{
  id: string (auto-generated)
  title: string
  description: string
  date: string (YYYY-MM-DD)
  country: 'brasil' | 'mexico' | 'usa' | 'colombia' | 'global'
  squad?: string
  researcher?: string
  methodology: string
  team: string[]
  tags: string[]
  keyLearnings: string[]
  presentationUrl?: string
  pptScreenshots?: string[] (base64)
  usefulLinks?: { name: string, url: string }[]
  createdAt: string (ISO 8601)
}
```

**Collection: `settings` → Document: `global`**
```
{
  squads: string[]
  countries: { name: string, flag: string }[]
  researchers: string[]
  methodologies: string[]
  geminiApiKey?: string
  googleClientId?: string
}
```

**Collection: `suggestions_custom`** — user-added research suggestions

**Collection: `suggestions_deleted`** — dismissed suggestion IDs

### 6.3 Architecture Diagram

```
┌──────────────────────────────────────────────┐
│           GitHub Enterprise (repo)           │
│  Push to main → GitHub Actions → Build       │
│  Inject env vars → Deploy to GitHub Pages    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│         GitHub Pages (static hosting)        │
│         React SPA served to browser          │
└──────────┬──────────────┬────────────────────┘
           │              │
           ▼              ▼
┌──────────────┐  ┌───────────────────────────┐
│   Firebase   │  │     Google Cloud APIs      │
│  Firestore   │  │  ┌─────────────────────┐  │
│  (database)  │  │  │ Gemini 2.5 Flash    │  │
│              │  │  │ (AI analysis)       │  │
│  - researches│  │  ├─────────────────────┤  │
│  - settings  │  │  │ Google Docs API     │  │
│  - suggest.  │  │  │ Google Slides API   │  │
│              │  │  │ (document reading)  │  │
└──────────────┘  │  └─────────────────────┘  │
                  └───────────────────────────┘
```

---

## 7. Infrastructure Requirements

### 7.1 Firebase / Firestore (Critical)

**Purpose:** Persistent, real-time database shared across all users.

| Requirement | Detail |
|---|---|
| GCP Project | Create or reuse an existing project in Nubank's Google Cloud |
| Firestore | Enable Cloud Firestore in production mode |
| Web App | Register a Firebase Web App to get configuration credentials |
| Security Rules | Restrict access to authenticated `@nubank.com.br` users |
| Env variables | 6 variables injected at build time via GitHub Secrets |

**Variables needed:**

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | GCP project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

### 7.2 Gemini API (Critical)

**Purpose:** Powers AI auto-fill from documents and cross-geo comparative insights.

| Requirement | Detail |
|---|---|
| API Key | Generate from Nubank's GCP project with Generative Language API enabled |
| Model | `gemini-2.5-flash` via OpenAI-compatible endpoint |
| Rate limits | Enterprise tier eliminates the 15 req/min free-tier limit |
| Configuration | Entered once in Settings page, stored in Firestore, shared for all users |

### 7.3 Google OAuth + Workspace APIs (Important)

**Purpose:** Allows researchers to authenticate with their `@nubank.com.br` account and read content from corporate Google Slides and Docs for AI auto-fill.

| Requirement | Detail |
|---|---|
| OAuth 2.0 Client ID | Web Application type, Authorized JS origins = site URL |
| OAuth Consent Screen | Internal (Nubank org only, no Google review needed) |
| APIs to enable | Google Docs API, Google Slides API, Google Drive API |
| Scope | `drive.readonly` |
| Configuration | Client ID entered in Settings, stored in Firestore |

### 7.4 GitHub Enterprise (Critical)

**Purpose:** Source code management, CI/CD, and static site hosting.

| Requirement | Detail |
|---|---|
| Repository | Internal visibility within Nubank org |
| GitHub Pages | Enabled, source = GitHub Actions |
| Secrets | 6 Firebase env vars added to repo Settings → Secrets → Actions |
| CI/CD | Already configured in `.github/workflows/deploy.yml` — auto-deploys on push to `main` |
| Custom domain | Optional — configure CNAME + GitHub Pages custom domain setting |

### 7.5 Deploy workflow update

The existing `deploy.yml` needs the Firebase secrets injected into the build step:

```yaml
- run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

---

## 8. Security Considerations

| Area | Measure |
|---|---|
| **Data access** | Firestore rules should require Firebase Auth with `@nubank.com.br` domain |
| **API keys** | Stored in Firestore (not in source code), accessible only to authenticated users |
| **OAuth** | Internal consent screen = only Nubank employees can authorize |
| **Hosting** | GitHub Pages serves static files only — no server-side code, no backend vulnerabilities |
| **Source code** | Repository with internal visibility — only Nubank org members can access |
| **No sensitive data in code** | All credentials are injected via environment variables at build time |

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Research entries published | > 50 within first quarter |
| Monthly active users | > 80% of GBA researchers using the tool regularly |
| AI auto-fill adoption | > 60% of new research submissions use PDF/link auto-fill |
| Cross-geo insights usage | At least 2 comparative analyses per month |
| Time to publish research | < 10 minutes (vs. 30+ minutes manual documentation) |
| Cross-country research discovery | Researchers report finding relevant past studies from other countries |

---

## 10. Rollout Plan

| Phase | Scope | Timeline |
|---|---|---|
| **Phase 1 — MVP** | Current state: repo, search, filters, AI auto-fill, cross-geo insights, Slack sharing | **Done** |
| **Phase 2 — Infrastructure** | Firebase setup, Gemini Enterprise key, GitHub Enterprise migration, OAuth setup | **1-2 weeks** (depends on infra team) |
| **Phase 3 — Launch** | Announce to GBA team, onboarding session, seed initial research backlog | **1 week after Phase 2** |
| **Phase 4 — Iteration** | User feedback, Firebase Auth integration, export features, Slack bot integration | **Ongoing** |

---

## 11. Future Opportunities

- **Firebase Authentication** — require login with Nubank Google account for write operations
- **Slack bot** — auto-post to a channel when new research is published
- **Export to PDF** — generate formatted research reports
- **Research impact tracking** — views, bookmarks, and citations
- **Automated digest** — weekly AI-generated summary of new research sent via email or Slack
- **Integration with Figma** — link research to design files
- **Multi-language support** — UI in English and Portuguese/Spanish
