# Part B — TAM Support Intelligence Dashboard

## Submission summary

**Tool built:** **TAM Support Intelligence** — a lightweight web dashboard for Technical Account Managers to monitor support health across dedicated enterprise accounts, spot operational risk early, and export QBR-ready summaries.

**Why it’s relevant to TAM work:** TAMs need a single view of portfolio health (SLA, CSAT, P1/P2 volume, reopenings, stale/aging tickets) without waiting on Zendesk admin access or manual spreadsheet work. This tool turns ticket-level data into account health scores, at-risk alerts, regional portfolio views, and exportable service-review reports.

**Repository:** [github.com/wickrasoft/sinch-tam-support-intelligence](https://github.com/wickrasoft/sinch-tam-support-intelligence)  
**Deployed:** Vercel (auto-deploy from `main`)

**Run locally:**
```bash
npm install
npm run dev          # http://localhost:5173
npm run generate-data   # optional — regenerate synthetic dataset
```

---

## What the tool does

### Core metrics (per account, TAM, and period)
| Metric | Use for TAMs |
|--------|----------------|
| **P1 / P2 volume** | Escalation and incident load per portfolio |
| **SLA breaches** | First-response and resolution compliance |
| **CSAT** | Satisfaction trend and low-score follow-up |
| **MTTA / MTTR** | Responsiveness and resolution speed |
| **Reopenings** | Quality / stability signal (day → year buckets) |
| **Account Health Score (0–100)** | Composite portfolio health at a glance |
| **At-risk accounts** | Accounts needing proactive TAM attention |

### Operational panels
- **Stale tickets** — open tickets with no recent update (24h / 48h / 72h thresholds)
- **Aging tickets** — unresolved tickets by age (7d / 14d / 30d+)
- **Tickets needing attention** — disposition-based alert queue
- **TAM portfolio overview** — per-TAM activity breakdown with drill-down

### Filters (global — apply everywhere)
- Period: Day / Week / Month / Quarter / Year
- Reference date, Region (US / EMEA / APAC / LATAM), TAM, Account, Priority, Status
- SLA breaches only

### Exports
- **CSV** — filtered ticket list
- **Markdown report** — QBR / service review summary
- **PDF report** — same content, formatted for sharing

### Other features
- Zendesk-style **ticket detail modal** (3-pane layout)
- **Regional distribution** chart with drill-down
- **Period-over-period** KPI deltas (▲/▼ vs prior period)
- **Color themes** (Dark / Light / Sinch branding)
- Synthetic dataset shaped like Zendesk exports (no live API required for demo)

### Dataset
- **15 TAMs**, **25 accounts**, **~6,250 tickets** (Jan 2024 → Jun 2026)
- Account-specific risk profiles (some accounts intentionally worse for demo storytelling)
- Regenerate: `npm run generate-data` (seed `42`)

---

## AI tools used

**ChatGPT**, **Claude**, and **Microsoft Copilot** — used for different stages of the work:

| Tool | How it was used |
|------|-----------------|
| **ChatGPT** | Initial scoping, architecture ideas, and rapid prototyping prompts |
| **Claude** | Longer code generation, refactoring, and iterating on React components and data logic |
| **Microsoft Copilot** | Polishing QBR narrative text in Word and structuring client-facing summaries |

Workflow:
1. Describe the TAM problem and required metrics in natural language (ChatGPT / Claude)
2. AI proposes architecture, generates data + React components, iterates on UI/UX (Claude for code-heavy steps)
3. Review in browser, refine with follow-up prompts
4. Export and narrative polish in Word with Copilot where needed
5. Push to GitHub → Vercel auto-deploy

The full build loop combined these tools with normal code review and testing.

---

## Prompts used

### 1. Initial scoping (kick-off)

> Build a Web App/Site to demonstrate P1/P2 Tickets per TAM Dedicated Accounts, SLA Breaches per Each Account, Customer Satisfaction Score Indicator, MTTA, MTTR, No of Reopening of Tickets for Each day/week/month/quarter/year. Extract data from Zendesk — since I don't have ZD admin access, generate suitable dummy ticket data. Should be able to filter these requirements and sufficient dashboards.

**Outcome:** Vite + React + Recharts SPA; `scripts/generateData.js` producing Zendesk-shaped JSON; filter bar + overview / accounts / tickets tabs.

### 2. Data realism

> Give accounts different risk profiles so some show higher SLA breach and reopen rates for TAM storytelling.

**Outcome:** `ACCOUNT_PROFILES` in the generator — e.g. higher breach/lower CSAT on selected accounts for at-risk demos.

### 3. Period semantics

> Reopening counts should use `reopen_events[].reopened_at`, not ticket creation date, so Day → Week → Month → Quarter → Year changes reopen metrics correctly.

**Outcome:** Period-aware reopen logic in `src/utils/metrics.js`.

### 4. Operational TAM workflows

> Add stale and aging ticket panels, TAM availability by region, tickets needing attention, and expandable TAM portfolio cards with drill-down.

**Outcome:** `OperationalPanels.jsx`, `TamOverview.jsx`, `ticketOps.js`, availability helpers.

### 5. QBR / service review output

> Add export — Markdown report for QBR, then PDF export alongside it.

**Outcome:** `ExportBar.jsx`, `health.js` (`buildMarkdownReport`), `reportExport.js` (jsPDF).

### 6. Regional portfolio management

> Add region filter in the top bar; regional distribution chart; region should apply everywhere on the dashboard.

**Outcome:** `FilterBar` region dropdown, `RegionDistributionPanel`, global filter wiring across KPIs, charts, stale/aging, and exports.

### 7. UI polish (representative follow-ups)

- Mobile KPI cards 3 per row
- Unified panel headers, chart bar sizing, alert panel alignment
- Color scheme switcher (Dark / Light / Sinch)
- Remove demo header clutter (subtitle + synthetic data badge)

---

## Prompting tips that worked

1. **Name metrics explicitly** — MTTA, MTTR, CSAT, SLA, reopenings → correct fields in generated data (`first_response_at`, `solved_at`, `csat.score`, etc.).
2. **State constraints upfront** — “no Zendesk admin” → dummy data + documented API migration path in README.
3. **Bundle filter dimensions** — TAM + account + priority + period in one prompt → cohesive `FilterBar` instead of bolt-on filters.
4. **Iterate in small UI passes** — one panel or chart per prompt (stale thresholds, region chips, PDF export) keeps diffs reviewable.
5. **Ask for “apply everywhere”** when global filters should cascade — avoids per-panel filter drift.

---

## Key files

| File | Purpose |
|------|---------|
| `scripts/generateData.js` | Synthetic Zendesk-style ticket generator |
| `public/data/tickets.json` | Generated dataset |
| `src/utils/metrics.js` | Period bounds, MTTA/MTTR, CSAT, SLA, reopenings |
| `src/utils/health.js` | Health score, at-risk logic, Markdown report |
| `src/utils/reportExport.js` | PDF report generation |
| `src/utils/ticketOps.js` | Stale/aging thresholds, operational scope |
| `src/utils/kpiDrilldown.js` | KPI → ticket list drill-down |
| `src/App.jsx` | Filters, routing, tab layout |
| `src/components/OverviewDashboard.jsx` | Main dashboard composition |
| `src/components/ExportBar.jsx` | CSV / Markdown / PDF exports |

---

## Demo walkthrough (5 minutes)

1. Open dashboard → **Overview** tab, period **Month**, reference date **2026-06-24**.
2. Filter **Region: EMEA** — KPIs, charts, stale/aging, and TAM portfolio all scope to EMEA.
3. Click an **at-risk account** → account health drill-down.
4. Open **Stale Tickets** → switch threshold to **48h** → **View all** → ticket feed.
5. **Export → Download PDF** — QBR-ready summary for the filtered period/region.

---

## Future: real Zendesk integration

Replace static JSON with Zendesk API fetch; map `urgent/high/normal/low` → P1–P4; pull ticket metrics and satisfaction ratings. Dashboard components and metrics engine stay unchanged — see `README.md` for endpoint mapping.

---

## Tech stack

- React 19 + Vite
- Recharts (charts)
- date-fns (period filtering)
- jsPDF + jspdf-autotable (PDF export)
- Local JSON dataset (no backend)
- Deployed on Vercel
