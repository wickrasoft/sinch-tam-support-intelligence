import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'Part-B-TAM-Support-Intelligence.docx');

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });

const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });

const bullet = (text, level = 0) =>
  new Paragraph({
    text,
    bullet: { level },
    spacing: { after: 80 },
  });

const quote = (text) =>
  new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 720 },
    children: [
      new TextRun({ text: `"${text}"`, italics: true, color: '333333' }),
    ],
  });

const labelValue = (label, value) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });

function tableRow(cells, header = false) {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: header })],
            }),
          ],
          shading: header
            ? { fill: 'E8E8E8', type: ShadingType.CLEAR }
            : undefined,
        }),
    ),
  });
}

function metricsTable() {
  const rows = [
    ['Metric', 'Use for TAMs'],
    ['P1 / P2 volume', 'Escalation and incident load per portfolio'],
    ['SLA breaches', 'First-response and resolution compliance'],
    ['CSAT', 'Satisfaction trend and low-score follow-up'],
    ['MTTA / MTTR', 'Responsiveness and resolution speed'],
    ['Reopenings', 'Quality / stability signal (day to year buckets)'],
    ['Account Health Score (0–100)', 'Composite portfolio health at a glance'],
    ['At-risk accounts', 'Accounts needing proactive TAM attention'],
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, i) => tableRow(row, i === 0)),
  });
}

function filesTable() {
  const rows = [
    ['File', 'Purpose'],
    ['scripts/generateData.js', 'Synthetic Zendesk-style ticket generator'],
    ['public/data/tickets.json', 'Generated dataset'],
    ['src/utils/metrics.js', 'Period bounds, MTTA/MTTR, CSAT, SLA, reopenings'],
    ['src/utils/health.js', 'Health score, at-risk logic, Markdown report'],
    ['src/utils/reportExport.js', 'PDF report generation'],
    ['src/utils/ticketOps.js', 'Stale/aging thresholds, operational scope'],
    ['src/utils/kpiDrilldown.js', 'KPI to ticket list drill-down'],
    ['src/App.jsx', 'Filters, routing, tab layout'],
    ['src/components/OverviewDashboard.jsx', 'Main dashboard composition'],
    ['src/components/ExportBar.jsx', 'CSV / Markdown / PDF exports'],
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, i) => tableRow(row, i === 0)),
  });
}

const doc = new Document({
  title: 'Part B — TAM Support Intelligence',
  creator: 'TAM Assignment',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: 'Part B: AI-Assisted TAM Tool',
              bold: true,
              size: 36,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: 'TAM Support Intelligence Dashboard',
              size: 28,
              color: '444444',
            }),
          ],
        }),

        heading('1. Submission Summary'),
        labelValue(
          'Tool built',
          'TAM Support Intelligence — a lightweight web dashboard for Technical Account Managers to monitor support health across dedicated enterprise accounts, spot operational risk early, and export QBR-ready summaries.',
        ),
        body(
          'Why it is relevant to TAM work: TAMs need a single view of portfolio health (SLA, CSAT, P1/P2 volume, reopenings, stale/aging tickets) without waiting on Zendesk admin access or manual spreadsheet work. This tool turns ticket-level data into account health scores, at-risk alerts, regional portfolio views, and exportable service-review reports.',
        ),
        labelValue(
          'Repository',
          'github.com/wickrasoft/sinch-tam-support-intelligence',
        ),
        labelValue('Deployment', 'Vercel (auto-deploy from main branch)'),
        body('Run locally:'),
        bullet('npm install'),
        bullet('npm run dev  →  http://localhost:5173'),
        bullet('npm run generate-data  →  optional, regenerates synthetic dataset'),

        heading('2. What the Tool Does'),
        heading('Core Metrics', HeadingLevel.HEADING_2),
        metricsTable(),
        new Paragraph({ spacing: { after: 200 } }),

        heading('Operational Panels', HeadingLevel.HEADING_2),
        bullet('Stale tickets — open tickets with no recent update (24h / 48h / 72h thresholds)'),
        bullet('Aging tickets — unresolved tickets by age (7d / 14d / 30d+)'),
        bullet('Tickets needing attention — disposition-based alert queue'),
        bullet('TAM portfolio overview — per-TAM activity breakdown with drill-down'),

        heading('Global Filters', HeadingLevel.HEADING_2),
        bullet('Period: Day / Week / Month / Quarter / Year'),
        bullet('Reference date, Region (US / EMEA / APAC / LATAM), TAM, Account, Priority, Status'),
        bullet('SLA breaches only'),
        body('All filters apply consistently across KPIs, charts, operational panels, and exports.'),

        heading('Exports', HeadingLevel.HEADING_2),
        bullet('CSV — filtered ticket list'),
        bullet('Markdown report — QBR / service review summary'),
        bullet('PDF report — same content, formatted for sharing'),

        heading('Other Features', HeadingLevel.HEADING_2),
        bullet('Zendesk-style ticket detail modal (3-pane layout)'),
        bullet('Regional distribution chart with drill-down'),
        bullet('Period-over-period KPI deltas vs prior period'),
        bullet('Color themes (Dark / Light / Sinch branding)'),
        bullet('Synthetic dataset shaped like Zendesk exports (no live API required for demo)'),

        heading('Dataset', HeadingLevel.HEADING_2),
        bullet('15 TAMs, 25 accounts, ~6,250 tickets (Jan 2024 → Jun 2026)'),
        bullet('Account-specific risk profiles for realistic at-risk storytelling'),
        bullet('Regenerate with: npm run generate-data (seed 42)'),

        heading('3. AI Tools Used'),
        body('ChatGPT, Claude, and Microsoft Copilot — used for different stages of the work:', { bold: true }),
        bullet('ChatGPT — initial scoping, architecture ideas, and rapid prototyping prompts'),
        bullet('Claude — longer code generation, refactoring, and iterating on React components and data logic'),
        bullet('Microsoft Copilot — polishing QBR narrative text in Word and structuring client-facing summaries'),
        body('Workflow:'),
        bullet('Describe the TAM problem and required metrics in natural language (ChatGPT / Claude)'),
        bullet('AI proposes architecture, generates data and React components, iterates on UI/UX (Claude for code-heavy steps)'),
        bullet('Review in browser, refine with follow-up prompts'),
        bullet('Export and narrative polish in Word with Copilot where needed'),
        bullet('Push to GitHub → Vercel auto-deploy'),
        body(
          'The full build loop combined ChatGPT, Claude, and Copilot with normal code review and testing.',
        ),

        heading('4. Prompts Used'),
        heading('4.1 Initial Scoping (Kick-off)', HeadingLevel.HEADING_2),
        quote(
          'Build a Web App/Site to demonstrate P1/P2 Tickets per TAM Dedicated Accounts, SLA Breaches per Each Account, Customer Satisfaction Score Indicator, MTTA, MTTR, No of Reopening of Tickets for Each day/week/month/quarter/year. Extract data from Zendesk — since I don\'t have ZD admin access, generate suitable dummy ticket data. Should be able to filter these requirements and sufficient dashboards.',
        ),
        body(
          'Outcome: Vite + React + Recharts SPA; scripts/generateData.js producing Zendesk-shaped JSON; filter bar with overview, accounts, and tickets tabs.',
        ),

        heading('4.2 Data Realism', HeadingLevel.HEADING_2),
        quote(
          'Give accounts different risk profiles so some show higher SLA breach and reopen rates for TAM storytelling.',
        ),
        body(
          'Outcome: ACCOUNT_PROFILES in the generator — selected accounts show higher breach rates and lower CSAT for at-risk demos.',
        ),

        heading('4.3 Period Semantics', HeadingLevel.HEADING_2),
        quote(
          'Reopening counts should use reopen_events[].reopened_at, not ticket creation date, so Day → Week → Month → Quarter → Year changes reopen metrics correctly.',
        ),
        body('Outcome: Period-aware reopen logic in src/utils/metrics.js.'),

        heading('4.4 Operational TAM Workflows', HeadingLevel.HEADING_2),
        quote(
          'Add stale and aging ticket panels, TAM availability by region, tickets needing attention, and expandable TAM portfolio cards with drill-down.',
        ),
        body(
          'Outcome: OperationalPanels.jsx, TamOverview.jsx, ticketOps.js, and availability helpers.',
        ),

        heading('4.5 QBR / Service Review Output', HeadingLevel.HEADING_2),
        quote('Add export — Markdown report for QBR, then PDF export alongside it.'),
        body(
          'Outcome: ExportBar.jsx, health.js (buildMarkdownReport), reportExport.js (jsPDF).',
        ),

        heading('4.6 Regional Portfolio Management', HeadingLevel.HEADING_2),
        quote(
          'Add region filter in the top bar; regional distribution chart; region should apply everywhere on the dashboard.',
        ),
        body(
          'Outcome: FilterBar region dropdown, RegionDistributionPanel, global filter wiring across all dashboard sections.',
        ),

        heading('4.7 UI Polish (Representative Follow-ups)', HeadingLevel.HEADING_2),
        bullet('Mobile KPI cards 3 per row'),
        bullet('Unified panel headers, chart bar sizing, alert panel alignment'),
        bullet('Color scheme switcher (Dark / Light / Sinch)'),
        bullet('Remove demo header clutter (subtitle and synthetic data badge)'),

        heading('5. Prompting Tips That Worked'),
        bullet(
          'Name metrics explicitly — MTTA, MTTR, CSAT, SLA, reopenings led to correct data fields.',
        ),
        bullet(
          'State constraints upfront — "no Zendesk admin" redirected to dummy data with a documented API migration path.',
        ),
        bullet(
          'Bundle filter dimensions — TAM + account + priority + period in one prompt produced a cohesive filter bar.',
        ),
        bullet(
          'Iterate in small UI passes — one panel or chart per prompt keeps changes reviewable.',
        ),
        bullet(
          'Ask for "apply everywhere" when global filters should cascade across all sections.',
        ),

        heading('6. Key Files'),
        filesTable(),
        new Paragraph({ spacing: { after: 200 } }),

        heading('7. Demo Walkthrough (5 Minutes)'),
        bullet('Open dashboard → Overview tab, period Month, reference date 2026-06-24.'),
        bullet('Filter Region: EMEA — KPIs, charts, stale/aging, and TAM portfolio all scope to EMEA.'),
        bullet('Click an at-risk account → account health drill-down.'),
        bullet('Open Stale Tickets → switch threshold to 48h → View all → ticket feed.'),
        bullet('Export → Download PDF — QBR-ready summary for the filtered period/region.'),

        heading('8. Future: Real Zendesk Integration'),
        body(
          'Replace static JSON with Zendesk API fetch; map urgent/high/normal/low to P1–P4; pull ticket metrics and satisfaction ratings. Dashboard components and metrics engine stay unchanged.',
        ),

        heading('9. Tech Stack'),
        bullet('React 19 + Vite'),
        bullet('Recharts (charts)'),
        bullet('date-fns (period filtering)'),
        bullet('jsPDF + jspdf-autotable (PDF export)'),
        bullet('Local JSON dataset (no backend)'),
        bullet('Deployed on Vercel'),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
