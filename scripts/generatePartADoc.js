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
const outPath = path.join(__dirname, '..', 'Part-A-AI-in-TAM-Work.docx');

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });

const body = (text) =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text })] });

const bullet = (text) =>
  new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });

const label = (text) =>
  new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, italics: true })],
  });

// Image marker. The template step embeds every screenshot in
// scripts/assets/screenshots whose name starts with `key` (e.g. reply,
// reply-1, reply-2). Drop the files in and they are all kept.
const img = (key, caption = '') =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `[[IMG:${key}|${caption}]]` })] });

function summaryTable() {
  const rows = [
    ['Use case', 'AI tool(s)', 'Main gain'],
    ['Improving customer replies', 'ChatGPT, Microsoft Copilot', 'Clearer, more professional replies, fewer errors, faster'],
    ['Detailed explanations and KB articles', 'ChatGPT, Claude', 'Faster, well-sourced answers with Sinch documentation links'],
    ['Building reporting tools', 'ChatGPT, Claude', 'Automated portfolio reporting, days not weeks (see Part B)'],
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, i) =>
      new TableRow({
        children: row.map(
          (text) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text, bold: i === 0 })] })],
              shading: i === 0 ? { fill: 'E8E8E8', type: ShadingType.CLEAR } : undefined,
            }),
        ),
      }),
    ),
  });
}

const doc = new Document({
  title: 'Part A — AI in TAM Work',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
  },
  sections: [
    {
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Part A: AI Tools in Day-to-Day TAM Work', bold: true, size: 36 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: 'Concrete workflows, outputs, and improvements', size: 24, color: '444444' })],
        }),

        heading('1. Improving the quality of customer replies'),
        label('Workflow'),
        body(
          'Before sending a reply in Zendesk or Outlook, I paste my rough draft into ChatGPT or Microsoft Copilot and ask it to improve the tone and professionalism and fix the grammar, while keeping the technical meaning unchanged.',
        ),
        body(
          'Example: a blunt draft like "delivery is failing because your sender id is not registered, register it before sending again" becomes a courteous reply that explains the cause, the fix, and the next step. I review and personalise it, then send.',
        ),
        label('Output'),
        bullet('A polished reply with correct grammar, a professional tone, and a clear cause, fix, and next step.'),
        label('Improvement'),
        bullet('More professional, empathetic replies with fewer errors.'),
        bullet('A send-ready reply in a minute or two instead of several minutes of re-wording.'),
        img('reply-input', 'Input: my rough draft passed to ChatGPT'),
        img('reply-output', 'Output: the polished, professional reply'),

        heading('2. Detailed explanations with related Sinch KB articles'),
        label('Workflow'),
        body(
          'When a customer needs a detailed explanation or a set of answers backed by documentation, I use ChatGPT or Claude to draft a clear response and to point me to the most relevant Sinch knowledge base, Trust Center, and developer articles. I verify every link against the live Sinch sources before sending.',
        ),
        body(
          'Example: a customer sent a list of data privacy and security questions. I drafted a clear answer to each and matched them to the relevant Sinch Trust Center, legal, and KB pages, then reviewed and verified every link before sending the final reply.',
        ),
        label('Output'),
        bullet('A clear explanation tailored to the question, with relevant Sinch documentation links for self-service.'),
        label('Improvement'),
        bullet('A thorough, well-sourced answer in minutes instead of manual searching.'),
        bullet('Consistent explanations that reduce follow-up questions.'),
        img('kb-input', 'Input: the client query'),
        img('kb-output', 'Output: the ChatGPT draft answer'),
        img('kb-final', 'Final: the revised reply I sent, with verified Sinch links'),

        heading('3. Building reporting tools'),
        label('Workflow'),
        body(
          'When the reporting I need does not exist in Zendesk, I use ChatGPT to scope it and Claude to build and iterate the code, then deploy it to a live URL. I built the TAM Support Intelligence dashboard this way (full detail in Part B).',
        ),
        label('Output'),
        bullet('A live, filterable dashboard with KPI cards, at-risk alerts, account health scores, and one-click CSV, Markdown, and PDF exports.'),
        label('Improvement'),
        bullet('A working multi-view tool in days instead of weeks, with no formal development queue.'),
        bullet('Data-backed QBRs from exportable evidence.'),
        img('dashboard', 'The TAM Support Intelligence dashboard (Part B)'),

        heading('Summary'),
        summaryTable(),
        new Paragraph({ spacing: { before: 200 } }),
        body(
          'In each case the AI tool drafts and accelerates the work. I stay accountable for technical accuracy, customer tone, and the documentation links.',
        ),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
