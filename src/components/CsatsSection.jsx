import { useMemo } from 'react';
import { csatIndicator, groupCsatByAccount } from '../utils/metrics';
import { KPI_KEYS } from '../utils/kpiDrilldown';
import CsatFeedbackList from './CsatFeedbackList';

function ScoreRing({ score, max = 5, onClick }) {
  const pct = score != null ? (score / max) * 100 : 0;
  const csat = csatIndicator(score);

  const ring = (
    <div className="csat-ring" style={{ '--score-pct': `${pct}%`, '--ring-color': csat.color }}>
      <div className="csat-ring__inner">
        <span className="csat-ring__score">{score != null ? score.toFixed(1) : '—'}</span>
        <span className="csat-ring__max">/ {max}</span>
      </div>
    </div>
  );

  if (!onClick) return ring;

  return (
    <button type="button" className="csat-ring-btn" onClick={onClick} title="View all CSAT responses">
      {ring}
    </button>
  );
}

export default function CsatsSection({
  summary,
  ratedTickets = [],
  periodLabel,
  onDrilldown,
  onOpenTicket,
}) {
  const csat = csatIndicator(summary.avgCsat, summary.csatPct);
  const accountRanked = useMemo(() => groupCsatByAccount(ratedTickets), [ratedTickets]);
  const commentsCount = ratedTickets.filter((t) => t.csat?.comment).length;

  const openCsatDrilldown = () => onDrilldown?.(KPI_KEYS.CSAT);

  return (
    <article className="panel">
      <header className="panel__header">
        <h2>
          CSAT Scores and Feedback ({periodLabel ?? 'selected period'})
        </h2>
      </header>

      <div className="csat-overview">
        <ScoreRing score={summary.avgCsat} onClick={onDrilldown ? openCsatDrilldown : null} />
        <div className="csat-overview__details">
          <button
            type="button"
            className={`csat-badge csat-badge--clickable csat-badge--${csat.level}`}
            onClick={openCsatDrilldown}
            disabled={!onDrilldown}
          >
            {csat.label}
          </button>
          <p>
            <strong>{summary.csatPct != null ? `${summary.csatPct.toFixed(0)}%` : '—'}</strong>
            {' '}of ratings are Good or Excellent (4+)
          </p>
          <button
            type="button"
            className="csat-overview__link"
            onClick={openCsatDrilldown}
            disabled={!onDrilldown}
          >
            {summary.csatRatedCount} survey responses
            {commentsCount > 0 ? ` · ${commentsCount} with comments` : ''}
          </button>
        </div>
      </div>

      <div className="csat-feedback-section csat-feedback-section--scroll">
        <h3 className="panel__chart-title">
          All responses ({ratedTickets.length})
        </h3>
        <CsatFeedbackList
          tickets={ratedTickets}
          onOpenTicket={onOpenTicket}
        />
      </div>

      <div className="csat-list">
        <h3 className="panel__chart-title">By Account ({accountRanked.length})</h3>
        {accountRanked.length === 0 ? (
          <p className="muted">No CSAT responses in this period.</p>
        ) : (
          accountRanked.map((a) => {
            const ind = csatIndicator(a.avgCsat);
            return (
              <div key={a.account_id} className="csat-row">
                <span className="csat-row__name" title={a.tam_name}>{a.account_name}</span>
                <div className="csat-row__bar-wrap">
                  <div
                    className="csat-row__bar"
                    style={{ width: `${((a.avgCsat ?? 0) / 5) * 100}%`, background: ind.color }}
                  />
                </div>
                <span className="csat-row__score" style={{ color: ind.color }}>
                  {a.avgCsat.toFixed(1)}
                </span>
                <span className="csat-row__count">{a.responseCount}</span>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
