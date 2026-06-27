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
const outPath = path.join(__dirname, '..', 'Scenario-2-Team-Member-Mistake.docx');

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 160 } });
const h2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } });
const h3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 100 } });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, ...o })] });
const bullet = (t, l = 0) => new Paragraph({ text: t, bullet: { level: l }, spacing: { after: 70 } });
const numbered = (t) => new Paragraph({ text: t, numbering: { reference: 's2steps', level: 0 }, spacing: { after: 70 } });
const quote = (t) =>
  new Paragraph({
    spacing: { before: 60, after: 100 },
    indent: { left: 540 },
    children: [new TextRun({ text: `"${t}"`, italics: true, color: '333333', size: 22 })],
  });
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
  title: 'Scenario 2 — Team Member Mistake',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  numbering: {
    config: [
      {
        reference: 's2steps',
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
      },
    ],
  },
  sections: [{
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Roleplay Scenario 2', bold: true, size: 40 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'Managing a Team Member Mistake', size: 30, color: '1860F0' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: 'Fictional Incident  ·  TAM Team Lead  ·  People-First Response and Client Recovery', size: 22, color: '666666' })],
      }),

      h1('1. The scenario at a glance'),
      p('I have chosen a fictional but realistic situation that tests the technical response and how a leader looks after someone who made an honest mistake under pressure.'),
      p('While increasing messaging capacity for a customer (fictional name Apex Sports Media) ahead of their FIFA World Cup 2026 SMS campaign, a TAM on my team accidentally deletes the customer account, so they cannot launch when it matters most. My job is to fix it fast, protect both the customer and the colleague, and make us safer than before.'),

      h1('2. What happened'),
      bullet('The TAM was making a customer requested change to increase messaging capacity.'),
      bullet('The account was deleted instead of updated, removing the campaign configuration.'),
      bullet('The customer could not send, so a routine change became a critical, time sensitive incident.'),

      h1('3. What was missing'),
      bullet('The configuration was not exported before the change, so there was no quick snapshot to restore from.'),
      bullet('Rebuilding from other sources took far longer than a simple restore.'),
      p('So the fix is to make a pre change backup a required, enforced step, not just to ask people to be careful.'),

      h1('4. Impact and ramifications'),
      table(
        ['Affected party', 'Impact'],
        [
          ['Apex Sports Media', 'Cannot launch the FIFA World Cup 2026 campaign on time, and lost event sending time cannot be recovered.'],
          ['Sinch (commercial)', 'Risk to campaign revenue, credits, and the renewal at a flagship event.'],
          ['Sinch (reputation)', 'Reputational risk, remembered longer than the incident.'],
          ['The team member', 'Stress and loss of confidence without support.'],
        ],
        [26, 74],
      ),
      spacer(),

      h1('5. How I classify and frame it internally'),
      p('I treat this as a P1, a total loss of service at a time critical moment, caused by an internal human error during a change with a missing backup. I frame it as an "us" problem to own, never a person to blame publicly.'),

      h1('6. My immediate response (first hour)'),
      table(
        ['Immediate action', 'What I do'],
        [
          ['Stay calm', 'Composure and support, not blame.'],
          ['Take ownership', 'Shift pressure onto the team and me.'],
          ['Stand up a P1', 'Bring in platform, Service Operations, and engineering.'],
          ['Protect the customer', 'A prompt holding message and one point of contact.'],
          ['Steady the team member', 'Fix it together now, talk later.'],
        ],
        [28, 72],
      ),
      spacer(),

      h1('7. Protecting the team member'),
      table(
        ['Action', 'Why it matters'],
        [
          ['Never name them externally', 'To the customer it is "our team" or "one of our engineers".'],
          ['Protect privacy internally', 'Leadership gets the facts and impact, not a name.'],
          ['Reassure them privately', 'I have their back, and one mistake does not define them.'],
        ],
        [34, 66],
      ),
      spacer(),

      h1('8. Leading the technical recovery'),
      table(
        ['Recovery action', 'Detail'],
        [
          ['Engage every resource', 'Pull in the right teams and escalate fast.'],
          ['Rebuild and restore', 'Recover the account and configuration accurately, with an interim path where possible.'],
          ['Verify before handback', 'Check capacity, routing, and a test send.'],
        ],
        [32, 68],
      ),
      spacer(),

      h1('9. Communicating with the client'),
      table(
        ['Audience', 'Cadence', 'Owner'],
        [
          ['Apex (operational)', 'Regular updates until restored, then at resolution.', 'TAM, with me in support'],
          ['Apex (senior)', 'At milestones and after resolution.', 'Team Lead'],
        ],
        [24, 52, 24],
      ),
      spacer(),
      p('Sample language I would use with the customer:', { italics: true }),
      quote('We have identified an issue on our side affecting your account and the team is restoring service as the priority. This was an internal error during a change, we own it, and I will keep you updated until you are sending again.'),

      h1('10. Communicating with leadership'),
      table(
        ['What I do', 'Detail'],
        [
          ['Tell them promptly', 'An early heads up from me on a flagship P1.'],
          ['Lead with impact and actions', 'What happened, who is affected, what we are doing, ETA, and risks.'],
          ['Protect the person, plan prevention', 'An internal error and process gap, plus how we stop a repeat.'],
        ],
        [32, 68],
      ),
      spacer(),
      p('Sample leadership update:', { italics: true }),
      quote('P1 affecting Apex Sports Media before their FIFA World Cup 2026 campaign. One of our team accidentally deleted the account and a missing backup is slowing restoration. Team fully engaged and the customer kept updated, with an RCA and a mandatory pre change backup to follow.'),

      h1('11. Supporting the team member through it'),
      table(
        ['Action', 'Why it matters'],
        [
          ['Protect their confidence', 'One mistake does not erase their value.'],
          ['Give them a break', 'They rest once it is fixed.'],
          ['Encourage them', 'Job and trust intact, and back to strong performance.'],
        ],
        [34, 66],
      ),
      spacer(),

      h1('12. The follow-up conversation'),
      p('I would talk it through calmly the next day, once everyone has rested, focusing on process and tooling rather than the person, to understand what happened and agree what we change.'),

      h1('13. Preventing recurrence'),
      p('There is always a margin for human error, but the same serious mistake should not happen twice. You achieve that by improving the system.'),
      table(
        ['Safeguard', 'What it prevents'],
        [
          ['Mandatory pre change backup', 'Slow recovery, the gap in this incident.'],
          ['Four eyes approval for risky changes', 'One person making a high impact change unchecked.'],
          ['Safer delete with a recovery window', 'Permanent loss from an accidental action.'],
        ],
        [40, 60],
      ),
      spacer(),

      h1('14. RCA, documentation, and lessons learned'),
      bullet('Provide an RCA to the customer if required, and document the incident and lessons for training.'),
      bullet('Share learnings blamelessly and track actions to completion.'),

      h1('15. What good looks like'),
      bullet('Customer restored quickly and kept honestly informed.'),
      bullet('Team member protected, supported, and back performing.'),
      bullet('A mandatory pre change backup means this cannot recur the same way.'),
      spacer(),
      p('Bottom line: there is a margin for human error and people must feel safe to own it. Fix fast, protect the customer and the colleague, and improve the system.', { italics: true }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
