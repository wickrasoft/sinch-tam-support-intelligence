import { tamStatusSuffix } from '../utils/tamStatus';
import { TICKET_STATUS_OPTIONS, getTicketStatusLabel } from '../utils/ticketOps';

export default function FilterBar({ filters, onChange, tams, accounts }) {
  const referenceAt = filters.referenceDate
    ? new Date(`${filters.referenceDate}T12:00:00`)
    : new Date();

  const filteredAccounts = filters.tamId
    ? accounts.filter((a) => a.tam_id === filters.tamId)
    : accounts;

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key === 'tamId') next.accountId = '';
    onChange(next);
  };

  const activeChips = [
    filters.tamId && { key: 'tamId', label: tams.find((t) => t.id === filters.tamId)?.name },
    filters.accountId && { key: 'accountId', label: accounts.find((a) => a.id === filters.accountId)?.name },
    filters.priority && { key: 'priority', label: filters.priority },
    filters.disposition && { key: 'disposition', label: getTicketStatusLabel(filters.disposition) },
    filters.slaBreachOnly && { key: 'slaBreachOnly', label: 'SLA Breached Only' },
  ].filter(Boolean);

  const removeChip = (key) => {
    if (key === 'slaBreachOnly') update(key, false);
    else update(key, key === 'slaBreachOnly' ? false : '');
  };

  return (
    <div className="filter-section">
      <div className="filter-bar">
        <div className="filter-bar__group">
          <label htmlFor="period">Period</label>
          <select
            id="period"
            value={filters.period}
            onChange={(e) => update('period', e.target.value)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>

        <div className="filter-bar__group">
          <label htmlFor="referenceDate">Reference Date</label>
          <input
            id="referenceDate"
            type="date"
            value={filters.referenceDate}
            onChange={(e) => update('referenceDate', e.target.value)}
          />
        </div>

        <div className="filter-bar__group">
          <label htmlFor="tam">TAM</label>
          <select
            id="tam"
            value={filters.tamId}
            onChange={(e) => update('tamId', e.target.value)}
          >
            <option value="">All TAMs</option>
            {tams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{tamStatusSuffix(t, true, referenceAt)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-bar__group">
          <label htmlFor="account">Account</label>
          <select
            id="account"
            value={filters.accountId}
            onChange={(e) => update('accountId', e.target.value)}
          >
            <option value="">All Accounts</option>
            {filteredAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-bar__group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={filters.priority}
            onChange={(e) => update('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — High</option>
            <option value="P3">P3 — Normal</option>
            <option value="P4">P4 — Low</option>
          </select>
        </div>

        <div className="filter-bar__group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.disposition ?? ''}
            onChange={(e) => update('disposition', e.target.value)}
          >
            <option value="">All Statuses</option>
            {TICKET_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <label className="filter-bar__toggle">
          <input
            type="checkbox"
            checked={filters.slaBreachOnly}
            onChange={(e) => update('slaBreachOnly', e.target.checked)}
          />
          SLA breaches only
        </label>

        <button
          type="button"
          className="filter-bar__reset"
          onClick={() =>
            onChange({
              tamId: '',
              accountId: '',
              priority: '',
              disposition: '',
              slaBreachOnly: false,
              period: 'month',
              referenceDate: '2026-06-22',
            })
          }
        >
          Reset
        </button>
      </div>

      {activeChips.length > 0 && (
        <div className="filter-chips">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => removeChip(chip.key)}
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
