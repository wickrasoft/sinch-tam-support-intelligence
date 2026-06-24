import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildReportSnapshot } from './health';

export function downloadPdfReport(params, filename) {
  const snapshot = buildReportSnapshot(params);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(snapshot.title, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 9;
  doc.text(`Period: ${snapshot.periodLabel}`, margin, y);
  y += 5;
  doc.text(`Region: ${snapshot.regionName}`, margin, y);
  y += 5;
  doc.text(`TAM: ${snapshot.tamName}`, margin, y);
  y += 5;
  doc.text(`Generated: ${snapshot.generatedAt}`, margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'vs Prior Period']],
    body: snapshot.summaryRows.map((row) => [row.metric, row.value, row.delta]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 10;

  if (snapshot.atRiskAccounts.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Accounts Requiring Attention (${snapshot.atRiskAccounts.length})`, margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Account', 'Health', 'TAM', 'SLA %', 'CSAT', 'P1/P2', 'Reopens']],
      body: snapshot.atRiskAccounts.map((row) => [
        row.accountName,
        row.health,
        row.tamName,
        row.slaRate,
        row.csat,
        row.p1p2,
        row.reopenings,
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [127, 29, 29], textColor: 255 },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  if (y > 250) {
    doc.addPage();
    y = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Account Breakdown', margin, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['Account', 'Health', 'Tickets', 'P1', 'P2', 'SLA %', 'CSAT', 'MTTR']],
    body: snapshot.accountRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 42 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      snapshot.footer,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.setTextColor(0);
  }

  doc.save(filename);
}
