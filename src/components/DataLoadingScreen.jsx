export default function DataLoadingScreen({ error = null }) {
  return (
    <div className="data-loading">
      <div className="data-loading__card">
        <img
          src="/sinch-logo.png"
          alt="Sinch"
          className="data-loading__logo"
          width="160"
          height="64"
        />
        {error ? (
          <>
            <h1>Unable to load dashboard data</h1>
            <p className="data-loading__error">{error.message}</p>
            <button
              type="button"
              className="data-loading__retry"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <h1>Sinch TAM Support Intelligence</h1>
            <p>Loading support portfolio data…</p>
            <div className="data-loading__spinner" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
