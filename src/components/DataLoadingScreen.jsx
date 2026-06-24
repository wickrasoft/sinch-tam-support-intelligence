import AppTitle from './AppTitle';

export default function DataLoadingScreen({ error = null }) {
  return (
    <div className="data-loading">
      <div className="data-loading__card">
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
            <AppTitle className="app-title--loading" />
            <p>Loading support portfolio data…</p>
            <div className="data-loading__spinner" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
