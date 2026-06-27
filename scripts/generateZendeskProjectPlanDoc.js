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
const outPath = path.join(__dirname, '..', 'Zendesk-Improvement-Project-Plan.docx');

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
const h3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 100 } });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, ...o })] });
const step = (n, t) => new Paragraph({
  spacing: { after: 80 },
  children: [
    new TextRun({ text: `Step ${n}: `, bold: true, size: 22 }),
    new TextRun({ text: t, size: 22 }),
  ],
});
const bullet = (t, l = 0) => new Paragraph({ text: t, bullet: { level: l }, spacing: { after: 60 } });
const spacer = () => new Paragraph({ spacing: { after: 80 } });

function table(headers, rows) {
  const all = [headers, ...rows];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: all.map((cells, ri) =>
      new TableRow({
        children: cells.map((text) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: ri === 0, size: 20 })] })],
            shading: ri === 0 ? { fill: 'D9E2F3', type: ShadingType.CLEAR } : undefined,
          }),
        ),
      }),
    ),
  });
}

function projectHeader(meta) {
  return [
    table(
      ['Field', 'Detail'],
      [
        ['Project name', meta.name],
        ['Issue', meta.issue],
        ['Priority', meta.priority],
        ['Project owner', meta.owner],
        ['Duration', meta.duration],
        ['Dependencies', meta.dependencies],
        ['Customer impact', meta.customerImpact],
      ],
    ),
    spacer(),
  ];
}

function phaseBlock(phaseName, weeks, goal, steps, deliverables) {
  return [
    h3(`${phaseName} (${weeks})`),
    p(`Goal: ${goal}`, { italics: true }),
    ...steps.map((s, i) => step(i + 1, s)),
    p('Deliverables:', { bold: true }),
    ...deliverables.map((d) => bullet(d)),
    spacer(),
  ];
}

function issueProject({ number, title, problem, meta, phases, successCriteria, rollback }) {
  return [
    h1(`Project ${number}: ${title}`),
    h2('Problem statement'),
    p(problem),
    h2('Project overview'),
    ...projectHeader(meta),
    h2('Step-by-step implementation plan'),
    ...phases.flatMap((ph) => phaseBlock(ph.name, ph.weeks, ph.goal, ph.steps, ph.deliverables)),
    h2('Success criteria (exit gates)'),
    ...successCriteria.map((s) => bullet(s)),
    h2('Rollback plan'),
    ...rollback.map((r) => bullet(r)),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: '—'.repeat(40), color: 'CCCCCC' })],
      spacing: { after: 200 },
    }),
  ];
}

export const planCover = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Zendesk Tooling Improvement', bold: true, size: 40 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Step-by-Step Project Plan', size: 30, color: '2E5090' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'EMEA Team Lead · Five Implementation Projects', size: 22, color: '666666' })],
  }),
];

export const planMain = [
      h1('Program overview'),
      p('This document defines three discrete implementation projects to address Zendesk friction points identified in the first 30 days as EMEA Team Lead. Each project follows the same structure: problem statement, project metadata, phased step-by-step plan, deliverables, success criteria, and rollback plan.'),
      p('Projects are designed to run in parallel where possible, with explicit dependencies noted. No project requires customers to change how they submit or receive support.'),
      h2('Program timeline'),
      table(
        ['Project', 'Priority', 'Weeks 1–4', 'Weeks 5–8', 'Weeks 9–12'],
        [
          ['P1 — Supplier escalation reopen', 'Critical', 'Discover + Design + Shadow', 'Live pilot + Roll out', 'Scale + Measure'],
          ['P2 — Duplicate ticket prevention', 'Critical', 'Discover + Design', 'Pilot + Roll out', 'Optimise + Measure'],
          ['P3 — Stale ticket nudges', 'High', 'Design + Build', 'Pilot + Roll out', 'Measure'],
        ],
      ),
      spacer(),
      h2('Program roles'),
      table(
        ['Role', 'Responsibility'],
        [
          ['EMEA Team Lead', 'Project sponsor, agent coaching, acceptance sign-off'],
          ['Zendesk Admin', 'Configuration, triggers, automations, sandbox testing'],
          ['Support Ops', 'Process documentation, change management, metrics'],
          ['Escalation SMEs', 'Supplier playbook, allowlist, false-positive review'],
          ['Ops Analytics', 'Baselines, Explore reports, 30/60/90-day reviews'],
        ],
      ),
      spacer(),

      ...issueProject({
        number: 1,
        title: 'Supplier Escalation Reopen Automation',
        problem: 'When a supplier responds to an escalation (carrier, aggregator, platform vendor), the parent customer Zendesk ticket does not reopen or notify the assignee. This is a regression from JIRA where supplier updates auto-transitioned the parent issue. Agents must manually poll side conversations, causing delayed customer updates.',
        meta: {
          name: 'Supplier Escalation Reopen Automation',
          issue: 'Supplier updates do not surface on parent Zendesk ticket',
          priority: 'P1 — Critical',
          owner: 'EMEA Team Lead + Zendesk Admin',
          duration: '10 weeks',
          dependencies: 'None — start immediately',
          customerImpact: 'None during implementation; positive after go-live (faster updates)',
        },
        phases: [
          {
            name: 'Phase 1 — Discover',
            weeks: 'Week 1–2',
            goal: 'Map every supplier escalation path and document the JIRA-to-Zendesk gap.',
            steps: [
              'Schedule 45-minute interviews with 8–10 experienced EMEA agents. Ask: How do you escalate to suppliers today? What broke after JIRA?',
              'Export last 90 days of tickets tagged or noted as supplier escalations. Count volume by supplier type (carrier, platform, numbering, other).',
              'For each of the top 10 suppliers by volume, document: entry method (side conversation, child ticket, personal email), average response time, and whether parent ticket is updated today.',
              'Request JIRA workflow documentation from ops — identify the exact rules that fired on supplier update (status change, notification, assignee).',
              'List all supplier email domains and portal systems. Create draft supplier allowlist spreadsheet.',
              'Identify auto-acknowledgement email patterns (subject/body regex) to exclude from reopen triggers.',
              'Present findings to Zendesk Admin and Escalation SMEs. Agree scope for pilot supplier category (recommend: carrier escalations first).',
            ],
            deliverables: [
              'Supplier escalation path map (top 10 suppliers)',
              'JIRA vs Zendesk gap analysis (1-page)',
              'Draft supplier domain allowlist',
              'Auto-ack regex list',
              'Signed scope for pilot category',
            ],
          },
          {
            name: 'Phase 2 — Design',
            weeks: 'Week 3',
            goal: 'Write complete trigger specifications and agent playbook before any production change.',
            steps: [
              'Agree standard escalation model: Side Conversation (email suppliers) OR Child ticket (formal SLAs) — one model per supplier category, documented.',
              'Define custom fields: supplier_name (dropdown), supplier_ticket_id (text), escalation_opened_at (date), escalation_type (dropdown).',
              'Write trigger spec #1 — Side conversation inbound: conditions, exclusions, parent actions (status, note, notify).',
              'Write trigger spec #2 — Child ticket update: same parent actions.',
              'Design custom status "Supplier Responded" (optional) or use Open status with tag supplier_update_received.',
              'Draft macro "Start supplier escalation" — sets fields, opens side conversation with template, sets On-hold, applies tag supplier_escalation.',
              'Draft macro "Supplier noise — keep on hold" — removes false-positive tag, resets status, documents reason.',
              'Define shadow-mode logging: trigger adds internal note "SHADOW: would have reopened parent" without status change.',
              'Zendesk Admin reviews specs in change advisory. Schedule sandbox build for Week 4.',
            ],
            deliverables: [
              'Trigger specification document (signed off)',
              'Custom field definitions',
              'Two agent macros (draft)',
              'Updated escalation playbook (draft)',
              'Sandbox test plan',
            ],
          },
          {
            name: 'Phase 3 — Build and shadow pilot',
            weeks: 'Week 4–5',
            goal: 'Build in sandbox, then run shadow mode in production — log only, no ticket changes.',
            steps: [
              'Zendesk Admin creates custom fields in sandbox. Validate on test tickets.',
              'Build triggers in sandbox. Test with sample supplier emails (use test mailboxes).',
              'Verify false-positive cases: auto-ack, out-of-office, internal forwards — must NOT fire.',
              'Promote fields and triggers to production in SHADOW mode (internal note only, no status change).',
              'Notify EMEA agents: "Shadow mode live — no workflow change yet."',
              'Run shadow mode for minimum 10 business days. Log every fire event in shared spreadsheet.',
              'Daily review (15 min): assignee + SME classify each shadow event as true positive or false positive.',
              'Calculate false-positive rate. Target: <10% before proceeding. Tune regex and conditions if needed.',
              'Team Lead sign-off to proceed to live pilot.',
            ],
            deliverables: [
              'Sandbox test results log',
              'Shadow mode event log (10+ days)',
              'False-positive rate report',
              'Tuned trigger conditions',
              'Go/no-go decision record',
            ],
          },
          {
            name: 'Phase 4 — Live pilot',
            weeks: 'Week 6–7',
            goal: 'Enable parent reopen and assignee notification for one supplier category in EMEA.',
            steps: [
              'Select pilot: carrier escalations only (highest volume, email-based, clear allowlist).',
              'Enable live triggers for carrier domain allowlist only. Other suppliers remain manual.',
              'Publish updated escalation playbook v1.0. 30-minute EMEA team huddle walkthrough.',
              'Post quick-reference card in team channel: "Starting carrier escalation" → use macro → expect parent reopen on supplier reply.',
              'Monitor pilot daily for first 5 days: review every triggered ticket with assignee.',
              'Collect agent feedback at Day 3 and Day 7 via 3-question form.',
              'Measure: median time from supplier inbound to parent action. Compare to shadow-mode baseline.',
              'Address any false positives immediately — disable single trigger if needed, not whole project.',
              'Pilot sign-off at end of Week 7 if metrics and feedback acceptable.',
            ],
            deliverables: [
              'Live pilot enabled (carrier category)',
              'Playbook v1.0 published',
              'Agent training complete (attendance log)',
              'Week 1 pilot metrics report',
              'Pilot sign-off or remediation list',
            ],
          },
          {
            name: 'Phase 5 — Roll out and scale',
            weeks: 'Week 8–10',
            goal: 'Extend to all EMEA supplier categories and align with US/APAC.',
            steps: [
              'Add remaining supplier domains to allowlist by category (platform, numbering, other).',
              'Enable child-ticket triggers if used for formal supplier SLAs.',
              'For portal suppliers: scope webhook integration (Phase 5b sub-project if needed).',
              'Roll out to all EMEA agents. Update macros in production.',
              'Share playbook and lessons learned with US/APAC team leads — 60-minute alignment session.',
              'Run 30-day measurement against success criteria (see below).',
              'Ops Analytics produces Explore dashboard: supplier escalation MTTR, reopen accuracy.',
              'Program retrospective: what worked, what to tune, documentation finalised.',
            ],
            deliverables: [
              'Full EMEA roll-out complete',
              'US/APAC alignment session delivered',
              'Explore dashboard live',
              '30-day metrics report',
              'Playbook v2.0 (final)',
            ],
          },
        ],
        successCriteria: [
          'Median time supplier reply → parent ticket action reduced by 70% (e.g. 24h to <4h)',
          'Missed supplier updates (audit sample) reduced by 80%',
          'False-positive reopen rate below 10%',
          'Agent survey: 75%+ agree "supplier updates are easier to track than before"',
          'MTTR on supplier_escalation tagged tickets reduced by 15%',
        ],
        rollback: [
          'Each trigger can be disabled independently in Zendesk Admin',
          'Disable live triggers → revert to manual process; playbook documents fallback',
          'Custom fields remain (no harm); status values can be hidden',
          'Rollback decision within 2 hours if critical false-positive spike',
        ],
      }),

      ...issueProject({
        number: 2,
        title: 'Duplicate Ticket Prevention',
        problem: 'When customers reply on the same issue — especially after solve/close or via a different email/subject — Zendesk creates a new ticket instead of threading to the original. Agents duplicate work, customers get multiple ticket numbers, and metrics are distorted.',
        meta: {
          name: 'Duplicate Ticket Prevention',
          issue: 'Customer replies create duplicate Zendesk tickets',
          priority: 'P1 — Critical',
          owner: 'EMEA Team Lead + Zendesk Admin',
          duration: '10 weeks',
          dependencies: 'Can run parallel with Project 1',
          customerImpact: 'Minor — clearer ticket IDs in email subjects after Week 6',
        },
        phases: [
          {
            name: 'Phase 1 — Discover and baseline',
            weeks: 'Week 1–2',
            goal: 'Quantify duplicate volume and identify root causes in EMEA.',
            steps: [
              'Export all EMEA tickets from last 90 days.',
              'Run duplicate analysis: same organization + same requester + created within 7 days + similar subject (script or Excel). Record count and % of total volume.',
              'Sample 30 duplicate clusters manually. Classify root cause: closed-ticket reply, email threading break, different channel, different email address, CC duplicate, other.',
              'Audit Zendesk setting: Admin → Tickets → "Allow follow-ups on closed tickets" — record current value.',
              'Audit all inbound support email addresses and forwarding rules for EMEA brands.',
              'Review outbound email templates — check if ticket ID is preserved in subject line.',
              'Interview 5 agents: "When do duplicates happen most?" Document examples.',
              'Present root cause breakdown to Zendesk Admin. Prioritise fixes by frequency.',
            ],
            deliverables: [
              'Duplicate rate baseline (% merged within 48h / new tickets)',
              'Root cause breakdown chart',
              'Email channel audit document',
              'Current closed-ticket policy record',
              'Prioritised fix list',
            ],
          },
          {
            name: 'Phase 2 — Design',
            weeks: 'Week 3',
            goal: 'Define follow-up policy, duplicate triggers, and email template changes.',
            steps: [
              'Agree closed-ticket follow-up policy: ≤7 days + same org + same requester → reopen; >7 days → linked follow-up ticket.',
              'Write trigger spec: on new ticket created → check open/pending/on-hold tickets same org+requester in 14 days → add internal note + tag possible_duplicate + notify existing assignee.',
              'Define custom field issue_reference (text) for enterprise accounts.',
              'Draft updated email templates: subject format [Ticket #{{ticket.id}}] {{ticket.title}} for all outbound notifications.',
              'Draft customer-facing line for solved email: "Reply to this email to continue case #{{ticket.id}}."',
              'Define merge policy: phase 1 suggest-only; phase 2 auto-merge when Message-ID headers match.',
              'Identify enterprise accounts requiring manual merge review (TAM-managed list).',
              'Zendesk Admin signs off design. Schedule sandbox build.',
            ],
            deliverables: [
              'Follow-up policy document',
              'Duplicate detection trigger spec',
              'issue_reference field definition',
              'Updated email template drafts',
              'Merge policy (phased)',
              'TAM-managed account exclusion list',
            ],
          },
          {
            name: 'Phase 3 — Sandbox pilot',
            weeks: 'Week 4',
            goal: 'Test all changes in sandbox with real email scenarios.',
            steps: [
              'Enable follow-up-on-closed in sandbox with agreed policy.',
              'Create issue_reference field on enterprise form in sandbox.',
              'Build duplicate detection trigger in sandbox (suggest-only mode).',
              'Update email templates in sandbox.',
              'Test scenario 1: reply to solved ticket within 7 days → must reopen original.',
              'Test scenario 2: reply to solved ticket after 14 days → must create linked follow-up.',
              'Test scenario 3: new ticket same subject same org → must add possible_duplicate note.',
              'Test scenario 4: reply with ticket ID in subject → must thread correctly.',
              'Test scenario 5: reply from different email same org → document behaviour, tune if needed.',
              'Fix any failures. Document test results. Go/no-go for production pilot.',
            ],
            deliverables: [
              'Sandbox test script (5 scenarios)',
              'Test results log (pass/fail)',
              'Configuration export from sandbox',
              'Go/no-go record',
            ],
          },
          {
            name: 'Phase 4 — Production pilot',
            weeks: 'Week 5–6',
            goal: 'Roll out to one EMEA pod with suggest-only duplicate detection.',
            steps: [
              'Enable follow-up-on-closed policy in production.',
              'Deploy issue_reference field on enterprise ticket forms.',
              'Enable duplicate detection trigger (suggest-only — NO auto-merge).',
              'Update production email templates (coordinate with comms if customer-facing).',
              'Brief pilot pod (one team, ~5 agents) in 15-minute huddle. Distribute quick-reference card.',
              'Pilot pod runs for 2 weeks. Team Lead reviews every possible_duplicate tag daily.',
              'Track: how many suggestions were correct? How many merges performed? Any missed duplicates?',
              'Collect agent feedback. Tune subject matching threshold if too many false positives.',
              'Expand to full EMEA at end of Week 6 if pilot successful.',
            ],
            deliverables: [
              'Production config live (pilot pod)',
              'Email templates updated',
              'Agent quick-reference card',
              '2-week pilot review report',
              'Full EMEA expansion approval',
            ],
          },
          {
            name: 'Phase 5 — Optimise',
            weeks: 'Week 7–10',
            goal: 'Enable high-confidence auto-merge and measure 90-day targets.',
            steps: [
              'Analyse pilot data: identify cases where Message-ID / In-Reply-To headers are reliable.',
              'Build auto-merge trigger for high-confidence cases only (header match + same org + same requester).',
              'Exclude TAM-managed accounts from auto-merge — suggest only.',
              'Enable auto-merge in production. Monitor first 72 hours intensively.',
              'Add weekly duplicate review to EMEA huddle (5 min) for first month.',
              'Ops Analytics runs 90-day duplicate rate report vs baseline.',
              'Document final configuration in ops wiki.',
              'Close project with retrospective and handover to BAU support ops.',
            ],
            deliverables: [
              'Auto-merge trigger (high-confidence only)',
              '90-day metrics report vs baseline',
              'Ops wiki documentation',
              'Project closure report',
            ],
          },
        ],
        successCriteria: [
          'Duplicate ticket rate reduced by 40% vs 90-day baseline',
          'Customer complaints about "new ticket number for same issue" near zero',
          'Repeat handle time on duplicate clusters reduced by 25%',
          'Auto-merge false-positive rate below 5%',
          'Agent pulse survey shows improved duplicate frustration score',
        ],
        rollback: [
          'Disable duplicate detection trigger — immediate, no data loss',
          'Revert follow-up policy to previous setting in Admin',
          'Revert email templates to prior versions (keep archived copies)',
          'Auto-merge disable does not affect already-merged tickets',
        ],
      }),

      ...issueProject({
        number: 3,
        title: 'Stale and On-Hold Ticket Nudges',
        problem: 'Tickets in Pending or On-hold sit without activity for days. No systematic reminder reaches the assignee, team lead, or TAM until the customer chases or SLA breaches. Especially problematic for supplier-dependent and internal-engineering waits.',
        meta: {
          name: 'Stale and On-Hold Ticket Nudges',
          issue: 'Silent tickets with no automated internal reminders',
          priority: 'P2 — High',
          owner: 'EMEA Team Lead + Zendesk Admin',
          duration: '6 weeks',
          dependencies: 'Benefits from Project 1 (supplier reopen); can start Week 1 in parallel',
          customerImpact: 'None — internal notifications only',
        },
        phases: [
          {
            name: 'Phase 1 — Define thresholds',
            weeks: 'Week 1',
            goal: 'Agree time thresholds and on-hold reason taxonomy.',
            steps: [
              'Review current EMEA queue data: average time in Pending and On-hold by priority (P1/P2 vs P3/P4).',
              'Propose nudge thresholds: P1/P2 at 24h/48h/72h; P3/P4 at 48h/72h/5 days.',
              'Workshop with 4 agents and 2 team leads: validate thresholds are achievable, not noisy.',
              'Define on_hold_reason dropdown: Customer / Supplier / Internal engineering / Billing / Other.',
              'Define stale_ticket tag application rule: applied at final threshold if no activity.',
              'Agree snooze policy: agent can snooze nudges with macro + mandatory reason field.',
              'Document spec. Zendesk Admin sign-off.',
            ],
            deliverables: [
              'Nudge threshold table by priority',
              'on_hold_reason field spec',
              'Snooze macro spec',
              'Signed automation design',
            ],
          },
          {
            name: 'Phase 2 — Build automations',
            weeks: 'Week 2',
            goal: 'Create all automations in sandbox and test.',
            steps: [
              'Create on_hold_reason custom field in sandbox.',
              'Build Automation 1: P1/P2 on-hold/pending, no comment 24h → email assignee.',
              'Build Automation 2: P1/P2, no comment 48h → internal note + email assignee + CC team lead.',
              'Build Automation 3: P1/P2, no comment 72h → apply stale_ticket tag + notify TAM (enterprise orgs only).',
              'Build equivalent automations for P3/P4 with longer thresholds.',
              'Build snooze macro: sets snooze_until date field, suppresses nudges until date.',
              'Test: create test tickets, advance clocks or use manual date edits, verify each automation fires once only.',
              'Verify: customer receives NO public comments from any automation.',
              'Promote to production config (disabled state).',
            ],
            deliverables: [
              '6+ automations built and tested in sandbox',
              'Snooze macro in sandbox',
              'Test log confirming internal-only notifications',
              'Production config ready (disabled)',
            ],
          },
          {
            name: 'Phase 3 — Pilot',
            weeks: 'Week 3–4',
            goal: 'Enable on EMEA enterprise queue only.',
            steps: [
              'Enable automations for enterprise queue/group only.',
              'Add on_hold_reason to On-hold macro — agent must select reason when setting On-hold.',
              'Announce to EMEA team: "Internal nudges starting — you may receive reminders on quiet tickets."',
              'Monitor daily for 10 business days: nudge volume, agent complaints, false positives.',
              'Track: tickets tagged stale_ticket — are they genuinely neglected or valid long waits?',
              'Introduce weekly 15-min stale queue review in team huddle using Explore report.',
              'Tune thresholds if nudge volume exceeds 15% of on-hold queue per day.',
              'Pilot sign-off at end of Week 4.',
            ],
            deliverables: [
              'Automations live (enterprise queue)',
              'On-hold macro updated',
              '10-day pilot metrics',
              'Weekly stale queue review in huddle calendar',
              'Pilot sign-off',
            ],
          },
          {
            name: 'Phase 4 — Roll out and measure',
            weeks: 'Week 5–6',
            goal: 'Extend to all EMEA queues and measure impact.',
            steps: [
              'Enable automations for all EMEA support groups.',
              'Ops Analytics creates Explore report: stale_ticket count, mean on-hold age, customer chase messages.',
              'Capture 30-day baseline comparison.',
              'Add stale queue review to weekly huddle permanently (owner: rotating team lead).',
              'Document in ops wiki: thresholds, snooze policy, escalation path.',
              'Close project at Week 6 with metrics report.',
            ],
            deliverables: [
              'Full EMEA roll-out',
              'Explore stale ticket dashboard',
              '30-day impact report',
              'Ops wiki page',
            ],
          },
        ],
        successCriteria: [
          'Tickets open >5 days without activity reduced by 30%',
          'Mean on-hold age reduced by 20%',
          'Customer "any update?" chase messages reduced by 25%',
          'SLA breaches on tickets that were stale_ticket tagged in prior 48h reduced by 35%',
        ],
        rollback: [
          'Disable automations by priority tier independently',
          'Remove stale_ticket tag from automations without deleting historical tags',
          'Snooze macro remains available if automations disabled',
        ],
      }),

      h1('Program governance'),
      h2('Weekly program standup (30 minutes)'),
      bullet('Review each project RAG status (Red/Amber/Green)'),
      bullet('Blockers escalated to Zendesk Admin or Support Ops'),
      bullet('Change window: production Zendesk changes Tuesday and Thursday only'),
      bullet('All production changes documented in change log'),
      spacer(),
      h2('30 / 60 / 90-day program milestones'),
      table(
        ['Milestone', 'Day 30', 'Day 60', 'Day 90'],
        [
          ['Project 1 Supplier reopen', 'Shadow mode complete', 'Live pilot complete', 'Full EMEA roll-out + metrics'],
          ['Project 2 Duplicates', 'Sandbox pilot complete', 'Production pilot complete', 'Auto-merge + 90-day metrics'],
          ['Project 3 Stale nudges', 'Pilot complete', 'Full roll-out', '30-day impact report'],
        ],
      ),
      spacer(),
      h1('Conclusion'),
      p('Each of the three projects above is designed as a standalone implementation with clear phases, step-by-step tasks, deliverables, success criteria, and rollback plans. Projects 1 and 2 address the issues directly observed in EMEA operations. Project 3 strengthens queue hygiene and proactive follow-up on stale tickets.'),
      p('Following this plan, EMEA can deliver measurable improvement within 90 days without requiring customers to change how they contact support. The primary investment is Zendesk configuration, process documentation, and agent coaching — not new software procurement.'),
];

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const doc = new Document({
    title: 'Zendesk Improvement Project Plan',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ children: [...planCover, ...planMain] }],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`Created: ${outPath}`);
}
