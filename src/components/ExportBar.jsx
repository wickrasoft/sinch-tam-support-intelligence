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

  const exportCsv = () => {
    const csv = ticketsToCsv(filteredTickets);
    downloadFile(csv, `tam-tickets-${stamp}.csv`, 'text/csv');
  };

  const exportReport = () => {
    const md = buildMarkdownReport({
      periodLabel,
      filters,
      summary,
      comparison,
      accountMetrics,
      atRiskAccounts,
      tams,
    });
    downloadFile(md, `tam-support-report-${stamp}.md`, 'text/markdown');
  };

  return (
    <div className="export-bar">
      <span className="export-bar__label">Export</span>
      <button type="button" className="export-bar__btn" onClick={exportCsv}>
        Download CSV
        <span className="export-bar__hint">{filteredTickets.length} tickets</span>
      </button>
      <button type="button" className="export-bar__btn export-bar__btn--primary" onClick={exportReport}>
        Download Report
        <span className="export-bar__hint">Markdown · QBR-ready</span>
      </button>
    </div>
  );
}
