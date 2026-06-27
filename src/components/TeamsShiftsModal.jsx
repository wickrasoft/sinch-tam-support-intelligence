import { useEffect, useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isWeekend, parseISO, startOfDay } from 'date-fns';
import './TeamsShifts.css';

const WINDOW_DAYS = 30;
const COL_WIDTH = 46;
const LABEL_WIDTH = 184;

const OOO_TYPE_COLORS = {
  Vacation: '#fbbf24',
  'Public Holiday': '#38bdf8',
  Training: '#a78bfa',
  Conference: '#34d399',
  'Sick Leave': '#f472b6',
  Personal: '#94a3b8',
};

function toDay(value) {
  if (!value) return null;
  return startOfDay(typeof value === 'string' ? parseISO(value) : value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function collectBlocks(tam) {
  const av = tam.availability ?? {};
  const blocks = [...(av.ooo ?? [])];
  if (av.vacation) {
    blocks.push({ type: 'Vacation', start: av.vacation.start, end: av.vacation.end, backup_tam_id: av.backup_tam_id });
  }
  if (av.sick) {
    blocks.push({ type: 'Sick Leave', start: av.sick.start, end: av.sick.end, backup_tam_id: av.backup_tam_id });
  }
  return blocks;
}

export default function TeamsShiftsModal({ tams = [], referenceDate, publicHolidays = [], initialTamId = null, onClose }) {
  const [scope, setScope] = useState(initialTamId ?? 'all');

  // Holidays are country-specific: key = `${country}|${date}` → holiday name.
  const holidayByCountryDate = useMemo(() => {
    const map = new Map();
    (publicHolidays ?? []).forEach((h) => map.set(`${h.country}|${h.date}`, h.name));
    return map;
  }, [publicHolidays]);

  // Per-date list of (country, name) holidays — used for the header marker tooltip.
  const holidaysByDate = useMemo(() => {
    const map = new Map();
    (publicHolidays ?? []).forEach((h) => {
      if (!map.has(h.date)) map.set(h.date, []);
      map.get(h.date).push(h);
    });
    return map;
  }, [publicHolidays]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const today = useMemo(
    () => startOfDay(referenceDate ? parseISO(referenceDate) : new Date()),
    [referenceDate],
  );
  const windowEnd = useMemo(() => addDays(today, WINDOW_DAYS - 1), [today]);

  const days = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, i)),
    [today],
  );

  const nameById = useMemo(() => {
    const map = {};
    tams.forEach((t) => { map[t.id] = t.name; });
    return map;
  }, [tams]);

  const scopedTams = useMemo(
    () => (scope === 'all' ? tams : tams.filter((t) => t.id === scope)),
    [tams, scope],
  );

  // Per-TAM rows with positioned bars (offset/span across the day columns).
  const rows = useMemo(() => {
    return scopedTams.map((tam) => {
      const bars = collectBlocks(tam)
        .map((b) => {
          const start = toDay(b.start);
          const end = toDay(b.end);
          if (!start || !end) return null;
          if (end < today || start > windowEnd) return null;
          const startOffset = clamp(differenceInCalendarDays(start, today), 0, WINDOW_DAYS - 1);
          const endOffset = clamp(differenceInCalendarDays(end, today), 0, WINDOW_DAYS - 1);
          const span = endOffset - startOffset + 1;
          return {
            ...b,
            startOffset,
            span,
            color: OOO_TYPE_COLORS[b.type] ?? '#94a3b8',
            backupName: b.backup_tam_id ? nameById[b.backup_tam_id] : null,
            start,
            end,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.startOffset - b.startOffset);
      return { id: tam.id, name: tam.name, region: tam.region, country: tam.country, bars };
    });
  }, [scopedTams, today, windowEnd, nameById]);

  // Daily count of people off — planned leave OR their country's public holiday.
  const offByDay = useMemo(() => {
    return days.map((day) =>
      scopedTams.reduce((count, tam) => {
        const onLeave = collectBlocks(tam).some((b) => {
          const s = toDay(b.start);
          const e = toDay(b.end);
          return s && e && day >= s && day <= e;
        });
        const onHoliday = Boolean(holidayByCountryDate.get(`${tam.country}|${format(day, 'yyyy-MM-dd')}`));
        return count + (onLeave || onHoliday ? 1 : 0);
      }, 0),
    );
  }, [days, scopedTams, holidayByCountryDate]);

  const totalOffDays = useMemo(
    () => rows.reduce((sum, r) => sum + r.bars.reduce((s, b) => s + b.span, 0), 0),
    [rows],
  );

  const trackWidth = WINDOW_DAYS * COL_WIDTH;
  const scopeLabel = scope === 'all' ? 'All people' : nameById[scope];

  const dateKey = (day) => format(day, 'yyyy-MM-dd');
  // Holiday for a specific TAM's country on a given day.
  const countryHoliday = (country, day) => holidayByCountryDate.get(`${country}|${dateKey(day)}`);
  // Holidays affecting any TAM currently in scope (for the header marker).
  const scopedCountries = useMemo(
    () => new Set(scopedTams.map((t) => t.country)),
    [scopedTams],
  );
  const headerHolidays = (day) =>
    (holidaysByDate.get(dateKey(day)) ?? []).filter((h) => scopedCountries.has(h.country));
  const isNonWorking = (day, country) => isWeekend(day) || Boolean(countryHoliday(country, day));

  return (
    <div className="tsx-overlay" role="presentation" onClick={onClose}>
      <div className="tsx" role="dialog" aria-label="Microsoft Teams Shifts" onClick={(e) => e.stopPropagation()}>
        <header className="tsx__chrome">
          <div className="tsx__brand">
            <span className="tsx__logo" aria-hidden="true">T</span>
            <div>
              <strong className="tsx__app">Shifts</strong>
              <span className="tsx__schedule">Sinch TAM Team — Time off</span>
            </div>
          </div>
          <button type="button" className="tsx__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="tsx__toolbar">
          <div className="tsx__toolbar-left">
            <span className="tsx__tbtn tsx__tbtn--today">▦ Today</span>
            <span className="tsx__nav">‹</span>
            <span className="tsx__nav">›</span>
            <span className="tsx__month">{format(today, 'MMMM yyyy')} ▾</span>
          </div>
          <div className="tsx__toolbar-right">
            <div className="tsx__people">
              <label htmlFor="tsx-scope" className="tsx__people-label">Filter</label>
              <select
                id="tsx-scope"
                className="tsx__select"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="all">All people</option>
                {tams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {scope !== 'all' && (
                <button type="button" className="tsx__viewall" onClick={() => setScope('all')}>View all</button>
              )}
            </div>
            <span className="tsx__tbtn">🗓 Month ▾</span>
            <span className="tsx__tbtn">🖨 Print</span>
            <span className="tsx__tbtn">⚙ View ▾</span>
          </div>
        </div>

        <div className="tsx__scroll">
          <div className="tsx__inner" style={{ minWidth: LABEL_WIDTH + trackWidth }}>
            {/* Column header — day numbers + weekday */}
            <div className="tsx__row tsx__row--head">
              <div className="tsx__rowlabel tsx__rowlabel--head" style={{ width: LABEL_WIDTH }}>
                Next 30 days · {format(today, 'MMM d')} – {format(windowEnd, 'MMM d')}
              </div>
              <div className="tsx__track" style={{ width: trackWidth }}>
                {days.map((day, i) => {
                  const hols = headerHolidays(day);
                  const holTitle = hols.length
                    ? hols.map((h) => `${h.country}: ${h.name}`).join('\n')
                    : (isWeekend(day) ? 'Weekend (non-working)' : undefined);
                  return (
                    <div
                      key={i}
                      className={[
                        'tsx__daycol',
                        isWeekend(day) ? 'tsx__daycol--weekend' : '',
                        hols.length ? 'tsx__daycol--holiday' : '',
                        i === 0 ? 'tsx__daycol--today' : '',
                      ].filter(Boolean).join(' ')}
                      style={{ width: COL_WIDTH }}
                      title={holTitle}
                    >
                      <span className="tsx__daynum">{format(day, 'd')}</span>
                      <span className="tsx__daywd">{format(day, 'EEEEEE')}</span>
                      {hols.length > 0 && <span className="tsx__holidot" aria-label="Public holiday" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary — people off per day */}
            <div className="tsx__row tsx__row--summary">
              <div className="tsx__rowlabel" style={{ width: LABEL_WIDTH }}>People off</div>
              <div className="tsx__track" style={{ width: trackWidth }}>
                {offByDay.map((count, i) => {
                  const weekend = isWeekend(days[i]);
                  return (
                    <div
                      key={i}
                      className={`tsx__daycell ${weekend ? 'tsx__daycell--weekend tsx__daycell--nonworking' : ''}`}
                      style={{ width: COL_WIDTH }}
                    >
                      {weekend ? 'Off' : (count > 0 ? count : '')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Group header */}
            <div className="tsx__group">
              <span className="tsx__group-caret">▾</span>
              <strong>Sinch TAM Team — Time off</strong>
              <span className="tsx__group-meta">{rows.length} people · {totalOffDays} days · {scopeLabel}</span>
            </div>

            {/* People rows */}
            {rows.map((row) => (
              <div className="tsx__row tsx__row--person" key={row.id}>
                <div className="tsx__rowlabel tsx__rowlabel--person" style={{ width: LABEL_WIDTH }}>
                  <span className="tsx__avatar">{row.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  <span className="tsx__person-meta">
                    <span className="tsx__person-name">{row.name}</span>
                    <span className="tsx__person-region">{row.country ?? row.region}</span>
                  </span>
                </div>
                <div className="tsx__track tsx__track--person" style={{ width: trackWidth }}>
                  {days.map((day, i) => {
                    const hol = countryHoliday(row.country, day);
                    return (
                      <div
                        key={i}
                        className={[
                          'tsx__gridcell',
                          isWeekend(day) ? 'tsx__gridcell--weekend' : '',
                          isNonWorking(day, row.country) ? 'tsx__gridcell--nonworking' : '',
                          i === 0 ? 'tsx__gridcell--today' : '',
                        ].filter(Boolean).join(' ')}
                        style={{ width: COL_WIDTH }}
                        title={hol ? `${hol} — ${row.country} public holiday (non-working)` : undefined}
                      />
                    );
                  })}
                  {row.bars.map((b, idx) => (
                    <div
                      key={idx}
                      className="tsx__shift"
                      style={{
                        left: b.startOffset * COL_WIDTH + 2,
                        width: b.span * COL_WIDTH - 4,
                        background: b.color,
                      }}
                      title={`${b.type} · ${format(b.start, 'MMM d')}${b.span > 1 ? ` – ${format(b.end, 'MMM d')}` : ''} · All day${b.backupName ? ` · Backup: ${b.backupName}` : ''}`}
                    >
                      <span className="tsx__shift-type">{b.type}</span>
                      <span className="tsx__shift-sub">All day</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="tsx__legend">
          {Object.entries(OOO_TYPE_COLORS).map(([type, color]) => (
            <span className="tsx__legend-item" key={type}>
              <span className="tsx__legend-swatch" style={{ background: color }} />
              {type}
            </span>
          ))}
          <span className="tsx__legend-item">
            <span className="tsx__legend-swatch tsx__legend-swatch--nonworking" />
            Non-working (weekend / holiday)
          </span>
          <span className="tsx__legend-note">TAMs do not work weekends or their local country public holidays · synced from Microsoft Teams Shifts</span>
        </footer>
      </div>
    </div>
  );
}
