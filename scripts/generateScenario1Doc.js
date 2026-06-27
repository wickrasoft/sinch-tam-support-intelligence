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
const outPath = path.join(__dirname, '..', 'Scenario-1-Major-Escalation-Nordea.docx');

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 160 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } });
const h3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 } });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, ...o })] });
const bullet = (t, l = 0) => new Paragraph({ text: t, bullet: { level: l }, spacing: { after: 70 } });
const numbered = (t) => new Paragraph({ text: t, numbering: { reference: 'steps', level: 0 }, spacing: { after: 70 } });
const spacer = () => new Paragraph({ spacing: { after: 80 } });

function table(headers, rows, widths) {
  const all = [headers, ...rows];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: all.map((cells, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        children: cells.map((text, ci) =>
          new TableCell({
            width: widths ? { size: widths[ci], type: WidthType.PERCENTAGE } : undefined,
            shading: ri === 0 ? { fill: '1B6E6E', type: ShadingType.CLEAR } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    bold: ri === 0 || ci === 0,
                    size: 19,
                    color: ri === 0 ? 'FFFFFF' : '000000',
                  }),
                ],
              }),
            ],
          }),
        ),
      }),
    ),
  });
}

const doc = new Document({
  title: 'Scenario 1 — Major Escalation (Nordea)',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  numbering: {
    config: [
      {
        reference: 'steps',
        levels: [
          { level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START },
        ],
      },
    ],
  },
  sections: [{
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Roleplay Scenario 1', bold: true, size: 40 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Major Escalation with a Key EMEA Client', size: 30, color: '1860F0' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'Account: Nordea  ·  TAM Team Lead  ·  Escalation Handling and Procedure', size: 22, color: '666666' })],
      }),

      h1('1. Why I have chosen Nordea'),
      p('I have chosen Nordea, a key Nordic banking customer, because a major incident there must be handled calmly and visibly.'),
      bullet('A flagship banking brand and an important logo for Sinch in financial services.'),
      bullet('A high potential (HIPO), high priority account with clear room to grow.'),
      bullet('As a regulated bank it relies on passcodes and alerts, so failures reach end customers immediately.'),

      h1('2. How the account is set up for escalations'),
      bullet('A dedicated TAM who knows the account and its contacts.'),
      bullet('Covered by our enterprise SLA, with escalation documented in the Nordea handbook.'),
      bullet('As Team Lead I support the TAM, pull in specialists, and keep senior stakeholders informed.'),

      h1('3. Severity levels'),
      table(
        ['Priority', 'Definition'],
        [
          ['P1', 'Total loss: cannot send or receive across all providers.'],
          ['P2', 'Partial loss: cannot send or receive on a specific provider or some networks.'],
          ['P3', 'Degraded service below agreed throughput or latency.'],
          ['P4', 'Non current or intermittent faults, and other requests.'],
        ],
        [14, 86],
      ),
      spacer(),

      h1('4. Enterprise support response and fix times (working hours)'),
      table(
        ['Stage', 'P1', 'P2', 'P3', 'P4'],
        [
          ['Initial response', '30 minutes', '1 hour', '24 hours', '48 hours'],
          ['Target restoration', '2 hours', '4 hours', '2 working days', '7 working days'],
          ['Target resolution', '5 days', '10 days', '15 days', '30 days'],
          ['Progress reports', 'Every 60 minutes', 'Every 4 hours', 'At resolution', 'At resolution'],
        ],
        [24, 19, 19, 19, 19],
      ),
      spacer(),

      h1('5. Real-time status and uptime transparency'),
      table(
        ['Portal', 'Link', 'What it gives Nordea'],
        [
          ['Real-time status', 'status.sinch.com', 'Live health, scope of impact, and progress during a disruption.'],
          ['Uptime history', 'monitor.sinch.com', 'Long term uptime and our track record.'],
        ],
        [24, 22, 54],
      ),
      spacer(),

      h1('6. The escalation in this scenario'),
      p('The incident was a number lookup and delivery issue to Norway and Finland for ported numbers, with passcodes and alerts failing or delayed. Limited to ported numbers in two markets, it was a P2 pointing to an upstream supplier or routing problem, not a full outage.'),

      h1('7. Step-by-step escalation procedure'),
      numbered('Acknowledge within SLA, log at P2, and set expectations.'),
      numbered('Troubleshoot and scope: gather ranges, timestamps, error codes, and message IDs.'),
      numbered('Identify the cause and put an interim workaround such as alternative routing in place.'),
      numbered('Bring in the right teams (Service Operations, Product, development, TOC) and raise severity if needed.'),
      numbered('Escalate to the supplier in parallel while keeping ownership of the relationship.'),
      numbered('Update Nordea every four hours until restoration, even with no change.'),
      numbered('Restore with a workaround first, then deliver the full fix within SLA.'),
      numbered('Run a PIR and deliver a written RCA (section 9).'),
      numbered('Close all actions, add monitoring where it helps, and document for training.'),

      h1('8. Restoring client confidence'),
      table(
        ['Focus', 'What I do'],
        [
          ['Restore service first', 'The immediate priority is getting Nordea sending again.'],
          ['Single point of contact', 'The TAM owns the message, so Nordea never chases several people.'],
          ['Honest, proactive updates', 'Straight answers at the agreed cadence, with senior ownership when it matters.'],
          ['Credible follow through', 'A clear RCA, preventative actions, and every action closed.'],
        ],
        [34, 66],
      ),
      spacer(),

      h1('9. Post-Incident Review and Root Cause Analysis'),
      table(
        ['Report component', 'What it covers'],
        [
          ['Incident summary', 'What happened, the duration, and how it was resolved.'],
          ['Business impact', 'An honest assessment of affected services and scope.'],
          ['Event timeline', 'Detection through to the final corrective actions.'],
          ['Root cause and prevention', 'The root cause and the measures to stop a repeat.'],
        ],
        [28, 72],
      ),
      spacer(),

      h1('10. Lessons learned and continuous improvement'),
      bullet('Add proactive monitoring and alerting on ported routes for NO and FI.'),
      bullet('Feed supplier or recurring issues back to Product and Service Operations, and use it for training.'),

      h1('11. What good looks like'),
      bullet('Service restored within or faster than SLA.'),
      bullet('Nordea kept informed, with no need to chase.'),
      bullet('A clear RCA, all actions closed, and confidence maintained or strengthened.'),

      h1('12. How I would frame it to Nordea'),
      bullet('During: "Logged as a priority, the team is on it, and I will update you every four hours until service is back."'),
      bullet('On a workaround: "We have a workaround restoring delivery now, while we complete the permanent fix with our supplier."'),
      bullet('After: "Service is stable. You will get a full RCA, and I will walk you through how we prevent a repeat."'),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
