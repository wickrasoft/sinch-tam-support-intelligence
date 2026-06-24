import { useState } from 'react';
import TamStatusIcon from './TamStatusIcon';
import { formatDurationHours, csatIndicator } from '../utils/metrics';
import { computeHealthScore, healthIndicator } from '../utils/health';
import { getTamAvailabilityStatus, normalizeTamRegion } from '../utils/tamStatus';
import { resolveTamAvailability } from '../utils/tamAvailability';

const DISPOSITION_LABELS = {
  in_progress: 'In Progress (IP)',
  waiting_for_response: 'Waiting For Response (WFR)',
  temp_resolution: 'Temp Resolution',
  closed: 'Closed',
  escalated: 'Escalated',
};

export default function TamDirectory({ tams, tamMetrics, referenceDate, onFilterTam, onSelectAccount }) {
  const [selectedTamId, setSelectedTamId] = useState(tamMetrics[0]?.tam_id ?? tams[0]?.id ?? '');

  const selectedTam = tamMetrics.find((t) => t.tam_id === selectedTamId)
    ?? tamMetrics[0]
    ?? null;

  const tamMeta = tams.find((t) => t.id === selectedTamId);
  const tamAvailability = tamMeta
    ? resolveTamAvailability(tamMeta, referenceDate, new Date(), tams)
    : null;

  if (!selectedTam) {
    return (
      <article className="panel">
        <div className="empty-state">No TAM data for the selected period.</div>
      </article>
    );
  }

  const dc = selectedTam.metrics.dispositionCounts ?? {};
  const csat = csatIndicator(selectedTam.metrics.avgCsat);
  const health = healthIndicator(computeHealthScore(selectedTam.metrics));

  return (
    <div className="tam-directory">
      <aside className="tam-directory__sidebar panel">
        <header className="panel__header">
          <h2>TAM Directory</h2>
          <p>{tams.length} Technical Account Managers</p>
        </header>
        <div className="tam-directory__list">
          {tamMetrics.map((tam) => {
            const h = computeHealthScore(tam.metrics);
            const hi = healthIndicator(h);
            const tamMeta = tams.find((t) => t.id === tam.tam_id);
            const status = tamMeta
              ? getTamAvailabilityStatus(tamMeta, referenceDate)
              : 'online';
            return (
              <button
                key={tam.tam_id}
                type="button"
                className={`tam-directory__item ${selectedTamId === tam.tam_id ? 'tam-directory__item--active' : ''}`}
                onClick={() => setSelectedTamId(tam.tam_id)}
              >
                <span className="tam-directory__item-name">
                  {tam.tam_name}
                  {status !== 'online' && <TamStatusIcon status={status} />}
                </span>
                <span className="tam-directory__item-meta">
                  {tam.accounts?.length ?? 0} account{(tam.accounts?.length ?? 0) !== 1 ? 's' : ''} · {tam.metrics.totalTickets} tix
                </span>
                <span className="tam-directory__item-health" style={{ color: hi.color }}>
                  {h ?? '—'}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <article className="panel tam-directory__detail">
        <header className="panel__header panel__header--row">
          <div>
            <h2>
              {selectedTam.tam_name}
              {tamAvailability && tamAvailability.status !== 'online' && (
                <TamStatusIcon status={tamAvailability.status} showLabel />
              )}
            </h2>
            <p>
              {tamMeta?.email} · {normalizeTamRegion(tamMeta?.region)} ·{' '}
              <span style={{ color: health.color }}>Health {computeHealthScore(selectedTam.metrics)}/100</span>
              {tamAvailability?.backup_tam_name && (
                <> · Backup: <strong>{tamAvailability.backup_tam_name}</strong></>
              )}
            </p>
          </div>
          <button type="button" className="panel__action" onClick={() => onFilterTam(selectedTam.tam_id)}>
            Apply TAM filter
          </button>
        </header>

        <div className="tam-directory__summary">
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value">{selectedTam.metrics.totalTickets}</span>
            <span className="tam-summary-stat__label">Total Tickets</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value tam-summary-stat__value--critical">{selectedTam.metrics.p1Count}</span>
            <span className="tam-summary-stat__label">P1</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value tam-summary-stat__value--warn">{selectedTam.metrics.p2Count}</span>
            <span className="tam-summary-stat__label">P2</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value">{selectedTam.metrics.slaBreaches}</span>
            <span className="tam-summary-stat__label">SLA Breaches</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value" style={{ color: csat.color }}>
              {selectedTam.metrics.avgCsat?.toFixed(1) ?? '—'}
            </span>
            <span className="tam-summary-stat__label">CSAT</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value">{formatDurationHours(selectedTam.metrics.avgMtta)}</span>
            <span className="tam-summary-stat__label">MTTA</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value">{formatDurationHours(selectedTam.metrics.avgMttr)}</span>
            <span className="tam-summary-stat__label">MTTR</span>
          </div>
          <div className="tam-summary-stat">
            <span className="tam-summary-stat__value">{selectedTam.metrics.needsAttention ?? 0}</span>
            <span className="tam-summary-stat__label">Need Attention</span>
          </div>
        </div>

        <h3 className="panel__chart-title">Ticket Disposition Breakdown</h3>
        <div className="disp-grid">
          {Object.entries(DISPOSITION_LABELS).map(([key, label]) => (
            <div key={key} className="disp-card">
              <span className="disp-card__value">{dc[key] ?? 0}</span>
              <span className="disp-card__label">{label}</span>
            </div>
          ))}
        </div>

        <h3 className="panel__chart-title">Dedicated Accounts</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Tier</th>
                <th>Industry</th>
                <th>Tickets</th>
                <th>P1</th>
                <th>P2</th>
                <th>IP</th>
                <th>WFR</th>
                <th>Temp Res</th>
                <th>Closed</th>
                <th>Escalated</th>
                <th>SLA Breach</th>
              </tr>
            </thead>
            <tbody>
              {(selectedTam.accounts ?? []).map((acc) => {
                const adc = acc.metrics.dispositionCounts ?? {};
                return (
                  <tr
                    key={acc.id}
                    className="data-table__row--clickable"
                    onClick={() => onSelectAccount(acc.id)}
                  >
                    <td className="data-table__account">{acc.name}</td>
                    <td>{acc.tier}</td>
                    <td>{acc.industry}</td>
                    <td>{acc.ticketCount}</td>
                    <td className={acc.metrics.p1Count > 0 ? 'cell-critical' : ''}>{acc.metrics.p1Count}</td>
                    <td>{acc.metrics.p2Count}</td>
                    <td>{adc.in_progress ?? 0}</td>
                    <td>{adc.waiting_for_response ?? 0}</td>
                    <td>{adc.temp_resolution ?? 0}</td>
                    <td>{adc.closed ?? 0}</td>
                    <td>{adc.escalated ?? 0}</td>
                    <td>{acc.metrics.slaBreaches}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
