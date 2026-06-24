import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function getBarPayload(event) {
  return event?.payload ?? event;
}

const DISPOSITION_GROUPS = [
  { name: 'Open', disposition: 'in_progress' },
  { name: 'WFR', disposition: 'waiting_for_response' },
  { name: 'Escalated', disposition: 'escalated' },
  { name: 'Temp fix', disposition: 'temp_resolution' },
];

export default function PriorityChart({ data, accountData, tamMetrics, tickets, summary, onDrilldown }) {
  const topAccounts = accountData.slice(0, 6).map((a) => ({
    name: a.account_name.split(' ')[0],
    accountId: a.account_id,
    accountName: a.account_name,
    P1: a.metrics.p1Count,
    P2: a.metrics.p2Count,
  }));

  const topTams = useMemo(
    () => (tamMetrics ?? [])
      .slice()
      .sort((a, b) => b.metrics.p1p2Count - a.metrics.p1p2Count)
      .slice(0, 6)
      .map((t) => ({
        name: (t.tam_name ?? 'Unknown').split(' ')[0],
        tamId: t.tam_id,
        tamName: t.tam_name,
        P1: t.metrics.p1Count,
        P2: t.metrics.p2Count,
      })),
    [tamMetrics],
  );

  const p1p2Share = summary?.totalTickets
    ? ((summary.p1p2Count / summary.totalTickets) * 100).toFixed(0)
    : '0';

  const shareTrend = useMemo(
    () => (data ?? []).map((p) => ({
      label: p.label,
      date: p.date,
      share: p.totalTickets
        ? Number(((p.p1p2Count / p.totalTickets) * 100).toFixed(1))
        : 0,
    })),
    [data],
  );

  const dispositionBreakdown = useMemo(() => {
    if (!tickets?.length) return [];
    return DISPOSITION_GROUPS.map((group) => ({
      name: group.name,
      disposition: group.disposition,
      P1: tickets.filter((t) => t.priority === 'P1' && t.disposition === group.disposition).length,
      P2: tickets.filter((t) => t.priority === 'P2' && t.disposition === group.disposition).length,
    })).filter((row) => row.P1 + row.P2 > 0);
  }, [tickets]);

  const p1p2SlaCount = useMemo(
    () => (tickets ?? []).filter(
      (t) => (t.priority === 'P1' || t.priority === 'P2') && t.sla?.any_breach,
    ).length,
    [tickets],
  );

  const openDrilldown = (kpiKey) => {
    if (!onDrilldown) return;
    onDrilldown(kpiKey);
  };

  const openAccountDrilldown = (priority, event) => {
    const row = getBarPayload(event);
    if (!row?.accountId || !onDrilldown) return;
    onDrilldown(priority === 'P1' ? KPI_KEYS.P1 : KPI_KEYS.P2, {
      accountId: row.accountId,
    });
  };

  const openTamDrilldown = (priority, event) => {
    const row = getBarPayload(event);
    if (!row?.tamId || !onDrilldown) return;
    onDrilldown(priority === 'P1' ? KPI_KEYS.P1 : KPI_KEYS.P2, {
      tamId: row.tamId,
    });
  };

  const openTrendDrilldown = (priority, event) => {
    const row = getBarPayload(event);
    if (!row?.date || !onDrilldown) return;
    const count = priority === 'P1' ? row.p1Count : row.p2Count;
    if (!count) return;
    onDrilldown(priority === 'P1' ? KPI_KEYS.P1 : KPI_KEYS.P2, {
      bucketDate: row.date,
      bucketLabel: row.label,
    });
  };

  const openShareDrilldown = (index) => {
    const row = shareTrend[index];
    if (!row?.date || !onDrilldown || !row.share) return;
    onDrilldown(KPI_KEYS.P1P2, { bucketDate: row.date, bucketLabel: row.label });
  };

  const openDispositionDrilldown = (priority, event) => {
    const row = getBarPayload(event);
    if (!row?.disposition || !onDrilldown) return;
    const count = priority === 'P1' ? row.P1 : row.P2;
    if (!count) return;
    onDrilldown(priority === 'P1' ? KPI_KEYS.P1 : KPI_KEYS.P2, {
      disposition: row.disposition,
    });
  };

  return (
    <article className="panel panel--chart-drilldown priority-chart-panel">
      <header className="panel__header">
        <h2>P1 / P2 Tickets - Critical &amp; high priority volume</h2>
      </header>

      {summary && (
        <div className="priority-summary">
          <button
            type="button"
            className="priority-summary__stat priority-summary__stat--clickable priority-summary__stat--p1"
            onClick={() => openDrilldown(KPI_KEYS.P1)}
          >
            <span className="priority-summary__label">P1 Critical</span>
            <span className="priority-summary__value">{summary.p1Count ?? 0}</span>
          </button>
          <button
            type="button"
            className="priority-summary__stat priority-summary__stat--clickable priority-summary__stat--p2"
            onClick={() => openDrilldown(KPI_KEYS.P2)}
          >
            <span className="priority-summary__label">P2 High</span>
            <span className="priority-summary__value">{summary.p2Count ?? 0}</span>
          </button>
          <button
            type="button"
            className="priority-summary__stat priority-summary__stat--clickable"
            onClick={() => openDrilldown(KPI_KEYS.P1P2)}
          >
            <span className="priority-summary__label">P1/P2 Total</span>
            <span className="priority-summary__value">{summary.p1p2Count ?? 0}</span>
          </button>
          <div className="priority-summary__stat priority-summary__stat--share">
            <span className="priority-summary__label">Share of volume</span>
            <span className="priority-summary__value">{p1p2Share}%</span>
          </div>
          <button
            type="button"
            className="priority-summary__stat priority-summary__stat--clickable priority-summary__stat--sla"
            onClick={() => openDrilldown(KPI_KEYS.SLA)}
            title="All SLA breaches in period"
          >
            <span className="priority-summary__label">P1/P2 SLA breach</span>
            <span className="priority-summary__value">{p1p2SlaCount}</span>
          </button>
        </div>
      )}

      <div className="panel__chart panel__chart--compact">
        <h3 className="panel__chart-title">By Account (Top 6)</h3>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={topAccounts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.accountName ?? ''}
            />
            <Legend />
            <Bar
              dataKey="P1"
              fill="#dc2626"
              name="P1 Critical"
              radius={[4, 4, 0, 0]}
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={(event) => openAccountDrilldown('P1', event)}
            />
            <Bar
              dataKey="P2"
              fill="#f97316"
              name="P2 High"
              radius={[4, 4, 0, 0]}
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={(event) => openAccountDrilldown('P2', event)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel__chart panel__chart--compact">
        <h3 className="panel__chart-title">Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="p1Count"
              fill="#dc2626"
              name="P1"
              stackId="a"
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={(event) => openTrendDrilldown('P1', event)}
            />
            <Bar
              dataKey="p2Count"
              fill="#f97316"
              name="P2"
              stackId="a"
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={(event) => openTrendDrilldown('P2', event)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {topTams.length > 0 && (
        <div className="panel__chart panel__chart--compact">
          <h3 className="panel__chart-title">By TAM (Top 6)</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={topTams} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [value, name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.tamName ?? ''}
              />
              <Legend />
              <Bar
                dataKey="P1"
                fill="#dc2626"
                name="P1 Critical"
                radius={[4, 4, 0, 0]}
                cursor={onDrilldown ? 'pointer' : 'default'}
                onClick={(event) => openTamDrilldown('P1', event)}
              />
              <Bar
                dataKey="P2"
                fill="#f97316"
                name="P2 High"
                radius={[4, 4, 0, 0]}
                cursor={onDrilldown ? 'pointer' : 'default'}
                onClick={(event) => openTamDrilldown('P2', event)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {dispositionBreakdown.length > 0 && (
        <div className="panel__chart panel__chart--compact">
          <h3 className="panel__chart-title">By Disposition</h3>
          <ResponsiveContainer width="100%" height={Math.max(140, dispositionBreakdown.length * 36 + 40)}>
            <BarChart
              data={dispositionBreakdown}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={72} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="P1"
                fill="#dc2626"
                name="P1 Critical"
                stackId="disp"
                radius={[0, 0, 0, 0]}
                cursor={onDrilldown ? 'pointer' : 'default'}
                onClick={(event) => openDispositionDrilldown('P1', event)}
              />
              <Bar
                dataKey="P2"
                fill="#f97316"
                name="P2 High"
                stackId="disp"
                radius={[0, 4, 4, 0]}
                cursor={onDrilldown ? 'pointer' : 'default'}
                onClick={(event) => openDispositionDrilldown('P2', event)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {shareTrend.length > 0 && (
        <div className="panel__chart panel__chart--compact">
          <h3 className="panel__chart-title">P1/P2 Share of Volume (%)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={shareTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 'auto']} />
              <Tooltip formatter={(v) => [`${v}%`, 'P1/P2 share']} />
              <Line
                type="monotone"
                dataKey="share"
                name="P1/P2 share"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3, cursor: onDrilldown ? 'pointer' : 'default' }}
                activeDot={{
                  r: 5,
                  cursor: onDrilldown ? 'pointer' : 'default',
                  onClick: (_, index) => openShareDrilldown(index),
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
