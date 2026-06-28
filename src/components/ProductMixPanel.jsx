import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PRODUCT_COLORS, productColor, getProductDistribution } from '../utils/productMix';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const total = row.__total ?? 0;
  const pct = total > 0 ? ((row.value / total) * 100).toFixed(1) : '0';

  return (
    <div className="region-chart__tooltip">
      <strong>{row.product}</strong>
      <span>{row.value} ticket{row.value !== 1 ? 's' : ''} ({pct}%)</span>
    </div>
  );
}

export default function ProductMixPanel({ tickets, onDrilldown }) {
  const distribution = useMemo(() => getProductDistribution(tickets), [tickets]);
  const sliceTotal = useMemo(
    () => distribution.reduce((sum, row) => sum + row.value, 0),
    [distribution],
  );
  const chartData = useMemo(
    () => distribution.map((row) => ({ ...row, __total: sliceTotal })),
    [distribution, sliceTotal],
  );

  const handleDrilldown = (product) => {
    if (!product || !onDrilldown) return;
    onDrilldown(KPI_KEYS.PRODUCT, { product });
  };

  const handlePieClick = (entry) => {
    handleDrilldown(entry?.product ?? entry?.payload?.product);
  };

  return (
    <article className="panel region-panel panel--chart-drilldown">
      <header className="panel__header">
        <h2>Tickets by Product</h2>
        <span className="panel__subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Product mix matching the current filters
        </span>
      </header>

      {sliceTotal === 0 ? (
        <p className="region-panel__filter-note" style={{ padding: '1rem 1.1rem' }}>
          No tickets in this view.
        </p>
      ) : (
        <div className="region-panel__body">
          <div className="region-panel__chart">
            <div className={`region-chart ${onDrilldown ? 'region-chart--drilldown' : ''}`}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="product"
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={134}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                    cursor={onDrilldown ? 'pointer' : 'default'}
                    onClick={handlePieClick}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.product}
                        fill={productColor(entry.product, index)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="region-chart__center" style={{ width: 156, height: 156 }}>
                <span className="region-chart__center-value">{sliceTotal}</span>
                <span className="region-chart__center-label">Tickets</span>
              </div>
            </div>
          </div>

          <ul className="tam-region-legend tam-region-legend--stacked">
            {distribution.map((row, index) => {
              const pct = sliceTotal
                ? ((row.value / sliceTotal) * 100).toFixed(0)
                : '0';
              return (
                <li key={row.product}>
                  <button
                    type="button"
                    className="tam-region-legend__item"
                    onClick={() => handleDrilldown(row.product)}
                    title={`View ${row.product} tickets`}
                  >
                    <span
                      className="tam-region-legend__swatch"
                      style={{ background: PRODUCT_COLORS[row.product] ?? productColor(row.product, index) }}
                    />
                    <span className="tam-region-legend__label">{row.product}</span>
                    <span className="tam-region-legend__connector" aria-hidden="true" />
                    <span className="tam-region-legend__value">{row.value}</span>
                    <span className="tam-region-legend__pct">{pct}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}
