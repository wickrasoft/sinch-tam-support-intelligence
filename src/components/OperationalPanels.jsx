import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
  enrichTamsWithAvailability,
  getTamAvailabilityStatus,
  normalizeTamRegion,
  sortTamsByAvailability,
  TAM_STATUS_CONFIG,
} from '../utils/tamStatus';
import TamStatusIcon from './TamStatusIcon';
import { DISPOSITION_LABELS } from './TicketsNeedingAttention';
import {
  getOperationalScope,
  getStaleTicketsByThreshold,
  getAgingTicketsByThreshold,
  getStaleThreshold,
  getAgingThreshold,
  STALE_THRESHOLDS,
  AGING_THRESHOLDS,
  hoursSinceLastUpdate,
  daysSinceCreated,
  formatStaleDuration,
} from '../utils/ticketOps';
import { TAM_REGIONS } from '../utils/regionMetrics';

function ThresholdChips({ thresholds, value, onChange, ariaLabel, variant }) {
  return (
    <div
      className={`ops-threshold-chips${variant ? ` ops-threshold-chips--${variant}` : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {thresholds.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`stale-threshold-chip ${value === t.id ? 'stale-threshold-chip--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.shortLabel}
        </button>
      ))}
    </div>
  );
}

export function StaleThresholdChips(props) {
  return (
    <ThresholdChips
      thresholds={STALE_THRESHOLDS}
      ariaLabel="Stale ticket threshold"
      variant="stale"
      {...props}
    />
  );
}

export function AgingThresholdChips(props) {
  return (
    <ThresholdChips
      thresholds={AGING_THRESHOLDS}
      ariaLabel="Aging ticket threshold"
      variant="aging"
      {...props}
    />
  );
}

export function RegionFilterChips({ value = '', onChange }) {
  return (
    <div
      className="ops-threshold-chips ops-threshold-chips--region"
      role="group"
      aria-label="Region filter"
    >
      <button
        type="button"
        className={`stale-threshold-chip ${!value ? 'stale-threshold-chip--active' : ''}`}
        onClick={() => onChange?.('')}
      >
        All
      </button>
      {TAM_REGIONS.map((region) => (
        <button
          key={region}
          type="button"
          className={`stale-threshold-chip ${value === region ? 'stale-threshold-chip--active' : ''}`}
          onClick={() => onChange?.(region)}
        >
          {region}
        </button>
      ))}
    </div>
  );
}

function OpsPanelFilters({ region, onRegionChange, children }) {
  return (
    <div className="ops-panel__filters">
      <RegionFilterChips value={region ?? ''} onChange={onRegionChange} />
      {children}
    </div>
  );
}

function OpsTicketListItem({ ticket, onOpenTicket, highlightValue }) {
  const disposition = ticket.disposition ?? 'in_progress';

  return (
    <button
      type="button"
      className={`ops-ticket-item ops-ticket-item--${disposition}`}
      onClick={() => onOpenTicket?.(ticket)}
    >
      <span className="ops-ticket-item__highlight">{highlightValue}</span>
      <span className={`priority priority--${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
      <span className="ops-ticket-item__id">#{ticket.zendesk_id}</span>
      <span className={`ops-ticket-status ops-ticket-status--${disposition}`}>
        {DISPOSITION_LABELS[disposition] ?? disposition}
      </span>
      <span className="ops-ticket-item__subject" title={ticket.subject}>{ticket.subject}</span>
      <span className="ops-ticket-item__meta">
        <span className="ops-ticket-item__account" title={ticket.account_name}>{ticket.account_name}</span>
        <span className="ops-ticket-item__tam" title={ticket.tam_name}>{ticket.tam_name}</span>
      </span>
    </button>
  );
}

function TamAvailabilityRow({ tam }) {
  const status = getTamAvailabilityStatus(tam);
  const statusLabel = TAM_STATUS_CONFIG[status]?.label ?? status;
  const defaultDetail = TAM_STATUS_CONFIG[status]?.detail;
  const details = [];

  if (status === 'vacation' && tam.vacation_until) {
    details.push(`Returns ${format(parseISO(tam.vacation_until), 'MMM d, yyyy')}`);
  }
  if (status === 'sick') {
    details.push(
      tam.sick_until
        ? `Returns ${format(parseISO(tam.sick_until), 'MMM d, yyyy')}`
        : 'Out sick',
    );
  }
  if ((status === 'vacation' || status === 'sick') && tam.backup_tam_name) {
    details.push(`Backup ${tam.backup_tam_name}`);
  }
  if (defaultDetail && status !== 'vacation' && status !== 'sick') {
    details.push(defaultDetail);
  }

  return (
    <div className={`tam-availability-item tam-availability-item--${status}`}>
      <span className={`tam-availability-status tam-availability-status--${status}`}>
        <TamStatusIcon status={status} className="tam-availability-status__icon" />
        {statusLabel}
      </span>
      <span className="tam-availability-item__name">{tam.name}</span>
      <span className="tam-availability-item__region">{normalizeTamRegion(tam.region)}</span>
      {details.map((detail) => (
        <span key={detail} className="tam-availability-item__detail">{detail}</span>
      ))}
    </div>
  );
}

export function TamAvailabilityPanel({ tams, referenceDate }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const resolvedTams = useMemo(
    () => enrichTamsWithAvailability(tams, referenceDate, now),
    [tams, referenceDate, now],
  );

  const sorted = useMemo(
    () => sortTamsByAvailability(resolvedTams, referenceDate, now),
    [resolvedTams, referenceDate, now],
  );

  const onlineCount = sorted.filter((t) => getTamAvailabilityStatus(t, referenceDate, now) === 'online').length;

  return (
    <article className="panel ops-panel">
      <header className="panel__header">
        <div className="ops-panel__title-row">
          <h2>TAM Availability - Live status by region — APAC, EMEA, LATAM, US</h2>
          <div className="ops-panel__count ops-panel__count--good">
            {onlineCount}/{sorted.length}
          </div>
        </div>
      </header>
      <div className="tam-availability-list">
        {sorted.map((tam) => (
          <TamAvailabilityRow key={tam.id} tam={tam} />
        ))}
      </div>
    </article>
  );
}

export const TamVacationPanel = TamAvailabilityPanel;

function StaleTicketRow({ ticket, referenceDate, onOpenTicket }) {
  const staleHours = hoursSinceLastUpdate(ticket, referenceDate);

  return (
    <OpsTicketListItem
      ticket={ticket}
      onOpenTicket={onOpenTicket}
      highlightValue={formatStaleDuration(staleHours)}
    />
  );
}

function AgingTicketRow({ ticket, referenceDate, onOpenTicket }) {
  const ageDays = daysSinceCreated(ticket, referenceDate);

  return (
    <OpsTicketListItem
      ticket={ticket}
      onOpenTicket={onOpenTicket}
      highlightValue={`${ageDays}d`}
    />
  );
}

export function StaleTicketsPanel({
  tickets,
  accounts,
  tams,
  filters,
  referenceDate,
  staleThresholdId,
  onStaleThresholdChange,
  onRegionChange,
  onOpenTicket,
  onViewAllStale,
}) {
  const scoped = getOperationalScope(tickets, accounts, filters, tams);
  const threshold = getStaleThreshold(staleThresholdId);
  const stale = getStaleTicketsByThreshold(scoped, referenceDate, staleThresholdId);
  const regionLabel = filters.region ? ` in ${filters.region}` : '';

  return (
    <article className="panel ops-panel">
      <header className="panel__header">
        <div className="ops-panel__title-row">
          <h2>Stale Tickets - Open Tickets with no Updates</h2>
          <div className="ops-panel__count ops-panel__count--warn">{stale.length}</div>
        </div>
      </header>

      <OpsPanelFilters region={filters.region} onRegionChange={onRegionChange}>
        <StaleThresholdChips
          value={staleThresholdId}
          onChange={onStaleThresholdChange}
        />
      </OpsPanelFilters>

      {stale.length === 0 ? (
        <p className="ops-panel__empty ops-panel__empty--good">
          No stale open tickets for {threshold.label.toLowerCase()}{regionLabel} in scope
        </p>
      ) : (
        <>
          <div className="ops-ticket-list">
            {stale.map((t) => (
              <StaleTicketRow
                key={t.id}
                ticket={t}
                referenceDate={referenceDate}
                onOpenTicket={onOpenTicket}
              />
            ))}
          </div>
          {stale.length > 6 && (
            <button
              type="button"
              className="panel__action ops-panel__more"
              onClick={() => onViewAllStale(staleThresholdId)}
            >
              View all {stale.length} stale tickets ({threshold.shortLabel}{filters.region ? ` · ${filters.region}` : ''})
            </button>
          )}
        </>
      )}
    </article>
  );
}

export function AgingTicketsPanel({
  tickets,
  accounts,
  tams,
  filters,
  referenceDate,
  agingThresholdId,
  onAgingThresholdChange,
  onRegionChange,
  onOpenTicket,
  onViewAllAging,
}) {
  const scoped = getOperationalScope(tickets, accounts, filters, tams);
  const threshold = getAgingThreshold(agingThresholdId);
  const aging = getAgingTicketsByThreshold(scoped, referenceDate, agingThresholdId);
  const regionLabel = filters.region ? ` in ${filters.region}` : '';

  return (
    <article className="panel ops-panel">
      <header className="panel__header">
        <div className="ops-panel__title-row">
          <h2>Aging Tickets - Unresolved Tickets by Age</h2>
          <div className="ops-panel__count ops-panel__count--critical">{aging.length}</div>
        </div>
      </header>

      <OpsPanelFilters region={filters.region} onRegionChange={onRegionChange}>
        <AgingThresholdChips
          value={agingThresholdId}
          onChange={onAgingThresholdChange}
        />
      </OpsPanelFilters>

      {aging.length === 0 ? (
        <p className="ops-panel__empty ops-panel__empty--good">
          No aging open tickets for {threshold.label.toLowerCase()}{regionLabel} in scope
        </p>
      ) : (
        <>
          <div className="ops-ticket-list">
            {aging.map((t) => (
              <AgingTicketRow
                key={t.id}
                ticket={t}
                referenceDate={referenceDate}
                onOpenTicket={onOpenTicket}
              />
            ))}
          </div>
          {aging.length > 6 && (
            <button
              type="button"
              className="panel__action ops-panel__more"
              onClick={() => onViewAllAging(agingThresholdId)}
            >
              View all {aging.length} aging tickets ({threshold.shortLabel}{filters.region ? ` · ${filters.region}` : ''})
            </button>
          )}
        </>
      )}
    </article>
  );
}

export default function OperationalPanels({
  staleThresholdId,
  onStaleThresholdChange,
  agingThresholdId,
  onAgingThresholdChange,
  onRegionChange,
  ...props
}) {
  return (
    <section className="grid grid--ops">
      <StaleTicketsPanel
        {...props}
        staleThresholdId={staleThresholdId}
        onStaleThresholdChange={onStaleThresholdChange}
        onRegionChange={onRegionChange}
      />
      <AgingTicketsPanel
        {...props}
        agingThresholdId={agingThresholdId}
        onAgingThresholdChange={onAgingThresholdChange}
        onRegionChange={onRegionChange}
      />
    </section>
  );
}
