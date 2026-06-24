import { downloadFile, ticketsToCsv, buildMarkdownReport } from '../utils/health';
import { format } from 'date-fns';

export default function ExportBar({
  filteredTickets,
  periodLabel,
  filters,
  summary,
  comparison,
  accountMetrics,
  atRiskAccounts,
  tams,
}) {
  const stamp = format(new Date(), 'yyyy-MM-dd');
  const reportParams = {
    periodLabel,
    filters,
    summary,
    comparison,
    accountMetrics,
    atRiskAccounts,
    tams,
  };

  const exportCsv = () => {
    const csv = ticketsToCsv(filteredTickets);
    downloadFile(csv, `tam-tickets-${stamp}.csv`, 'text/csv');
  };

  const exportMarkdownReport = () => {
    const md = buildMarkdownReport(reportParams);
    downloadFile(md, `tam-support-report-${stamp}.md`, 'text/markdown');
  };

  const exportPdfReport = async () => {
    const { downloadPdfReport } = await import('../utils/reportExport');
    downloadPdfReport(reportParams, `tam-support-report-${stamp}.pdf`);
  };

  return (
    <div className="export-bar">
      <span className="export-bar__label">Export</span>
      <button type="button" className="export-bar__btn" onClick={exportCsv}>
        Download CSV
        <span className="export-bar__hint">{filteredTickets.length} tickets</span>
      </button>
      <button type="button" className="export-bar__btn export-bar__btn--primary" onClick={exportMarkdownReport}>
        Download Report
        <span className="export-bar__hint">Markdown · QBR-ready</span>
      </button>
      <button type="button" className="export-bar__btn export-bar__btn--primary" onClick={exportPdfReport}>
        Download PDF
        <span className="export-bar__hint">PDF · QBR-ready</span>
      </button>
    </div>
  );
}
