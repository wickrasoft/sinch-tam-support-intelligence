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
    ['First Contact Resolution', 'Resolved on first contact (count and %)'],
    ['Reopenings & Reopen rate', 'Quality / stability of fixes'],
    ['Escalations (JIRA)', 'Tickets handed to ServiceOps, Supplier, AFA, etc.'],
    ['Account Health Score (0–100)', 'Composite portfolio health at a glance'],
    ['At-risk accounts', 'Accounts needing proactive TAM attention'],
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
        bullet('TAM portfolio overview — per-TAM activity, live availability, drill-down'),
        bullet('Escalations (JIRA) & Tickets by Product — pie charts with drill-down'),
        bullet('Planned Out-of-Office — MS Teams Shifts view with country holidays'),

        heading('Live & Integrations', HeadingLevel.HEADING_2),
        bullet('Ongoing / Recent Incidents — pulled from status.sinch.com, refreshed every 5 min'),
        bullet('Uptime Monitoring — native render of monitor.sinch.com (Checkly) with time-range filters'),
        bullet('Live KPIs — Available TAMs, Ongoing Incidents (real-time counts)'),
        bullet('JIRA escalations + linked INC incidents surfaced in the Zendesk ticket view'),
        bullet('Deep links — "Open in Teams" (MS Teams app) and Confluence TAM directory'),

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
        bullet('Zendesk-style ticket detail modal with JIRA app rail (escalations + INC)'),
        bullet('Account Info modal — primary TAM availability and assigned backup if OOO'),
        bullet('TAM availability shown as analog status clocks (local time + country flag)'),
        bullet('Period-over-period KPI deltas, drill-downs, and in-modal navigation'),
        bullet('Color themes (Dark / Light / Sinch branding)'),
        bullet('Synthetic dataset shaped like Zendesk exports (no live API required for demo)'),

        heading('Dataset', HeadingLevel.HEADING_2),
        bullet('18 TAMs (US, EMEA, APAC, LATAM), 31 accounts, ~10,950 tickets (Jun 2025 → Jun 2026)'),
        bullet('~30 tickets/day; every P1/P2 carries a linked INC; ~2,500 cross-team escalations'),
        bullet('Country-specific timezones and public holidays per TAM'),
        bullet('Account-specific risk profiles for realistic at-risk storytelling'),
        bullet('Regenerate with: npm run generate-data (seed 42)'),

        heading('3. AI Tools Used'),
        body('ChatGPT, Claude Code, and Cursor — used across the build:', { bold: true }),
        bullet('ChatGPT — initial scoping, architecture ideas, and prototyping prompts'),
        bullet('Claude Code — code generation, refactoring, and data/logic iteration'),
        bullet('Cursor — in-editor AI pair-programming to build, run, and debug the app'),
        body('Workflow:'),
        bullet('Describe the TAM problem and metrics in natural language'),
        bullet('AI proposes architecture, generates data and React components, iterates on UI/UX'),
        bullet('Review in browser, refine with follow-up prompts'),
        bullet('Push to GitHub → Vercel auto-deploy'),

        heading('4. Prompts Used'),
        body('Representative prompts that drove the build:'),
        bullet('Build a dashboard for P1/P2, SLA breaches, CSAT, MTTA/MTTR and reopenings per TAM account, filterable by day/week/month/quarter/year — generate dummy Zendesk-style data (no admin access).'),
        bullet('Give accounts different risk profiles so some look at-risk.'),
        bullet('Count reopenings by reopen date, not creation date, so period filters are correct.'),
        bullet('Add stale/aging ticket panels, TAM availability, and expandable portfolio cards with drill-down.'),
        bullet('Add Markdown and PDF exports for QBR / service reviews.'),
        bullet('Add a region filter and regional chart that apply everywhere.'),
        bullet('Add JIRA escalations and a Tickets-by-Product pie with drill-down; link INC incidents to P1/P2 tickets.'),
        bullet('Pull live incidents from status.sinch.com and uptime from monitor.sinch.com.'),
        bullet('Add MS Teams Shifts for planned OOO and show TAM availability with flags and local time.'),

        heading('5. Future: Real Zendesk Integration'),
        body(
          'Replace static JSON with Zendesk API fetch; map urgent/high/normal/low to P1–P4; pull ticket metrics and satisfaction ratings. Dashboard components and metrics engine stay unchanged.',
        ),

        heading('6. Tech Stack'),
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
