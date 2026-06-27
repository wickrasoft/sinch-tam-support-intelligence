import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';

const WINDOW_DAYS = 30;

const OOO_TYPE_COLORS = {
  Vacation: '#fbbf24',
  'Public Holiday': '#38bdf8',
  Training: '#a78bfa',
  Conference: '#34d399',
  'Sick Leave': '#f472b6',
  Personal: '#94a3b8',
};

const OOO_TYPE_ORDER = ['Vacation', 'Public Holiday', 'Training', 'Conference', 'Sick Leave', 'Personal'];

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
  // Fold legacy single vacation/sick ranges into the OOO view too.
  if (av.vacation) {
    blocks.push({ type: 'Vacation', start: av.vacation.start, end: av.vacation.end, backup_tam_id: av.backup_tam_id, source: 'Microsoft Teams Shifts' });
  }
  if (av.sick) {
    blocks.push({ type: 'Sick Leave', start: av.sick.start, end: av.sick.end, backup_tam_id: av.backup_tam_id, source: 'Microsoft Teams Shifts' });
  }
  return blocks;
}

export default function TamOOOPanel({ tams = [], referenceDate, onOpen }) {
  const today = useMemo(
    () => startOfDay(referenceDate ? parseISO(referenceDate) : new Date()),
    [referenceDate],
  );
  const windowEnd = useMemo(() => addDays(today, WINDOW_DAYS), [today]);

  const nameById = useMemo(() => {
    const map = {};
    tams.forEach((t) => { map[t.id] = t.name; });
    return map;
  }, [tams]);

  const { rows, typesPresent, totalDaysOut } = useMemo(() => {
    const result = [];
    const typeSet = new Set();
    let dayCount = 0;

    tams.forEach((tam) => {
      const blocks = collectBlocks(tam)
        .map((b) => {
          const start = toDay(b.start);
          const end = toDay(b.end);
          if (!start || !end) return null;
          return { ...b, start, end };
        })
        .filter((b) => b && b.end >= today && b.start <= windowEnd)
        .map((b) => {
          const clippedStart = b.start < today ? today : b.start;
          const clippedEnd = b.end > windowEnd ? windowEnd : b.end;
          const startOffset = differenceInCalendarDays(clippedStart, today);
          const span = differenceInCalendarDays(clippedEnd, clippedStart) + 1;
          typeSet.add(b.type);
          dayCount += span;
          return {
            ...b,
            startOffset,
            span,
            leftPct: clamp((startOffset / WINDOW_DAYS) * 100, 0, 100),
            widthPct: clamp((span / WINDOW_DAYS) * 100, 1.5, 100),
            color: OOO_TYPE_COLORS[b.type] ?? '#94a3b8',
            backupName: b.backup_tam_id ? nameById[b.backup_tam_id] : null,
          };
        })
        .sort((a, b) => a.startOffset - b.startOffset);

      if (blocks.length) {
        result.push({
          id: tam.id,
          name: tam.name,
          region: tam.region,
          nextStart: blocks[0].startOffset,
          blocks,
        });
      }
    });

    result.sort((a, b) => a.nextStart - b.nextStart);
    const types = OOO_TYPE_ORDER.filter((t) => typeSet.has(t));
    return { rows: result, typesPresent: types, totalDaysOut: dayCount };
  }, [tams, today, windowEnd, nameById]);

  // Weekly gridlines (every 7 days).
  const weekMarks = useMemo(() => {
    const marks = [];
    for (let d = 0; d <= WINDOW_DAYS; d += 7) {
      marks.push({ offset: d, leftPct: (d / WINDOW_DAYS) * 100, label: format(addDays(today, d), 'MMM d') });
    }
    return marks;
  }, [today]);

  return (
    <section className="tam-ooo">
      <header className="tam-ooo__header">
        <div className="tam-ooo__title-row">
          {onOpen ? (
            <button
              type="button"
              className="tam-ooo__title tam-ooo__title--btn"
              onClick={() => onOpen(null)}
              title="Open Microsoft Teams Shifts (next 30 days)"
            >
              <span className="tam-ooo__teams-icon" aria-hidden="true">T</span>
              Planned Out-of-Office - Next 30 Days
              <span className="tam-ooo__open-hint">Open in Teams ↗</span>
            </button>
          ) : (
            <h3 className="tam-ooo__title">
              <span className="tam-ooo__teams-icon" aria-hidden="true">T</span>
              Planned Out-of-Office - Next 30 Days
            </h3>
          )}
          <span className="tam-ooo__source" title="Synced from Microsoft Teams Shifts">
            <span className="tam-ooo__dot" /> Synced from Microsoft Teams Shifts
          </span>
        </div>
        <p className="tam-ooo__subtitle">
          {rows.length} of {tams.length} TAMs have planned leave · {totalDaysOut} OOO days
          {' '}between {format(today, 'MMM d')} and {format(windowEnd, 'MMM d, yyyy')}
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="tam-ooo__empty">No planned out-of-office in the next 30 days.</p>
      ) : (
        <>
          <div className="tam-ooo__axis">
            <div className="tam-ooo__axis-spacer" />
            <div className="tam-ooo__axis-track">
              {weekMarks.map((m) => (
                <span key={m.offset} className="tam-ooo__axis-mark" style={{ left: `${m.leftPct}%` }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="tam-ooo__rows">
            {rows.map((row) => (
              <div
                className={`tam-ooo__row ${onOpen ? 'tam-ooo__row--clickable' : ''}`}
                key={row.id}
                role={onOpen ? 'button' : undefined}
                tabIndex={onOpen ? 0 : undefined}
                onClick={onOpen ? () => onOpen(row.id) : undefined}
                onKeyDown={onOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(row.id); } } : undefined}
                title={onOpen ? `Open ${row.name} in Teams Shifts` : undefined}
              >
                <div className="tam-ooo__row-label">
                  <span className="tam-ooo__row-name">{row.name}</span>
                  <span className="tam-ooo__row-region">{row.region}</span>
                </div>
                <div className="tam-ooo__row-track">
                  {weekMarks.map((m) => (
                    <span key={m.offset} className="tam-ooo__gridline" style={{ left: `${m.leftPct}%` }} />
                  ))}
                  {row.blocks.map((b, i) => (
                    <div
                      key={i}
                      className="tam-ooo__bar"
                      style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%`, background: b.color }}
                      title={`${b.type}: ${format(b.start, 'MMM d')}${b.span > 1 ? ` – ${format(b.end, 'MMM d')}` : ''}${b.backupName ? ` · Backup: ${b.backupName}` : ''}`}
                    >
                      <span className="tam-ooo__bar-label">{b.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="tam-ooo__legend">
            {typesPresent.map((t) => (
              <span className="tam-ooo__legend-item" key={t}>
                <span className="tam-ooo__legend-swatch" style={{ background: OOO_TYPE_COLORS[t] }} />
                {t}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
