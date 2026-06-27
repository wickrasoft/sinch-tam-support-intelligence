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
  ShadingType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'Scenario-3-TAM-Sales-Conflict.docx');

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 160 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } });
const h3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 } });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, ...o })] });
const bullet = (t, l = 0) => new Paragraph({ text: t, bullet: { level: l }, spacing: { after: 70 } });
const spacer = () => new Paragraph({ spacing: { after: 80 } });

function dialogue(speaker, line) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${speaker}: `, bold: true, size: 22 }),
      new TextRun({ text: line, size: 22, italics: true }),
    ],
  });
}

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

const doc = new Document({
  title: 'Scenario 3 — TAM vs Sales Conflict',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Roleplay Scenario 3', bold: true, size: 40 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Conflict with the Sinch Sales Team', size: 30, color: '2E5090' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'TAM Team Lead · Collaborative Resolution Notes & Sample Script', size: 22, color: '666666' })],
      }),

      h1('Part 1 — Scenario setup'),
      h2('Context'),
      p('Sinch Sales sells messaging products: SMS, 10DLC, Conversation API, Voice, and Numbers. TAMs own post-sale technical success, support health, escalations, and QBRs. Conflict typically appears when revenue pressure meets technical and operational reality.'),
      h2('Example trigger (roleplay scenario)'),
      p('Sales has promised a customer a 10DLC campaign go-live in 2 weeks and a Conversation API WhatsApp launch in 30 days. The TAM knows registration, brand vetting, and carrier approval typically take 6–8 weeks. Support is already handling delivery issues on the same account.'),
      p('Sales told the customer "the TAM will sort it" without looping the TAM in. The customer escalates. Sales blames Support/TAM for "slowing the deal." The TAM feels set up to fail.'),
      h2('Your objective as EMEA Team Lead / TAM lead'),
      table(
        ['Do', 'Don\'t'],
        [
          ['Protect the customer outcome', 'Take sides publicly ("Sales always overpromises")'],
          ['Align TAM and Sales on one story to the customer', 'Let conflict reach the customer unresolved'],
          ['Turn conflict into a repeatable process', 'Win the argument in the meeting'],
          ['Separate people from process gaps', 'Escalate to execs before trying direct resolution'],
        ],
      ),
      spacer(),
      p('North star: We are one Sinch team in front of the customer — different roles, same goal: successful adoption, renewal, and expansion.', { bold: true }),

      h1('Part 2 — Step-by-step resolution framework'),
      h2('Step 1: Pause and gather facts (before the joint meeting)'),
      h3('With the TAM (private, 30 minutes)'),
      bullet('What was promised, by whom, to whom, and when?'),
      bullet('What is technically/operationally true? (10DLC timelines, API dependencies, open tickets)'),
      bullet('What is the customer impact if we miss the date?'),
      bullet('What does the TAM need from Sales? (realistic dates, joint call, no solo commitments)'),
      h3('With Sales (private, 30 minutes)'),
      bullet('What is the commercial pressure? (renewal, upsell, competitive threat)'),
      bullet('What did the customer hear? (get exact wording if possible)'),
      bullet('What does Sales need from TAM? (credibility on the call, technical validation, exec presence)'),
      p('Output: A short fact sheet — no opinions. Customer, products, promised dates, actual readiness, open risks, renewal date.', { bold: true }),

      h2('Step 2: Reframe the conflict'),
      table(
        ['Sales lens', 'TAM lens', 'Shared goal'],
        [
          ['Close / retain revenue', 'Prevent outage, bad launch, exec escalation', 'Customer trusts Sinch long-term'],
          ['Speed to market', 'Quality, compliance, support capacity', 'Successful go-live and adoption'],
          ['Relationship owner', 'Technical truth-teller', 'One credible Sinch voice'],
        ],
      ),
      spacer(),
      p('Say in the room: "We\'re not arguing about who\'s right — we\'re aligning on what we can commit to the customer without damaging the relationship or the renewal."', { italics: true }),

      h2('Step 3: Joint meeting with Sales + TAM (60 minutes)'),
      p('Attendees: Account AE, Sales Manager (if needed), TAM, Team Lead. Optional: Support/Ops if support health is part of the dispute.'),
      bullet('Customer outcome (5 min) — What does success look like in 90 days?'),
      bullet('Facts (10 min) — Present fact sheet; no blame'),
      bullet('Gap (10 min) — Promised vs achievable; name it plainly'),
      bullet('Options (20 min) — Phased plan (see Step 4)'),
      bullet('Customer communication (10 min) — Who says what, when'),
      bullet('Process fix (5 min) — What we change so this doesn\'t repeat'),
      p('Ground rules: No interrupting. Critique process, not character. Decisions recorded before anyone leaves.', { bold: true }),

      h2('Step 4: Propose collaborative options'),
      h3('Option A — Phased go-live (recommended)'),
      bullet('Week 2: SMS on existing approved routes (if available)'),
      bullet('Week 4–6: 10DLC brand/campaign submitted; interim use case on approved traffic'),
      bullet('Week 6–8: Full 10DLC live; Conversation API per provisioning timeline'),
      h3('Option B — Scope reduction'),
      bullet('Launch one product first (e.g. SMS only); defer WhatsApp until provisioning complete'),
      h3('Option C — Executive alignment call'),
      bullet('Only if customer threatens churn; AE + TAM + Sales Director with one timeline slide'),
      p('TAM contributes: technical truth, risk flags, support backlog. Sales contributes: commercial framing, customer sensitivity. You facilitate: pick one option and own the unified message.'),

      h2('Step 5: Unified customer communication'),
      bullet('Acknowledge the customer\'s goals'),
      bullet('Present realistic timeline with milestones'),
      bullet('Explain why (compliance, carrier rules) without blaming internal teams'),
      bullet('Offer interim value (test traffic, staging, partial launch)'),
      bullet('Name single point of contact per workstream (Sales = commercial; TAM = technical success)'),
      p('Example: "Sinch Sales and your Technical Account Manager have aligned on a phased plan so you go live safely and stay compliant on 10DLC — here are the dates we\'re committing to."', { italics: true }),

      h2('Step 6: Fix the process'),
      table(
        ['Rule', 'Owner'],
        [
          ['No delivery dates on 10DLC / WhatsApp / new markets without TAM or Solutions sign-off', 'Sales'],
          ['TAM looped on all enterprise deals 30 days before close or renewal', 'Sales Ops / AE'],
          ['Shared account plan in CRM (products, dates, risks, open tickets)', 'TAM + AE'],
        ],
      ),

      h1('Part 3 — Key phrases for the roleplay'),
      bullet('Opening: "I want us aligned before we go back to the customer. Help me understand what was committed and what\'s at stake commercially."'),
      bullet('To Sales: "I understand the renewal is in Q3 and speed matters. I also need us to protect credibility — if we miss this date again, we lose more than we gain."'),
      bullet('To TAM: "I hear you felt blindsided. That\'s on process, not on you. I need your best phased plan by tomorrow so Sales can sell it confidently."'),
      bullet('De-escalating: "Let\'s park who said what internally. The customer needs one Sinch plan today."'),
      bullet('Closing: "We\'re agreed: phased launch, joint customer call Thursday, AE owns commercial thread, TAM owns technical milestones. I\'ll document this and share with both managers."'),

      h1('Part 4 — Red flags and escalation'),
      p('Escalate to Sales Director + TAM/CS leadership only if:'),
      bullet('Repeated overpromising on the same account after process agreement'),
      bullet('Customer exec escalation imminent and teams still misaligned'),
      bullet('Ethical/compliance risk (e.g. sending before 10DLC approval)'),
      bullet('Personal hostility blocking any agreement'),
      p('Escalation frame: "We need a decision on risk appetite — not a referee for personalities."', { italics: true }),

      h1('Part 5 — Success criteria'),
      bullet('Customer receives one aligned plan within 48 hours'),
      bullet('No public blame between Sales and TAM in front of customer or internal channels'),
      bullet('TAM included in future deal/renewal conversations for that account'),
      bullet('Process change documented (even if lightweight)'),
      bullet('Relationship between AE and TAM restored — e.g. joint QBR prep'),

      h1('Part 6 — Sinch-specific talking points'),
      bullet('10DLC / A2P compliance — Sales cannot compress carrier/regulatory timelines; TAM/Solutions validates'),
      bullet('Conversation API — WhatsApp/RCS provisioning is multi-step; TAM tracks provisioning status'),
      bullet('Support health — Open P1/P2 or SLA issues undermine expansion; TAM shares portfolio view before upsell'),
      bullet('EMEA — Time zones, local carriers, GDPR/data residency; TAM bridges Sales promises and regional reality'),

      h1('Part 7 — One-page cheat sheet'),
      bullet('1. Listen separately → fact sheet'),
      bullet('2. Joint meeting → customer outcome first'),
      bullet('3. Offer phased options (not win/lose)'),
      bullet('4. One voice to customer'),
      bullet('5. Process fix: sign-off + early TAM loop-in'),
      bullet('6. Document + follow up in 1 week'),

      h1('Part 8 — Sample roleplay script'),
      p('Setting: EMEA Team Lead facilitates a 20-minute internal alignment call. Present: Sarah (Account Executive, Sales), James (TAM), You (Team Lead). Account: Nexus Financial Group — enterprise banking customer. Products: SMS, 10DLC, Conversation API WhatsApp.', { italics: true }),
      spacer(),

      h2('Scene 1 — Opening (Team Lead)'),
      dialogue('Team Lead', 'Thanks both for joining at short notice. Nexus escalated yesterday — their CTO emailed our VP. I\'m not here to assign blame. I need us aligned on one plan we can take to the customer within 48 hours. Sarah, can you start with what was committed commercially?'),
      spacer(),

      h2('Scene 2 — Sales perspective'),
      dialogue('Sarah (AE)', 'I told them we could have 10DLC live in two weeks and WhatsApp on Conversation API within 30 days. Their renewal is in September and Twilio is in the room. If we walk back those dates without a credible plan, we lose the expansion and maybe the renewal.'),
      dialogue('Team Lead', 'Understood — the commercial stakes are real. James, help me with what\'s technically true today.'),
      spacer(),

      h2('Scene 3 — TAM perspective'),
      dialogue('James (TAM)', 'I wasn\'t on the call when those dates were promised. Brand registration alone is typically four to six weeks. We also have two open P2 tickets on SMS delivery — same account. If we rush 10DLC before brand approval, we risk compliance issues and the customer gets blocked by carriers anyway.'),
      dialogue('Sarah (AE)', 'But the customer thinks we\'re dragging our feet. They said Support is slow and now TAM is adding more delays.'),
      dialogue('Team Lead', 'Let\'s park who said what to the customer internally. James — I hear you felt blindsided. That\'s a process gap we\'ll fix. What can we credibly commit to in phases?'),
      spacer(),

      h2('Scene 4 — Collaborative solution'),
      dialogue('James (TAM)', 'Week one we can confirm their existing SMS routes and close the P2 delivery issues — that\'s a quick win. Week two we submit 10DLC brand and campaign with their legal team. Realistic full 10DLC go-live is week six to eight depending on carrier approval. WhatsApp on Conversation API — provisioning is a separate track, earliest credible date is week ten if they complete Meta business verification this week.'),
      dialogue('Sarah (AE)', 'Can we say week six for 10DLC externally? I need something stronger than "eight weeks maybe."'),
      dialogue('Team Lead', 'We say week six as target with week eight as contingency — and we explain carrier approval is outside our control but we\'ll manage the submission within 48 hours. Sarah, you frame the commercial value of phased launch. James, you own the technical milestones. I\'ll join the customer call so they hear one Sinch voice.'),
      dialogue('Sarah (AE)', 'That works if we\'re on the call together. I don\'t want to sell it alone again.'),
      dialogue('James (TAM)', 'Agreed. And I need to be on the next proposal before dates go into a deck.'),
      spacer(),

      h2('Scene 5 — Customer communication agreement'),
      dialogue('Team Lead', 'Customer call Thursday 10:00. Sarah opens — commercial partnership and renewal intent. James presents the phased technical plan. I close with our shared commitment. One slide, one timeline. No mention of internal misalignment.'),
      dialogue('Sarah (AE)', 'I\'ll draft the customer email tonight and share with James for technical review before it goes out.'),
      dialogue('James (TAM)', 'I\'ll send the P2 delivery update and 10DLC submission checklist by tomorrow morning.'),
      spacer(),

      h2('Scene 6 — Process fix and close'),
      dialogue('Team Lead', 'Before we drop — three process changes. One: no 10DLC or WhatsApp dates in proposals without TAM or Solutions sign-off. Two: TAM on all enterprise deals 30 days before renewal. Three: shared account plan in CRM — products, dates, risks, open tickets. I\'ll document today\'s agreement and send to both your managers. Any objections?'),
      dialogue('Sarah (AE)', 'No objections. I\'ll talk to my manager about the sign-off rule.'),
      dialogue('James (TAM)', 'Good with me. Thanks for backing the phased approach instead of asking us to magic a two-week 10DLC.'),
      dialogue('Team Lead', 'That\'s the job — protect the customer and the renewal by telling the truth together. Speak Thursday prep at 09:30.'),
      spacer(),

      h1('Part 9 — Facilitator notes for practicing the roleplay'),
      h3('If you are playing the Team Lead'),
      bullet('Stay neutral in tone — slow down if either side gets defensive'),
      bullet('Redirect blame to process: "That\'s a gap we\'ll fix"'),
      bullet('Always move toward a customer deliverable within 48 hours'),
      bullet('End with written agreements, not verbal handshakes'),
      h3('If you are playing Sales (Sarah)'),
      bullet('Show real commercial pressure — don\'t be a caricature'),
      bullet('Be willing to concede process fixes if you get a credible customer story'),
      h3('If you are playing TAM (James)'),
      bullet('Be firm on compliance/timelines but offer phased alternatives, not just "no"'),
      bullet('Name the blindside once, then move to solutions'),
      h3('Timing'),
      bullet('Full script read-through: approximately 15–20 minutes'),
      bullet('Add 10 minutes for interviewer questions on "what would you do differently if the customer refused phased launch?"'),

      h1('Part 10 — Follow-up question prep'),
      p('Be ready to answer:'),
      bullet('What if Sales refuses the sign-off process? → Pilot on enterprise tier, show one near-miss as evidence, escalate with data not emotion'),
      bullet('What if the TAM was wrong and 2 weeks was achievable? → Fact sheet prevents this; Solutions validates before the joint meeting'),
      bullet('What if the customer only accepts the original dates? → Exec call, scope reduction, or explicit risk acceptance documented in writing'),
      bullet('How do you rebuild trust between AE and TAM long-term? → Joint QBR prep, shared wins celebrated, monthly 15-min account sync'),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
