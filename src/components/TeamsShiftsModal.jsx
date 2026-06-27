import { useEffect } from 'react';
import { openTeamsShifts } from '../utils/teams';
import ShiftsGrid from './ShiftsGrid';
import './TeamsShifts.css';

export default function TeamsShiftsModal({ tams = [], referenceDate, publicHolidays = [], initialTamId = null, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          <div className="tsx__chrome-actions">
            <button
              type="button"
              className="tsx__open-teams"
              onClick={openTeamsShifts}
              title="Open Microsoft Teams Shifts in the desktop app"
            >
              <span className="tsx__open-teams-icon" aria-hidden="true">T</span>
              Open in Teams
            </button>
            <button type="button" className="tsx__close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>

        <ShiftsGrid
          tams={tams}
          referenceDate={referenceDate}
          publicHolidays={publicHolidays}
          initialTamId={initialTamId}
        />
      </div>
    </div>
  );
}
