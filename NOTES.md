# AI Tools & Prompts — Part B Build Notes

## Tool Used

**Cursor** (AI-assisted IDE) with Claude as the coding agent.

## Initial Scoping Prompt

> Build a Web App/Site to demonstrate P1/P2 Tickets per TAM Dedicated Accounts, SLA Breaches per Each Account, Customer Satisfaction Score Indicator, MTTA, MTTR, No of Reopening of Tickets for Each day/week/month/quarter/year. Extract data from Zendesk — since I don't have ZD admin access, generate suitable dummy ticket data. Should be able to filter these requirements and sufficient dashboards.

## Follow-up Prompts & Iterations

1. **Architecture decision** — Agent proposed Vite + React + Recharts with a Node.js data generator script producing Zendesk-shaped JSON, avoiding any backend/API dependency for the demo.

2. **Data realism** — Requested account-specific "risk profiles" so some accounts (e.g. Nexus Financial, LogiTrans) show higher SLA breach and reopen rates, making the dashboard useful for TAM storytelling in interviews.

3. **Period filtering** — Clarified that reopening counts should be based on `reopen_events[].reopened_at` timestamps (not ticket creation date), so switching Day → Week → Month → Quarter → Year changes reopen metrics correctly.

## Key Files Created

| File | Purpose |
|------|---------|
| `scripts/generateData.js` | Seeded random generator for ~1,600 Zendesk-style tickets |
| `src/data/tickets.json` | Generated dataset (8 accounts, 4 TAMs, 12-month range) |
| `src/utils/metrics.js` | MTTA, MTTR, CSAT, SLA, reopening calculations + period bounds |
| `src/components/*` | Dashboard panels, charts, filters, account matrix, ticket feed |
| `src/App.jsx` | Main layout wiring filters → metrics → visualizations |

## Prompting Tips That Worked

- **Be specific about metrics** — naming MTTA/MTTR/CSAT/SLA explicitly led to correct field generation (`first_response_at`, `solved_at`, etc.).
- **State the constraint upfront** — "no Zendesk admin" immediately redirected from API integration to realistic dummy data with a documented migration path.
- **Request filter dimensions together** — listing TAM, account, priority, and time period in one prompt produced a cohesive filter bar rather than bolt-on filters later.

## How to Regenerate Data

```bash
npm run generate-data
```

Uses seed `42` for reproducible results. Edit `ACCOUNT_PROFILES` in `scripts/generateData.js` to tune breach/CSAT/reopen rates per account.

## Demo Suggestions for Interview

1. Set period to **Month**, reference date **2026-06-22** — shows current month portfolio view.
2. Filter to **Nexus Financial Group** — higher SLA breach rate, lower CSAT (at-risk account narrative).
3. Switch period to **Quarter** — show reopening trend chart rescoping to quarterly buckets.
4. Filter by **TAM: Sarah Chen** — demonstrate portfolio-level view across 2 accounts.
5. Point to **Account Detail Matrix** and **Recent Tickets** table as drill-down evidence.

## What Would Change With Real Zendesk Access

- Replace `import dataset from './data/tickets.json'` with API fetch layer
- Map Zendesk `urgent/high/normal/low` → P1/P2/P3/P4
- Pull `reply_time_in_minutes` and `full_resolution_time_in_minutes` from Ticket Metrics API
- Pull satisfaction ratings from `/api/v2/satisfaction_ratings.json`

The dashboard components and metrics engine would remain unchanged.

---

## Session Checkpoint — 22 Jun 2026 (end of day)

Work saved in git. Resume with:

```bash
cd "/Users/kalwic/dev/TAM Assignment"
npm run dev          # http://localhost:5173
```

### Dataset (current)

- **15 TAMs**, **25 accounts**, **6,251 tickets** (Jan 2024 → Jun 2026)
- Regenerate: `npm run generate-data` (seed `42`, includes Zendesk metric fields + realistic MTTA/MTTR)

### Features completed this session

| Area | Notes |
|------|-------|
| **Ticket detail modal** | 3-pane Zendesk layout, resizable panes (`usePaneResize.jsx`) |
| **Operational panels** | Stale / Aging tickets, TAM Availability with live status |
| **Filters** | Disposition filter, TAM regions (US / EMEA / APAC / LATAM) |
| **CSAT** | Period-based ratings (`rated_at`), full response list, drill-down |
| **Reopenings** | Period-based counts + clickable drill-down |
| **TAM Portfolio Overview** | Expandable cards, Total badge (number only), Created/Other/P1/P2/Resolved/Closed/IP/WFR/Esc stats, portfolio summary pills, Resolved/Closed drill-down |
| **MTTA / MTTR** | Timestamp-driven; `ticket.zendesk.metrics` fields; ~10% open tickets pending first reply |
| **Branding** | Official Sinch logo on yellow (`#FFDD00`) badge, Sinch favicon |

### Key metric rules (TAM Portfolio)

- **Total** (badge): sum of Created + Other + P1/P2 + Resolved + Closed + IP + WFR + Esc in period (number only in UI)
- **Created**: tickets created in period
- **Other**: resolve / close / reopen activity in period on tickets *not* created in period
- **P1/P2**: priority count among tickets created in period
- **Resolved / Closed**: created in period AND solved/closed in same period
- **IP / WFR / Esc**: open dispositions on tickets created in period
- TAM cards sorted by `activityTotal`

### Default demo settings

- Reference date: **2026-06-22**
- Period: **Month**
- Tabs: Overview → TAMs → Accounts → Tickets

### Key files touched recently

- `src/components/TamOverview.jsx` — TAM portfolio UI + Total badge
- `src/utils/metrics.js` — `getPortfolioActivityBreakdown`, `getTicketsHandledBreakdown`, MTTA/MTTR helpers
- `scripts/generateData.js` — Zendesk metrics, SLA/reply realism
- `src/data/tickets.json` — regenerated dataset
- `src/utils/kpiDrilldown.js` — RESOLVED / CLOSED KPI keys
- `public/sinch-logo.svg` — black wordmark on yellow header wrap
- `src/App.jsx` / `src/App.css` — header branding + TAM overview styles

