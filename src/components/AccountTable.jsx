import { useMemo, useState } from 'react';
import { formatDurationHours } from '../utils/metrics';
import { computeHealthScore, healthIndicator } from '../utils/health';
import { format, parseISO } from 'date-fns';

const SORT_KEYS = {
  account: 'account_name',
  health: 'healthScore',
  risk: 'riskScore',
  tickets: 'totalTickets',
  p1: 'p1Count',
  sla: 'slaBreachRate',
  csat: 'avgCsat',
};

function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th>
      <button type="button" className="sort-btn" onClick={() => onSort(sortKey)}>
        {label}
        {active && <span className="sort-btn__icon">{sort.dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

export default function AccountTable({
  accountMetrics,
  onSelectAccount,
  selectedAccountId,
  atRiskOnly = false,
}) {
  const [sort, setSort] = useState(() => (
    atRiskOnly ? { key: 'risk', dir: 'desc' } : { key: 'health', dir: 'asc' }
  ));

  const rows = useMemo(() => {
    const enriched = accountMetrics.map((row) => ({
      ...row,
      healthScore: row.healthScore ?? computeHealthScore(row.metrics),
    }));

    const metricKey = SORT_KEYS[sort.key];
    return enriched.sort((a, b) => {
      let aVal = sort.key === 'account'
        ? a.account_name
        : (metricKey ? a.metrics[metricKey] ?? a[metricKey] : 0);
      let bVal = sort.key === 'account'
        ? b.account_name
        : (metricKey ? b.metrics[metricKey] ?? b[metricKey] : 0);

      if (aVal == null) aVal = sort.key === 'csat' ? -1 : 0;
      if (bVal == null) bVal = sort.key === 'csat' ? -1 : 0;

      if (typeof aVal === 'string') {
        return sort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [accountMetrics, sort]);

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (!rows.length) {
    return (
      <article className="panel panel--wide">
        <header className="panel__header">
          <h2>{atRiskOnly ? 'At-Risk Account Matrix' : 'Account Detail Matrix'}</h2>
          <p>No accounts match the current filters</p>
        </header>
        <div className="empty-state">Try widening the date range or clearing filters.</div>
      </article>
    );
  }

  return (
    <article className="panel panel--wide">
      <header className="panel__header">
        <h2>
          {atRiskOnly
            ? 'At-Risk Account Matrix - Flagged accounts sorted by highest risk'
            : 'Account Detail Matrix'}
        </h2>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortHeader label="Account" sortKey="account" sort={sort} onSort={toggleSort} />
              <th>TAM</th>
              {atRiskOnly && (
                <SortHeader label="Risk" sortKey="risk" sort={sort} onSort={toggleSort} />
              )}
              <SortHeader label="Health" sortKey="health" sort={sort} onSort={toggleSort} />
              <SortHeader label="Tickets" sortKey="tickets" sort={sort} onSort={toggleSort} />
              <SortHeader label="P1" sortKey="p1" sort={sort} onSort={toggleSort} />
              <th>P2</th>
              <th>SLA Breaches</th>
              <SortHeader label="Breach %" sortKey="sla" sort={sort} onSort={toggleSort} />
              <SortHeader label="CSAT" sortKey="csat" sort={sort} onSort={toggleSort} />
              <th>MTTA</th>
              <th>MTTR</th>
              <th>Reopens</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const health = healthIndicator(row.healthScore);
              const selected = row.account_id === selectedAccountId;
              return (
                <tr
                  key={row.account_id}
                  className={`data-table__row--clickable ${selected ? 'data-table__row--selected' : ''}`}
                  onClick={() => onSelectAccount(row.account_id)}
                >
                  <td className="data-table__account">{row.account_name}</td>
                  <td>{row.tam_name}</td>
                  {atRiskOnly && (
                    <td className="cell-critical">{row.riskScore ?? '—'}</td>
                  )}
                  <td>
                    <span className="health-pill" style={{ '--pill-color': health.color }}>
                      {row.healthScore ?? '—'}
                    </span>
                  </td>
                  <td>{row.metrics.totalTickets}</td>
                  <td className={row.metrics.p1Count > 0 ? 'cell-critical' : ''}>{row.metrics.p1Count}</td>
                  <td className={row.metrics.p2Count > 2 ? 'cell-warn' : ''}>{row.metrics.p2Count}</td>
                  <td>{row.metrics.slaBreaches}</td>
                  <td>{row.metrics.slaBreachRate.toFixed(1)}%</td>
                  <td>{row.metrics.avgCsat?.toFixed(1) ?? '—'}</td>
                  <td>{formatDurationHours(row.metrics.avgMtta)}</td>
                  <td>{formatDurationHours(row.metrics.avgMttr)}</td>
                  <td>{row.metrics.reopenings}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
