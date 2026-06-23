export default function TabNav({ activeTab, onChange, counts }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tams', label: 'TAMs', count: counts.tams },
    { id: 'accounts', label: 'Accounts', count: counts.accounts },
    { id: 'tickets', label: 'Tickets', count: counts.tickets },
  ];

  return (
    <nav className="tab-nav" aria-label="Dashboard sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav__btn ${activeTab === tab.id ? 'tab-nav__btn--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && (
            <span className="tab-nav__count">{tab.count}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
