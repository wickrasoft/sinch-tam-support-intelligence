import { useMemo, useState } from 'react';
import { formatDuration, getTicketMttaMinutes, getTicketMttrMinutes } from '../utils/metrics';
import { format, parseISO } from 'date-fns';

const PAGE_SIZE = 25;

export default function TicketFeed({ tickets, total, onOpenTicket }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = tickets;

    if (q) {
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q)
          || t.account_name.toLowerCase().includes(q)
          || String(t.zendesk_id).includes(q)
          || t.tam_name.toLowerCase().includes(q),
      );
    }

    list = [...list].sort((a, b) => {
      let aVal;
      let bVal;
      if (sortKey === 'csat') {
        aVal = a.csat?.score;
        bVal = b.csat?.score;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }
      if (sortKey === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [tickets, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <article className="panel panel--wide">
      <header className="panel__header panel__header--row">
        <div>
          <h2>Ticket Explorer</h2>
          <p>
            {filtered.length} of {total} tickets · Click a row for Sinch ticket details
          </p>
        </div>
        <input
          type="search"
          className="ticket-search"
          placeholder="Search subject, account, ID, TAM…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </header>

      {paged.length === 0 ? (
        <div className="empty-state">No tickets match your search or filters.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('zendesk_id')}>
                      ID {sortKey === 'zendesk_id' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('created_at')}>
                      Created {sortKey === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>Account</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('priority')}>
                      Priority {sortKey === 'priority' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>Disposition</th>
                  <th>Product</th>
                  <th>Subject</th>
                  <th>SLA</th>
                  <th>
                    <button type="button" className="sort-btn" onClick={() => toggleSort('csat')}>
                      CSAT {sortKey === 'csat' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th>Reopens</th>
                  <th>MTTA</th>
                  <th>MTTR</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr
                    key={t.id}
                    className="data-table__row--clickable"
                    onClick={() => onOpenTicket?.(t)}
                    title="View ticket details"
                  >
                    <td className="mono">#{t.zendesk_id}</td>
                    <td>{format(parseISO(t.created_at), 'MMM d, HH:mm')}</td>
                    <td>{t.account_name}</td>
                    <td>
                      <span className={`priority priority--${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </td>
                    <td>
                      <span className="disp-badge">{t.disposition?.replace(/_/g, ' ') ?? t.status}</span>
                    </td>
                    <td><span className="badge badge--sinch">{t.sinch?.product ?? '—'}</span></td>
                    <td className="data-table__subject" title={t.subject}>{t.subject}</td>
                    <td>
                      {t.sla.any_breach ? (
                        <span className="badge badge--breach" title={
                          [
                            t.sla.first_response_breached && 'First response',
                            t.sla.resolution_breached && 'Resolution',
                          ].filter(Boolean).join(' + ')
                        }>
                          Breached
                        </span>
                      ) : (
                        <span className="badge badge--ok">Met</span>
                      )}
                    </td>
                    <td>{t.csat.score ?? '—'}</td>
                    <td>{t.reopen_count > 0 ? t.reopen_count : '—'}</td>
                    <td>{formatDuration(getTicketMttaMinutes(t))}</td>
                    <td>{formatDuration(getTicketMttrMinutes(t))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </article>
  );
}
