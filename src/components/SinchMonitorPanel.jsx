import { useState } from 'react';

const MONITOR_URL = 'https://monitor.sinch.com/';

// Sinch's external uptime monitoring board (Checkly-powered). It resolves the
// dashboard by its own host, so embedding it in an iframe renders the live board
// exactly as it appears on monitor.sinch.com.
export default function SinchMonitorPanel() {
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="panel sinc-mon">
      <header className="panel__header sinc-mon__header">
        <div className="sinc-mon__title-row">
          <h2 className="sinc-mon__title">
            <span className="sinc-mon__swatch" aria-hidden="true" />
            Uptime Monitoring
          </h2>
          <span className="sinc-mon__source" title="Live from monitor.sinch.com">
            monitor.sinch.com
          </span>
        </div>
        <p className="sinc-mon__subtitle">
          External uptime checks
          {' · '}
          <a href={MONITOR_URL} target="_blank" rel="noopener noreferrer" className="sinc-mon__link">
            Open monitor ↗
          </a>
        </p>
      </header>

      <div className="sinc-mon__frame-wrap">
        {!loaded && (
          <p className="sinc-mon__loading">Loading monitor.sinch.com…</p>
        )}
        <iframe
          title="Sinch External Uptime Monitoring"
          src={MONITOR_URL}
          className="sinc-mon__frame"
          loading="lazy"
          scrolling="no"
          onLoad={() => setLoaded(true)}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </article>
  );
}
