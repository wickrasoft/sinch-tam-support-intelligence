import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

import {
  proposalCover,
  proposalExecSummary,
  proposalIssues,
  proposalPriority,
} from './generateZendeskProposalDoc.js';
import { planMain } from './generateZendeskProjectPlanDoc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'Zendesk-Tooling-Improvement-Proposal.docx');

const h1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } });
const p = (t, o = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, size: 22, ...o })] });

const doc = new Document({
  title: 'Zendesk & Tooling Improvement Proposal and Implementation Plan',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [
    {
      children: [
        ...proposalCover,
        ...proposalExecSummary,

        h1('Part 1 — The Proposal'),
        p('Each issue below follows the structure the brief asks for: what the problem is, what I would change and why, how to implement it without disrupting customers, and how to measure success.'),
        ...proposalIssues,
        ...proposalPriority,

        h1('Part 2 — Step-by-Step Implementation Plan'),
        p('Part 1 sets out what to change and why. Part 2 is the detailed execution: program structure, timeline, roles, and a phased project plan for each change, with deliverables, success criteria, and rollback.'),
        ...planMain,
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`Created: ${outPath}`);
