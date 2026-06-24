import { useEffect } from 'react';
import { KPI_KEYS } from '../utils/kpiDrilldown';
import { REGION_CHART_COLORS } from '../utils/regionMetrics';
import DrilldownFooter from './DrilldownFooter';

const REGION_STAT_DRILLS = {
  activity: null,
  tams: null,
  created: KPI_KEYS.CREATED,
  p1p2: KPI_KEYS.P1P2,
  resolved: KPI_KEYS.RESOLVED,
  closed: KPI_KEYS.CLOSED,
};

export default function RegionDrilldownModal({
  region,
  regionData,
  periodLabel,
  onClose,
  onFilterPortfolio,
  onViewTams,
  onViewTickets,
  onFilterTam,
  onKpiDrilldown,
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

  const openKpi = (key) => {
    if (!key || !onKpiDrilldown) return;
    onKpiDrilldown(key, region);
  };

  const stats = [
    { key: 'activity', label: `Activity (${share}%)`, value: total, drillable: false },
    { key: 'tams', label: 'TAMs', value: regionData.tamCount, drillable: false },
    { key: 'created', label: 'Created', value: regionData.created, drillable: true },
    { key: 'p1p2', label: 'P1/P2', value: regionData.p1p2, drillable: true },
    { key: 'resolved', label: 'Resolved', value: regionData.resolved, drillable: true },
    { key: 'closed', label: 'Closed', value: regionData.closed, drillable: true },
  ];

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
              {region} Region - Portfolio activity for TAMs in {region}
            </h2>
            <span className="kpi-drill__period">{periodLabel}</span>
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="kpi-drill__body">
          <section className="kpi-drill__section">
            <div className="kpi-drill__stat-grid">
              {stats.map((stat) => {
                const kpiKey = REGION_STAT_DRILLS[stat.key];
                const Tag = stat.drillable && kpiKey && onKpiDrilldown ? 'button' : 'div';
                return (
                  <Tag
                    key={stat.key}
                    type={Tag === 'button' ? 'button' : undefined}
                    className={`kpi-drill__mini-stat ${
                      stat.drillable && kpiKey ? 'kpi-drill__mini-stat--clickable region-drill-modal__stat' : ''
                    }`}
                    onClick={stat.drillable && kpiKey ? () => openKpi(kpiKey) : undefined}
                  >
                    <span className="kpi-drill__mini-value">{stat.value}</span>
                    <span className="kpi-drill__mini-label">{stat.label}</span>
                  </Tag>
                );
              })}
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
                      <tr
                        key={tam.tam_id}
                        className="data-table__row--clickable"
                        onClick={() => onFilterTam?.(tam.tam_id)}
                        title="Filter portfolio to this TAM"
                      >
                        <td>
                          <span className="region-drill-modal__tam-link">{tam.tam_name}</span>
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
          onViewAccount={() => onViewTams?.(region)}
          onViewTickets={() => onViewTickets?.(region)}
          viewAccountLabel="View TAMs →"
          viewTicketsLabel="View tickets →"
        />
      </div>
    </div>
  );
}
