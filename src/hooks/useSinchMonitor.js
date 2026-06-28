import { useCallback, useEffect, useMemo, useState } from 'react';

// monitor.sinch.com is a public Checkly status page (id 1833, public since 2020).
// Its Nuxt front-end reads these same public, CORS-enabled endpoints, so we pull
// the raw check data and render it natively instead of embedding the branded page.
const STATUS_PAGE_ID = 1833;
// Public account the status page belongs to (returned by the page's metadata call).
const ACCOUNT_ID = 'dd9c3632-57ae-40f9-a4ab-26324f6233a1';
const BASE = `https://api.checklyhq.com/v1/status-page/${STATUS_PAGE_ID}`;
const STATUSES_API = `${BASE}/statuses?page=1&limit=100`;
const REFRESH_MS = 60 * 1000; // the source page refreshes every 60s

// Selectable history windows. Bin counts are tuned so each bar covers a sensible
// interval (checks run ~every minute) instead of leaving lots of empty bins.
export const MONITOR_RANGES = [
  { key: '30m', label: '30m', seconds: 30 * 60, bins: 30 },
  { key: '1h', label: '1h', seconds: 60 * 60, bins: 60 },
  { key: '2h', label: '2h', seconds: 2 * 3600, bins: 60 },
  { key: '3h', label: '3h', seconds: 3 * 3600, bins: 72 },
  { key: '6h', label: '6h', seconds: 6 * 3600, bins: 72 },
  { key: '12h', label: '12h', seconds: 12 * 3600, bins: 72 },
  { key: '24h', label: '24h', seconds: 24 * 3600, bins: 72 },
  { key: '72h', label: '72h', seconds: 72 * 3600, bins: 72 },
];
const DEFAULT_RANGE = '24h';

function deriveState(status) {
  if (!status) return 'unknown';
  if (status.hasFailures || status.hasErrors) return 'down';
  if (status.isDegraded) return 'degraded';
  return 'operational';
}

function binState(bin) {
  const s = bin.statusCounts ?? {};
  if (s.failing > 0) return 'down';
  if (s.degraded > 0) return 'degraded';
  if ((bin.eventCount ?? 0) === 0) return 'empty';
  return 'operational';
}

function normalize(result, bins) {
  const m = result.status?.metrics ?? {};
  return {
    id: result.id,
    name: result.name,
    type: result.checkType,
    muted: result.muted,
    state: deriveState(result.status),
    availability30d: m['30d']?.availability?.currentPeriod ?? m['30dSuccessRatio'] ?? null,
    availability24h: m['1d']?.availability?.currentPeriod ?? m['1dSuccessRatio'] ?? null,
    responseP95: m.responseTimes?.p95 ?? null,
    updatedAt: result.status?.updated_at ?? null,
    bins: (bins ?? []).map((b) => ({
      start: b.start,
      end: b.end,
      avg: b.responseTime?.avg ?? 0,
      state: binState(b),
    })),
  };
}

// Pulls the live external uptime checks (and their response-time history for the
// selected window) from monitor.sinch.com's public Checkly API.
export function useSinchMonitor(rangeKey = DEFAULT_RANGE) {
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [window, setWindow] = useState(null); // { start, end } seconds
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [updatedAt, setUpdatedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      try {
        const sres = await fetch(STATUSES_API, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!sres.ok) throw new Error(`HTTP ${sres.status}`);
        const sdata = await sres.json();
        const results = (sdata.results ?? []).filter((r) => r.activated !== false);
        const checkIds = results.map((r) => r.id);

        const range = MONITOR_RANGES.find((r) => r.key === rangeKey)
          ?? MONITOR_RANGES.find((r) => r.key === DEFAULT_RANGE);
        const end = Math.floor(Date.now() / 1000);
        const start = end - range.seconds;

        // The history bars come from a POST endpoint keyed by the public account id.
        const binsByCheck = {};
        try {
          const ares = await fetch(
            `${BASE}/aggregated-results?startTime=${start}&endTime=${end}&bins=${range.bins}`,
            {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'x-checkly-account': ACCOUNT_ID,
              },
              body: JSON.stringify({ checkIds }),
              signal: controller.signal,
            },
          );
          if (ares.ok) {
            const adata = await ares.json();
            const arr = adata.results ?? adata ?? [];
            for (const c of arr) binsByCheck[c.checkId] = c.bins;
          }
        } catch {
          // History is best-effort; the cards still render without bars.
        }

        if (!active) return;
        setChecks(results.map((r) => normalize(r, binsByCheck[r.id])));
        setSummary(sdata.summary ?? null);
        setWindow({ start, end });
        setUpdatedAt(new Date());
        setStatus('ready');
      } catch (err) {
        if (active && err.name !== 'AbortError') setStatus('error');
      }
    }

    load();
    return () => { active = false; controller.abort(); };
  }, [reloadKey, rangeKey]);

  useEffect(() => {
    const timer = setInterval(() => setReloadKey((k) => k + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const reload = useCallback(() => {
    setStatus('loading');
    setReloadKey((k) => k + 1);
  }, []);

  const overall = useMemo(() => {
    if (summary) {
      if (summary.totalFailing > 0) return 'down';
      if (summary.totalDegraded > 0) return 'degraded';
      return 'operational';
    }
    if (checks.some((c) => c.state === 'down')) return 'down';
    if (checks.some((c) => c.state === 'degraded')) return 'degraded';
    return checks.length ? 'operational' : 'unknown';
  }, [summary, checks]);

  return { checks, summary, overall, window, status, updatedAt, reload };
}
