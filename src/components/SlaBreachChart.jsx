import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { KPI_KEYS } from '../utils/kpiDrilldown';

const SLA_CHART = {
  grid: '#334155',
  axis: '#94a3b8',
  primary: '#a78bfa',
  primaryBright: '#c4b5fd',
  primaryDeep: '#7c3aed',
  fillSoft: 'rgba(167, 139, 250, 0.14)',
  surface: '#1e293b',
};

const BAR_ROW_HEIGHT = 36;
const VISIBLE_ACCOUNT_ROWS = 5;
const CHART_VERTICAL_PADDING = 40;

function getScrollableChartHeights(rowCount, rowHeight = BAR_ROW_HEIGHT) {
  const fullHeight = Math.max(
    VISIBLE_ACCOUNT_ROWS * rowHeight + CHART_VERTICAL_PADDING,
    rowCount * rowHeight + CHART_VERTICAL_PADDING,
  );
  const viewportHeight = Math.min(
    fullHeight,
    VISIBLE_ACCOUNT_ROWS * rowHeight + CHART_VERTICAL_PADDING,
  );
  return { fullHeight, viewportHeight };
}

function getYAxisWidth(names) {
  const longest = names.reduce((max, name) => Math.max(max, name.length), 0);
  return Math.min(220, Math.max(132, Math.ceil(longest * 6.5) + 16));
}

function AccountYAxisTick({ x, y, payload }) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="currentColor"
      fontSize={12}
      className="sla-breach-chart__y-tick"
    >
      {payload.value}
    </text>
  );
}

function getBarFill(breaches, maxBreaches) {
  if (!maxBreaches) return SLA_CHART.primary;
  const weight = breaches / maxBreaches;
  if (weight >= 0.75) return SLA_CHART.primaryDeep;
  if (weight >= 0.4) return SLA_CHART.primary;
  return SLA_CHART.primaryBright;
}

function getBarPayload(event) {
  return event?.payload ?? event;
}

function AccountTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip sla-breach-tooltip">
      <p className="chart-tooltip__label">{row.accountName}</p>
      <p className="sla-breach-tooltip__row">
        <span>Breaches</span>
        <strong>{row.breaches}</strong>
      </p>
      <p className="sla-breach-tooltip__row">
        <span>Account rate</span>
        <strong>{row.rate}%</strong>
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip sla-breach-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p className="sla-breach-tooltip__row">
        <span>Breach rate</span>
        <strong>{row.rate}%</strong>
      </p>
      <p className="sla-breach-tooltip__row">
        <span>Total breaches</span>
        <strong>{row.breaches}</strong>
      </p>
    </div>
  );
}

export default function SlaBreachChart({ accountData, timeSeries, onDrilldown, embedded = false }) {
  const breachByAccount = useMemo(
    () => accountData
      .map((a) => ({
        name: a.account_name,
        accountId: a.account_id,
        accountName: a.account_name,
        breaches: a.metrics.slaBreaches,
        rate: Number(a.metrics.slaBreachRate.toFixed(1)),
      }))
      .sort((a, b) => b.breaches - a.breaches),
    [accountData],
  );

  const yAxisWidth = useMemo(
    () => getYAxisWidth(breachByAccount.map((row) => row.name)),
    [breachByAccount],
  );

  const maxBreaches = useMemo(
    () => breachByAccount.reduce((max, row) => Math.max(max, row.breaches), 0),
    [breachByAccount],
  );

  const trend = useMemo(
    () => timeSeries.map((p) => ({
      label: p.label,
      date: p.date,
      breaches: p.slaBreaches,
      rate: Number(p.slaBreachRate.toFixed(1)),
    })),
    [timeSeries],
  );

  const { fullHeight: barHeight, viewportHeight } = getScrollableChartHeights(
    breachByAccount.length,
    embedded ? 22 : BAR_ROW_HEIGHT,
  );
  const trendHeight = embedded ? 88 : 200;

  const openAccountDrilldown = (event) => {
    const row = getBarPayload(event);
    if (!row?.accountId || !onDrilldown) return;
    onDrilldown(KPI_KEYS.SLA, { accountId: row.accountId });
  };

  const openTrendDrilldown = (event) => {
    const row = getBarPayload(event);
    if (!row?.date || !onDrilldown || !row.breaches) return;
    onDrilldown(KPI_KEYS.SLA, { bucketDate: row.date, bucketLabel: row.label });
  };

  const Tag = embedded ? 'div' : 'article';
  const rootClass = embedded
    ? 'sla-breach-section'
    : 'panel panel--chart-drilldown sla-breach-panel';

  const axisTick = { fontSize: 11, fill: SLA_CHART.axis };

  return (
    <Tag className={rootClass}>
      <header className={embedded ? 'sla-breach-section__header' : 'panel__header'}>
        <h2>SLA Breaches - First Response and Resolution</h2>
      </header>

      <div className={`panel__chart sla-breach-panel__chart ${embedded ? 'panel__chart--compact' : ''}`}>
        <h3 className="panel__chart-title sla-breach-panel__chart-title">
          <span className="sla-breach-panel__swatch" aria-hidden="true" />
          Breaches by Account
          <span className="sla-breach-panel__chart-note">
            {breachByAccount.length} accounts
            {breachByAccount.length > VISIBLE_ACCOUNT_ROWS ? ' · scroll for more' : ''}
          </span>
        </h3>
        <div
          className="chart-scroll-viewport"
          style={{ maxHeight: viewportHeight }}
        >
          <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart
            data={breachByAccount}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={SLA_CHART.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTick}
              allowDecimals={false}
              axisLine={{ stroke: SLA_CHART.grid }}
              tickLine={{ stroke: SLA_CHART.grid }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={AccountYAxisTick}
              width={yAxisWidth}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<AccountTooltip />} cursor={{ fill: SLA_CHART.fillSoft }} />
            <Bar
              dataKey="breaches"
              name="SLA Breaches"
              radius={[0, 6, 6, 0]}
              barSize={14}
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={openAccountDrilldown}
            >
              {breachByAccount.map((entry) => (
                <Cell
                  key={entry.accountId}
                  fill={getBarFill(entry.breaches, maxBreaches)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className={`panel__chart sla-breach-panel__chart sla-breach-panel__chart--trend ${embedded ? 'panel__chart--compact' : ''}`}>
        <h3 className="panel__chart-title sla-breach-panel__chart-title">
          <span className="sla-breach-panel__swatch" aria-hidden="true" />
          Breach rate trend (%)
        </h3>
        <ResponsiveContainer width="100%" height={trendHeight}>
          <LineChart data={trend} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={SLA_CHART.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={{ stroke: SLA_CHART.grid }}
              tickLine={{ stroke: SLA_CHART.grid }}
              dy={6}
            />
            <YAxis
              tick={axisTick}
              unit="%"
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={SLA_CHART.primary}
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: SLA_CHART.primary,
                stroke: SLA_CHART.surface,
                strokeWidth: 2,
                cursor: onDrilldown ? 'pointer' : 'default',
              }}
              activeDot={{
                r: 6,
                fill: SLA_CHART.primaryBright,
                stroke: SLA_CHART.surface,
                strokeWidth: 2,
                cursor: onDrilldown ? 'pointer' : 'default',
                onClick: openTrendDrilldown,
              }}
              onClick={openTrendDrilldown}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tag>
  );
}
