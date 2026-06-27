import { useMemo } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import { openTeamsShifts } from '../utils/teams';
import ShiftsGrid from './ShiftsGrid';

const WINDOW_DAYS = 30;

function toDay(value) {
  if (!value) return null;
  return startOfDay(typeof value === 'string' ? parseISO(value) : value);
}

function collectBlocks(tam) {
  // Planned OOO only — sick leave is unplanned, so it never appears here.
  const av = tam.availability ?? {};
  const blocks = [...(av.ooo ?? [])];
  if (av.vacation) {
    blocks.push({ type: 'Vacation', start: av.vacation.start, end: av.vacation.end });
  }
  return blocks;
}

export default function TamOOOPanel({ tams = [], referenceDate, publicHolidays = [], onOpen }) {
  const today = useMemo(
    () => startOfDay(referenceDate ? parseISO(referenceDate) : new Date()),
    [referenceDate],
  );
  const windowEnd = useMemo(() => addDays(today, WINDOW_DAYS - 1), [today]);

  const { peopleWithLeave, totalDaysOut } = useMemo(() => {
    let people = 0;
    let dayCount = 0;
    tams.forEach((tam) => {
      let tamDays = 0;
      collectBlocks(tam).forEach((b) => {
        const start = toDay(b.start);
        const end = toDay(b.end);
        if (!start || !end || end < today || start > windowEnd) return;
        const clippedStart = start < today ? today : start;
        const clippedEnd = end > windowEnd ? windowEnd : end;
        tamDays += differenceInCalendarDays(clippedEnd, clippedStart) + 1;
      });
      if (tamDays > 0) { people += 1; dayCount += tamDays; }
    });
    return { peopleWithLeave: people, totalDaysOut: dayCount };
  }, [tams, today, windowEnd]);

  return (
    <section className="tam-ooo">
      <header className="tam-ooo__header">
        <div className="tam-ooo__title-row">
          {onOpen ? (
            <button
              type="button"
              className="tam-ooo__title tam-ooo__title--btn"
              onClick={() => onOpen(null)}
              title="Open the Shifts view full screen (next 30 days)"
            >
              <span className="tam-ooo__teams-icon" aria-hidden="true">T</span>
              Planned Out-of-Office - Next 30 Days
              <span className="tam-ooo__open-hint">Expand ↗</span>
            </button>
          ) : (
            <h3 className="tam-ooo__title">
              <span className="tam-ooo__teams-icon" aria-hidden="true">T</span>
              Planned Out-of-Office - Next 30 Days
            </h3>
          )}
          <div className="tam-ooo__header-actions">
            <button
              type="button"
              className="tam-ooo__open-teams"
              onClick={openTeamsShifts}
              title="Open Microsoft Teams Shifts in the desktop app"
            >
              <span className="tam-ooo__open-teams-icon" aria-hidden="true">T</span>
              Open in Teams
            </button>
            <span className="tam-ooo__source" title="Synced from Microsoft Teams Shifts">
              <span className="tam-ooo__dot" /> Synced from Microsoft Teams Shifts
            </span>
          </div>
        </div>
        <p className="tam-ooo__subtitle">
          {peopleWithLeave} of {tams.length} TAMs have planned leave · {totalDaysOut} OOO days
          {' '}between {format(today, 'MMM d')} and {format(windowEnd, 'MMM d, yyyy')}
        </p>
      </header>

      <div className="tsx tsx--embedded">
        <ShiftsGrid
          tams={tams}
          referenceDate={referenceDate}
          publicHolidays={publicHolidays}
        />
      </div>
    </section>
  );
}
