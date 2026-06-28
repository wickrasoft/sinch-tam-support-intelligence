import { useCallback, useEffect, useMemo, useState } from 'react';
import { INCIDENTS_API, isActiveIncident } from '../utils/sinchIncidents';

const REFRESH_MS = 5 * 60 * 1000; // auto-refresh every 5 minutes

// Single source of truth for the live Sinch status feed so the KPI card and the
// incidents panel always agree on the active count.
export function useSinchIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [updatedAt, setUpdatedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetch(INCIDENTS_API, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const minor = (data.incidents ?? [])
          .filter((inc) => inc.impact === 'minor')
          .sort((a, b) => new Date(b.started_at ?? b.created_at) - new Date(a.started_at ?? a.created_at));
        setIncidents(minor);
        setUpdatedAt(new Date());
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => { active = false; };
  }, [reloadKey]);

  // Poll the status page every 5 minutes so the data stays current.
  useEffect(() => {
    const timer = setInterval(() => setReloadKey((k) => k + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const reload = useCallback(() => {
    setStatus('loading');
    setReloadKey((k) => k + 1);
  }, []);

  const activeCount = useMemo(
    () => incidents.filter(isActiveIncident).length,
    [incidents],
  );

  return { incidents, status, updatedAt, activeCount, reload };
}
