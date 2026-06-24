import { useEffect } from 'react';
import { REGION_CHART_COLORS } from '../utils/regionMetrics';
import DrilldownFooter from './DrilldownFooter';

export default function RegionDrilldownModal({
  region,
  regionData,
  periodLabel,
  onClose,
  onFilterPortfolio,
  onViewTickets,
  onFilterTam,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!region || !regionData) return null;

  const total = regionData.value;
  const share = regionData.__portfolioTotal
    ? ((total / regionData.__portfolioTotal) * 100).toFixed(1)
    : '0';

  return (
    <div className="kpi-drill-overlay" role="presentation" onClick={onClose}>
      <div
        className="kpi-drill-modal region-drill-modal"
        role="dialog"
        aria-labelledby="region-drill-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="kpi-drill__header">
          <div>
            <h2 id="region-drill-title">
              <span
                className="region-drill-modal__swatch"
                style={{ background: REGION_CHART_COLORS[region] }}
              />
              {region} Region
            </h2>
            <p>Portfolio activity breakdown for TAMs in {region}</p>
            <span className="kpi-drill__period">{periodLabel}</span>
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="kpi-drill__body">
          <section className="kpi-drill__section">
            <div className="kpi-drill__stat-grid">
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{total}</span>
                <span className="kpi-drill__mini-label">Activity ({share}%)</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{regionData.tamCount}</span>
                <span className="kpi-drill__mini-label">TAMs</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{regionData.created}</span>
                <span className="kpi-drill__mini-label">Created</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{regionData.p1p2}</span>
                <span className="kpi-drill__mini-label">P1/P2</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{regionData.resolved}</span>
                <span className="kpi-drill__mini-label">Resolved</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{regionData.closed}</span>
                <span className="kpi-drill__mini-label">Closed</span>
              </div>
            </div>
          </section>

          <section className="kpi-drill__section">
            <h3>TAMs in {region}</h3>
            <div className="table-wrap kpi-drill__table-wrap">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th>TAM</th>
                    <th>Activity</th>
                    <th>Created</th>
                    <th>P1/P2</th>
                    <th>Resolved</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.tams
                    .slice()
                    .sort((a, b) => (b.metrics.activityTotal ?? 0) - (a.metrics.activityTotal ?? 0))
                    .map((tam) => (
                      <tr key={tam.tam_id}>
                        <td>
                          <button
                            type="button"
                            className="region-drill-modal__tam-link"
                            onClick={() => onFilterTam?.(tam.tam_id)}
                          >
                            {tam.tam_name}
                          </button>
                        </td>
                        <td>{tam.metrics.activityTotal ?? 0}</td>
                        <td>{tam.metrics.totalTickets ?? 0}</td>
                        <td>{tam.metrics.p1p2Count ?? 0}</td>
                        <td>{tam.metrics.resolvedCount ?? 0}</td>
                        <td>{tam.metrics.closedInPeriodCount ?? 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <DrilldownFooter
          onClose={onClose}
          onFilterPortfolio={() => onFilterPortfolio?.(region)}
          onViewTickets={() => onViewTickets?.(region)}
        />
      </div>
    </div>
  );
}
