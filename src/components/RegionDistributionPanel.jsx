import { useMemo } from 'react';
import RegionDistributionChart from './RegionDistributionChart';
import {
  buildRegionPortfolioDistribution,
  getRegionDistributionTotal,
  REGION_CHART_COLORS,
} from '../utils/regionMetrics';

export default function RegionDistributionPanel({
  regionChartTamMetrics,
  allTams,
  selectedRegion,
  onRegionDrilldown,
  embedded = false,
}) {
  const regionDistribution = useMemo(
    () => buildRegionPortfolioDistribution(regionChartTamMetrics, allTams),
    [regionChartTamMetrics, allTams],
  );

  const regionDistributionTotal = useMemo(
    () => getRegionDistributionTotal(regionDistribution),
    [regionDistribution],
  );

  const Tag = embedded ? 'div' : 'article';
  const rootClass = embedded
    ? 'region-panel region-panel--embedded'
    : 'panel region-panel panel--chart-drilldown';

  return (
    <Tag className={rootClass}>
      <header className={embedded ? 'region-panel__header--embedded' : 'panel__header'}>
        <h2 className={embedded ? 'region-panel__title--embedded' : undefined}>
          Regional Distribution and Stats
        </h2>
      </header>

      <div className={`region-panel__body ${embedded ? 'region-panel__body--embedded' : 'region-panel__body--stacked'}`}>
        <div className={`region-panel__chart ${embedded ? 'region-panel__chart--embedded' : 'region-panel__chart--centered'}`}>
          <RegionDistributionChart
            data={regionDistribution}
            selectedRegion={selectedRegion}
            onRegionClick={onRegionDrilldown}
            height={embedded ? 132 : 320}
          />
        </div>

        <ul className={`tam-region-legend ${embedded ? '' : 'tam-region-legend--stacked'}`}>
          {regionDistribution.map((row) => {
            const pct = regionDistributionTotal
              ? ((row.value / regionDistributionTotal) * 100).toFixed(0)
              : '0';
            const isActive = selectedRegion === row.region;

            return (
              <li key={row.region}>
                <button
                  type="button"
                  className={`tam-region-legend__item ${isActive ? 'tam-region-legend__item--active' : ''}`}
                  onClick={() => onRegionDrilldown?.(row.region)}
                >
                  <span
                    className="tam-region-legend__swatch"
                    style={{ background: REGION_CHART_COLORS[row.region] }}
                  />
                  <span className="tam-region-legend__label">{row.region}</span>
                  <span className="tam-region-legend__meta">
                    {row.tamCount} TAM{row.tamCount !== 1 ? 's' : ''}
                  </span>
                  <span className="tam-region-legend__value">{row.value}</span>
                  <span className="tam-region-legend__pct">{pct}%</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selectedRegion && (
        <footer className={`region-panel__footer ${embedded ? 'region-panel__footer--embedded' : ''}`}>
          <span className="region-panel__filter-note">
            Filtering portfolio to <strong>{selectedRegion}</strong>
          </span>
          <button
            type="button"
            className="tam-region-legend__clear"
            onClick={() => onRegionDrilldown?.(null)}
          >
            Clear region filter
          </button>
        </footer>
      )}
    </Tag>
  );
}
