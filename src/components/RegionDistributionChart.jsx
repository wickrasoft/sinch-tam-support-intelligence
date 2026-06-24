import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { REGION_CHART_COLORS, getRegionDistributionTotal } from '../utils/regionMetrics';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const total = payload[0].payload.__total ?? 0;
  const pct = total > 0 ? ((row.value / total) * 100).toFixed(1) : '0';

  return (
    <div className="region-chart__tooltip">
      <strong>{row.region}</strong>
      <span>{row.value} activity ({pct}%)</span>
      <span>{row.tamCount} TAM{row.tamCount !== 1 ? 's' : ''}</span>
      <span>{row.created} created</span>
    </div>
  );
}

export default function RegionDistributionChart({
  data,
  selectedRegion,
  onRegionClick,
  height = 320,
}) {
  const total = useMemo(() => getRegionDistributionTotal(data), [data]);
  const chartData = useMemo(
    () => data.map((row) => ({ ...row, __total: total })),
    [data, total],
  );
  const innerRadius = Math.round(height * 0.25);
  const outerRadius = Math.round(height * 0.405);
  const centerSize = innerRadius * 2;

  const handleSliceClick = (region) => {
    if (!region || !onRegionClick) return;
    onRegionClick(region);
  };

  const handlePieClick = (entry) => {
    const region = entry?.region ?? entry?.payload?.region;
    handleSliceClick(region);
  };

  return (
    <div className="region-chart region-chart--drilldown">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="region"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
            cursor={onRegionClick ? 'pointer' : 'default'}
            onClick={handlePieClick}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.region}
                fill={REGION_CHART_COLORS[entry.region]}
                stroke={selectedRegion === entry.region ? '#f8fafc' : 'transparent'}
                strokeWidth={selectedRegion === entry.region ? 2 : 0}
                opacity={selectedRegion && selectedRegion !== entry.region ? 0.42 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <button
        type="button"
        className="region-chart__center"
        style={{ width: centerSize, height: centerSize }}
        onClick={() => onRegionClick?.(null)}
        title="Clear region selection"
        aria-label={`${total} total portfolio activity`}
      >
        <span className="region-chart__center-value">{total}</span>
        <span className="region-chart__center-label">Total</span>
      </button>
    </div>
  );
}
