import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
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
  ShadingType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'Zendesk-Tooling-Improvement-Proposal.docx');

const h1 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 160 } });
const h2 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } });
const h3 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 } });
const p = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22, ...opts })] });
const bullet = (text, level = 0) =>
  new Paragraph({ text, bullet: { level }, spacing: { after: 80 } });
const spacer = () => new Paragraph({ spacing: { after: 80 } });

function table(headers, rows) {
  const all = [headers, ...rows];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: all.map((cells, ri) =>
      new TableRow({
        children: cells.map(
          (text) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text, bold: ri === 0, size: 20 })] })],
              shading: ri === 0 ? { fill: 'E8E8E8', type: ShadingType.CLEAR } : undefined,
            }),
        ),
      }),
    ),
  });
}

function issueSection({
  number,
  title,
  observed,
  problemDetail,
  whoAffected,
  scenario,
  rootCauses,
  businessImpact,
  changes,
  implementation,
  safeguards,
  metrics,
}) {
  const children = [
    h1(`Issue ${number}: ${title}`),
    observed ? p(observed, { italics: true, color: '444444' }) : null,
    h2('What the problem is'),
    ...problemDetail.map((t) => p(t)),
    h3('Who is affected'),
    ...whoAffected.map((t) => bullet(t)),
    h3('Real-world scenario'),
    ...scenario.map((t) => p(t)),
    h3('Root causes'),
    ...rootCauses.map((t) => bullet(t)),
    h3('Business impact'),
    ...businessImpact.map((t) => bullet(t)),
    h2('What I would change and why'),
    ...changes.flatMap((c) => [h3(c.title), ...c.detail.map((t) => (t.startsWith('•') ? bullet(t.slice(2)) : p(t)))]),
    h2('How to implement without disrupting customers'),
    table(
      ['Phase', 'Timeline', 'Actions', 'Customer impact'],
      implementation,
    ),
    spacer(),
    h3('Safeguards'),
    ...safeguards.map((t) => bullet(t)),
    h2('How to measure success'),
    table(['Metric', 'How to measure', 'Baseline', '90-day target'], metrics),
    spacer(),
  ];
  return children.filter(Boolean);
}

export const proposalCover = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Zendesk & Tooling Improvement Proposal', bold: true, size: 36 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Proposal and Implementation Plan', size: 26, color: '444444' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'EMEA Team Lead · First 30 Days · Problem, Change, Implementation, Measurement', size: 22, color: '666666' })],
  }),
];

export const proposalExecSummary = [
  h1('Executive Summary'),
  p(
    'After two weeks as EMEA Team Lead, I have identified three friction points in how we use Zendesk. Two were directly observed in day-to-day operations: duplicate tickets created when customers reply on the same issue, and supplier escalation updates that do not reopen or surface on the parent customer ticket (functionality we previously had in JIRA). One additional issue is proposed for evaluation: stale on-hold tickets without automated nudges.',
  ),
  p(
    'This document is in two parts. Part 1 is the proposal: for each issue it sets out what the problem is, what I would change and why, how to implement it without disrupting customers, and how to measure success. Part 2 is the detailed step-by-step implementation plan, with phased projects, deliverables, success criteria, and rollback for a 30 / 60 / 90-day review.',
  ),
];

export const proposalIssues = [
        ...issueSection({
          number: 1,
          title: 'Duplicate Tickets When Customers Reply on the Same Issue',
          observed: 'Directly observed in EMEA support operations.',
          problemDetail: [
            'When a customer follows up on an issue that is already being worked — or replies to a ticket that has been marked Solved or Closed — Zendesk frequently creates a brand-new ticket instead of attaching the reply to the existing record. The customer believes they are continuing one conversation. The system treats it as a new case.',
            'This is not a single misconfiguration. It is a combination of email threading behaviour, closed-ticket policy, multiple support channels, and inconsistent use of organization and contact records. The result is fragmented history: two or more agents may work the same underlying problem without seeing each other\'s notes, macros applied, or supplier escalations already in flight.',
            'Duplicates are often discovered only when a customer complains ("I already have ticket #48291 — why did I get #48312?") or when a TAM notices inflated incident counts before a QBR. By then, duplicate effort has already been spent.',
          ],
          whoAffected: [
            'Support agents — duplicate investigation, conflicting responses, wasted handle time',
            'Customers — multiple ticket numbers, repeated questions, slower resolution',
            'TAMs — inaccurate account health data (ticket volume, MTTR, reopen rates)',
            'Leadership — unreliable reporting for SLA reviews and capacity planning',
            'Zendesk admins — reactive merge requests instead of prevention at source',
          ],
          scenario: [
            'A enterprise customer opens a P2 SMS delivery issue on Monday. The agent troubleshoots, escalates to a carrier, and sets the ticket On-hold. On Wednesday the ticket is marked Solved with a summary email. On Thursday the customer replies to that email: "Delivery is still failing on route X."',
            'Because the ticket was Solved and the reply hits the closed-ticket follow-up rule, Zendesk creates ticket #48312 instead of reopening #48100. A different agent picks it up in the morning queue. They ask the customer for logs that were already provided two days earlier. The carrier escalation on the original ticket is invisible on the new record. MTTR clocks restart. The customer loses confidence.',
          ],
          rootCauses: [
            'Closed-ticket follow-up policy set to "create new ticket" rather than reopen or linked follow-up',
            'Email subject lines changed by customers or mail clients, breaking In-Reply-To threading',
            'Multiple inbound channels (web form, email alias, API) creating separate entry points',
            'Customer replies from a different email address not linked to the same Zendesk contact',
            'No automated duplicate detection at ticket creation time',
            'Enterprise customers CC multiple colleagues, each generating separate requester threads',
            'Triggers that assign new tickets before merge or similarity checks run',
          ],
          businessImpact: [
            'Inflated ticket volumes distort operational metrics and QBR narratives',
            'Duplicate handle time — estimated 15–30 minutes per duplicate cluster for enterprise tickets',
            'Increased risk of contradictory customer communication',
            'SLA and MTTR metrics become unreliable for account-level reporting',
            'Customer frustration and escalations to TAMs or account directors',
          ],
          changes: [
            {
              title: 'A. Standardise closed-ticket follow-up behaviour',
              detail: [
                'Enable "Allow follow-ups on closed tickets" in Zendesk with an explicit policy documented in the agent playbook:',
                '• If closed ≤ 7 days AND same requester AND same organization → reopen the original ticket and notify the prior assignee',
                '• If closed > 7 days → create a linked follow-up ticket that references the parent ID (preserves historical SLA data on the original)',
                'Why: The majority of "same issue" replies happen within a week of closure. Reopening preserves context. Older closures get a clean follow-up without corrupting historical metrics.',
              ],
            },
            {
              title: 'B. Duplicate-detection automation at creation',
              detail: [
                'Build a Zendesk trigger that runs when a new ticket is created:',
                '• Check if the same organization + requester has an open, pending, or on-hold ticket in the last 14 days',
                '• Compare subject line similarity (contains match or Levenshtein threshold) OR match on custom field Issue Reference',
                '• Action: add internal note "Possible duplicate of #{{ticket.id}} — review before responding", notify assignee of the existing ticket, apply tag possible_duplicate',
                'Phase 2: auto-merge when email Message-ID / In-Reply-To headers confirm same thread',
                'Why: Prevention at creation is cheaper than merge-after-the-fact. Agents keep control in phase 1; automation handles only high-confidence cases later.',
              ],
            },
            {
              title: 'C. Email channel and template hygiene',
              detail: [
                'Audit all inbound support addresses, forwarding rules, and brand aliases for EMEA',
                'Standardise outbound subject format: [Ticket #{{ticket.id}}] {{ticket.title}} — never strip the ID in notifications',
                'Update auto-acknowledgement and solved-ticket templates to say: "Please reply to this email to continue the same case. Your ticket number is #{{ticket.id}}."',
                'Ensure SPF/DKIM/DMARC are correct so replies are not re-routed as new messages',
                'Why: Most threading breaks are email-header problems, not agent errors. Fixing templates is zero-disruption to workflow.',
              ],
            },
            {
              title: 'D. Mandatory Issue Reference field for enterprise accounts',
              detail: [
                'Add custom field issue_reference (text) on enterprise ticket forms',
                'Agents populate on first touch or inherit from customer portal / TAM-provided case ID',
                'Duplicate detection prioritises matching issue_reference over fuzzy subject match',
                'Why: Enterprise customers often use helpdesk systems that rewrite subject lines. A shared reference is more reliable than subject matching alone.',
              ],
            },
          ],
          implementation: [
            ['Discover', 'Week 1–2', 'Export 90 days of tickets; identify merge patterns (same org, same day, similar subject); audit email channels and closed-ticket settings', 'None — internal analysis'],
            ['Design', 'Week 2–3', 'Document follow-up policy; write trigger specs with Zendesk admin; update email templates in sandbox', 'None'],
            ['Pilot', 'Week 3–4', 'Enable follow-up-on-closed in sandbox; one EMEA pod; duplicate suggestions only (no auto-merge)', 'None — internal only'],
            ['Roll out', 'Week 5–6', 'Production follow-up policy; template updates; 15-min agent huddle + quick reference card', 'Minor — clearer ticket IDs in email subjects'],
            ['Optimise', 'Week 7–12', 'Enable high-confidence auto-merge; refine triggers from pilot false-positive rate', 'Positive — fewer duplicate ticket numbers'],
          ],
          safeguards: [
            'Phase 1: suggest-only duplicates — never auto-merge without assignee acknowledgement',
            'Flag strategic / TAM-managed accounts for manual review before any merge',
            'Each trigger can be disabled independently for rollback',
            'Weekly review of false positives in first 30 days of production',
          ],
          metrics: [
            ['Duplicate ticket rate', 'Tickets merged within 48h of creation ÷ total new tickets', 'Measure now from 90-day export', 'Reduce by 40%'],
            ['Reopen vs new-on-reply', 'Follow-ups on closed tickets that reopen vs create new', 'Measure now', 'Increase reopen rate where appropriate'],
            ['Repeat handle time', 'Avg agent touches on duplicate clusters (audit sample)', 'Sample 30 clusters', 'Reduce by 25%'],
            ['Customer complaints', 'Tickets tagged duplicate_ticket_complaint or free-text search', 'Current monthly count', 'Near zero'],
            ['Agent pulse', 'Monthly 1-question survey on duplicate frustration', 'Baseline survey', 'Measurable improvement'],
          ],
        }),

        ...issueSection({
          number: 2,
          title: 'Supplier Escalation Updates Do Not Reopen Parent Zendesk Tickets',
          observed: 'Directly observed — regression from previous JIRA workflow where supplier updates auto-transitioned the parent issue.',
          problemDetail: [
            'Many customer issues require escalation to an external supplier: mobile carriers, SMS aggregators, CPaaS platform vendors, or numbering/hosting partners. In Zendesk, agents typically open a side conversation, send email to a supplier address, or create a child ticket — then set the parent customer ticket to On-hold.',
            'When the supplier responds — often hours or days later — that response frequently does not update the parent customer ticket. The parent remains On-hold. The assignee receives no notification. No status changes to Open or a custom "Supplier Responded" state. The agent must manually remember to check the side thread.',
            'In our previous JIRA setup, supplier-linked issues automatically moved the parent issue when the supplier ticket was updated, and the assignee was notified. Agents built muscle memory around that behaviour. Zendesk, as currently configured, does not replicate it. This is the single largest process regression reported by experienced agents in my first two weeks.',
          ],
          whoAffected: [
            'Support agents — manual polling of supplier threads; missed updates; inconsistent practice across EMEA',
            'Customers — delayed updates while parent ticket appears idle',
            'Team leads — cannot trust on-hold queues without manual audits',
            'TAMs — blind to supplier-dependent delays on strategic accounts',
            'Suppliers — sometimes receive duplicate escalations because agents open new threads when old ones are forgotten',
          ],
          scenario: [
            'An agent escalates an SMS delivery failure to Carrier A via side conversation on ticket #55001. Parent ticket set On-hold. Carrier A replies 18 hours later with a routing fix and request for test confirmation. The reply lands in the side conversation only.',
            'The parent ticket still shows On-hold. The assignee is working other tickets and does not notice. After 48 hours the customer emails: "Any update?" — now unhappy. The agent discovers the supplier reply, apologises, and runs the test. Total delay attributable to tooling: ~30 hours that should have been < 2 hours from supplier response.',
          ],
          rootCauses: [
            'No Zendesk trigger linking side conversation / child ticket inbound activity to parent ticket',
            'Mixed escalation practices — some agents use side conversations, some email from personal inbox, some child tickets',
            'Supplier auto-acknowledgement emails not filtered, so teams disabled notifications to avoid noise',
            'Parent ticket on-hold automations do not distinguish "waiting on customer" vs "waiting on supplier"',
            'No custom fields capturing supplier_ticket_id for searchability',
            'JIRA workflow rules were not mapped 1:1 during Zendesk migration',
          ],
          businessImpact: [
            'Extended customer wait time on supplier-dependent incidents (often P1/P2)',
            'SLA breach risk on first-response and resolution targets',
            'Inconsistent EMEA customer experience vs agents who manually check threads',
            'Increased TAM and executive escalations driven by silence, not technical complexity',
            'Agent frustration and loss of trust in the tooling migration',
          ],
          changes: [
            {
              title: 'A. Standardise one escalation model per supplier category',
              detail: [
                'Document and enforce a single pattern — no ad-hoc email from agent personal inboxes:',
                '• Email-based suppliers → Side Conversation from parent ticket (required)',
                '• Formal supplier SLAs → Child ticket linked to parent with shared custom fields',
                '• Portal/API suppliers → Webhook integration to parent ticket via middleware',
                'Why: Triggers can only be reliable if input channels are predictable. Mixed models make automation impossible.',
              ],
            },
            {
              title: 'B. "Supplier reply → parent ticket action" automations',
              detail: [
                'Example trigger (to be refined with Zendesk admin):',
                'WHEN: Inbound comment or email on side conversation OR child ticket update',
                'AND: Tagged supplier_escalation OR sender domain in supplier allowlist',
                'AND: NOT subject matches "auto-acknowledgement|ticket received|out of office"',
                'THEN on PARENT ticket:',
                '• Set status → Open (or custom status "Supplier Responded")',
                '• Add internal note with supplier reply excerpt and timestamp',
                '• Notify assignee + @escalation group via email/Slack',
                '• If parent on-hold > 72h → also notify EMEA Team Lead',
                'Why: Directly replicates JIRA auto-transition. Assignee gets the signal they expect without polling.',
              ],
            },
            {
              title: 'C. Escalation custom fields and macros',
              detail: [
                'Add fields: supplier_name (dropdown), supplier_ticket_id (text), escalation_opened_at (date), escalation_type (carrier / platform / numbering / other)',
                'Macro "Start supplier escalation" — sets fields, opens side conversation with template, sets parent On-hold, applies tag supplier_escalation',
                'Macro "Supplier noise — keep on hold" — suppresses false-positive reopen for auto-replies',
                'Why: Structured data enables reporting ("MTTR on carrier escalations") and TAM visibility without reading side threads.',
              ],
            },
            {
              title: 'D. Integration layer for non-email suppliers',
              detail: [
                'Where suppliers use portals, configure Zendesk webhooks + lightweight middleware (Make, Zapier, or internal service) to post internal notes and trigger parent reopen on supplier status change',
                'Map JIRA webhook rules from migration documentation as starting template',
                'Why: Some strategic suppliers will never email side conversations reliably. API path matches old JIRA behaviour.',
              ],
            },
          ],
          implementation: [
            ['Discover', 'Week 1–2', 'Interview 8–10 agents; map top 10 supplier paths; document JIRA vs Zendesk gap; list mailboxes and side conv usage', 'None'],
            ['Design', 'Week 3', 'Agree escalation model per supplier type; write trigger spec; define allowlist and noise filters', 'None'],
            ['Shadow pilot', 'Week 4–5', 'Triggers fire in log-only mode — record what would have happened, no ticket changes', 'None'],
            ['Live pilot', 'Week 6–7', 'One supplier category (e.g. carrier) in EMEA; status change + notify enabled', 'Positive — faster updates, no customer process change'],
            ['Roll out', 'Week 8–10', 'All EMEA suppliers; updated playbook; US/APAC alignment session', 'None if model is consistent'],
          ],
          safeguards: [
            'Shadow mode minimum 2 weeks before any status change in production',
            'Regex filter for supplier auto-acknowledgements and out-of-office replies',
            'Agent override macro always available — automation assists, does not trap',
            'Weekly false-positive review with escalation SMEs',
          ],
          metrics: [
            ['Supplier reply → action time', 'Timestamp supplier inbound to parent status change (audit sample n=50/month)', 'Median hours — measure now', 'Reduce by 70% (e.g. 24h → <4h)'],
            ['Missed supplier updates', 'Monthly audit: on-hold tickets with supplier reply but no parent action', 'Current count', 'Reduce by 80%'],
            ['MTTR on escalations', 'Explore report: tickets tagged supplier_escalation', 'Current MTTR', 'Reduce by 15%'],
            ['False-positive reopens', 'Reopens reversed by agent within 1h ÷ total supplier triggers', 'N/A in pilot', 'Under 10%'],
            ['Agent polling', 'Survey: "How often do you manually check supplier threads?"', 'Baseline', 'Significant reduction'],
          ],
        }),

        ...issueSection({
          number: 3,
          title: 'Stale and On-Hold Tickets Lack Automated Nudges',
          observed: 'Suggested for evaluation — complements Issue 2; visible in queue audits.',
          problemDetail: [
            'Tickets in Pending (awaiting customer) or On-hold (awaiting supplier or internal team) frequently sit without any activity for days. Zendesk does not currently send a structured reminder to the assignee, team lead, or TAM until the customer chases, SLA breach fires, or someone happens to audit the queue.',
            'This creates "silent tickets" — work items that are technically open but invisible to management. In EMEA, with handoffs across time zones, a ticket placed on-hold on Friday evening may not be touched until Tuesday. If the supplier replied Saturday (Issue 2), the delay compounds.',
            'Agents are not lazy — they are queue-driven. Without nudges, on-hold tickets deprioritise relative to new inbound work.',
          ],
          whoAffected: [
            'Customers — "any update?" messages that damage trust',
            'Agents — surprise SLA breaches on forgotten on-hold tickets',
            'Team leads — queue audits required to find stale work',
            'TAMs — cannot distinguish healthy on-hold from neglected on-hold',
          ],
          scenario: [
            'Ticket #60045 set On-hold awaiting internal engineering on a webhook configuration fix. Engineering posts a question in an internal Slack thread but never updates Zendesk. The ticket is silent for 6 days. Customer sends a frustrated follow-up. P1 is considered for escalation. Engineering answer was available on day 2 — customer impact was tooling and handoff failure, not technical difficulty.',
          ],
          rootCauses: [
            'No time-based automations on on-hold / pending status',
            'Same nudge logic for P1 and P4 — or no nudge at all',
            'Internal dependencies not tracked separately from supplier waits',
            'Fear of customer spam prevents any auto-communication — but internal nudges are not used instead',
          ],
          businessImpact: [
            'Increased "customer chase" messages — leading indicator of CSAT risk',
            'SLA breaches on tickets that were recoverable days earlier',
            'Higher mean age of on-hold tickets in reporting',
            'Team lead time spent on manual queue audits',
          ],
          changes: [
            {
              title: 'A. Tiered internal nudge automations',
              detail: [
                'P1/P2 on-hold or pending with no public/internal comment:',
                '• 24h → email assignee: "Ticket #{{ticket.id}} — no update 24h"',
                '• 48h → internal note + notify assignee and team lead',
                '• 72h → apply tag stale_ticket; notify TAM if enterprise account',
                'P3/P4: use 48h / 72h / 5-day thresholds',
                'Why: Internal-only nudges do not spam customers. Tiering matches urgency to priority.',
              ],
            },
            {
              title: 'B. Distinguish on-hold reason',
              detail: [
                'Custom field on_hold_reason: Customer / Supplier / Internal engineering / Other',
                'Different nudge copy and escalation path per reason (links to Issue 2 for supplier)',
                'Why: "On-hold" is too vague for automation. Supplier waits need Issue 2 triggers; internal waits need engineering nudges.',
              ],
            },
            {
              title: 'C. Team lead weekly stale queue review',
              detail: [
                'Explore report: all tickets tagged stale_ticket or exceeding nudge threshold',
                '15-minute weekly review in EMEA huddle — assign owner or close loop',
                'Why: Automation surfaces problems; humans resolve policy edge cases.',
              ],
            },
          ],
          implementation: [
            ['Define thresholds', 'Week 1', 'Agree P1/P2 vs P3/P4 timings with EMEA leads', 'None'],
            ['Build automations', 'Week 2', 'Sandbox automations; internal email only', 'None'],
            ['Pilot', 'Week 3–4', 'EMEA enterprise queue only', 'None — internal notifications'],
            ['Roll out', 'Week 5+', 'All EMEA; add on_hold_reason field', 'Positive — faster responses'],
          ],
          safeguards: [
            'No customer-facing emails from nudge automations — internal only',
            'Snooze macro for agents with documented reason (e.g. "customer on holiday until Monday")',
            'Nudges suppress if assignee added internal note within threshold window',
          ],
          metrics: [
            ['Tickets open >5 days no activity', 'Explore: count by priority', 'Baseline now', 'Reduce 30%'],
            ['Mean on-hold age', 'Explore: avg hours in on-hold status', 'Baseline now', 'Reduce 20%'],
            ['Customer chase messages', 'Tag or text search "any update|follow up|still waiting"', 'Monthly count', 'Reduce 25%'],
            ['SLA breach on stale tickets', 'Breaches where ticket had stale_ticket tag in prior 48h', 'Baseline', 'Reduce 35%'],
          ],
        }),

];

export const proposalPriority = [
  h1('Recommended Priority Order'),
  table(
    ['Priority', 'Issue', 'Effort', 'Impact', 'Rationale'],
    [
      ['P1', 'Supplier escalation reopen (Issue 2)', 'Medium', 'High', 'Direct customer wait; JIRA regression; agent trust'],
      ['P1', 'Duplicate tickets (Issue 1)', 'Medium', 'High', 'Data quality + customer experience'],
      ['P2', 'Stale ticket nudges (Issue 3)', 'Low', 'Medium', 'Quick win; complements Issue 2'],
    ],
  ),
  spacer(),
];

export const proposalTail = [
  h1('Governance and Ownership'),
  table(
    ['Area', 'Owner', 'Cadence'],
    [
      ['Zendesk trigger and automation changes', 'Support Ops + Zendesk Admin', 'Change window: Tue/Thu only'],
      ['EMEA agent adoption and coaching', 'EMEA Team Lead', 'Weekly huddle'],
      ['Supplier escalation playbook', 'EMEA Team Lead + Escalation SMEs', 'Updated each pilot phase'],
      ['TAM reporting and dashboards', 'TAM Lead + Ops', 'Monthly review'],
      ['Success metrics', 'Team Lead + Ops Analytics', '30 / 60 / 90-day review'],
    ],
  ),
  spacer(),
  h1('30 / 60 / 90-Day Rollout Summary'),
  h3('Days 1–30: Discover and design'),
  bullet('Capture all baselines in this document'),
  bullet('Complete duplicate ticket audit and supplier path mapping'),
  bullet('Sandbox pilots for follow-up-on-closed and supplier shadow triggers'),
  bullet('Agree stale ticket nudge thresholds with EMEA leads'),
  h3('Days 31–60: Pilot in EMEA'),
  bullet('Go live: supplier reopen triggers (one category) + duplicate suggestions'),
  bullet('Enable stale nudge automations on enterprise queue'),
  h3('Days 61–90: Scale and measure'),
  bullet('Full EMEA roll-out for Issues 1 and 2'),
  bullet('Stale nudge automations across all EMEA queues; Explore dashboards live'),
  bullet('90-day metrics review with leadership — continue, adjust, or stop'),
  spacer(),
  h1('Conclusion'),
  p(
    'The two issues I observed directly — duplicate customer tickets and supplier escalation updates not reopening parent tickets — are solvable within Zendesk without a major platform change. They require disciplined email hygiene, clear escalation standards, and automations that replicate behaviour agents trusted in JIRA.',
  ),
  p(
    'The additional proposal — stale ticket nudges — strengthens queue hygiene and proactive follow-up. All three can be introduced in phased, internal-first pilots with individual rollback controls and clear success metrics.',
  ),
  p(
    'None of these changes require customers to learn a new process. The improvements are felt as faster, more coherent support — one ticket number per issue, timely updates when suppliers respond, and TAMs who engage before escalations land on an executive\'s desk.',
  ),
];

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const doc = new Document({
    title: 'Zendesk Tooling Improvement Proposal',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      {
        children: [
          ...proposalCover,
          ...proposalExecSummary,
          ...proposalIssues,
          ...proposalPriority,
          ...proposalTail,
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`Created: ${outPath}`);
}
