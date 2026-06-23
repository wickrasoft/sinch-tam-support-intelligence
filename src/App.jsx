import { useMemo, useState, useCallback } from 'react';
import dataset from './data/tickets.json';
import FilterBar from './components/FilterBar';
import TabNav from './components/TabNav';
import ExportBar from './components/ExportBar';
import KPIDrilldownModal from './components/KPIDrilldownModal';
import AccountTable from './components/AccountTable';
import TicketFeed from './components/TicketFeed';
import TicketDetailModal from './components/TicketDetailModal';
import TamDirectory from './components/TamDirectory';
import OverviewDashboard from './components/OverviewDashboard';
import { StaleThresholdChips, AgingThresholdChips } from './components/OperationalPanels';
import {
  filterTickets,
  computeSummary,
  groupByAccount,
  groupByTam,
  buildTimeSeries,
  getPeriodBounds,
  getPreviousPeriodDate,
  getTicketsNeedingAttention,
  getCsatRatedTicketsInPeriod,
} from './utils/metrics';
import {
  getOperationalScope,
  getStaleTicketsByThreshold,
  getAgingTicketsByThreshold,
  DEFAULT_STALE_THRESHOLD_ID,
  DEFAULT_AGING_THRESHOLD_ID,
  getStaleThresholdLabel,
  getAgingThresholdLabel,
} from './utils/ticketOps';
import {
  enrichAccountMetrics,
  getAtRiskAccounts,
  buildComparisonSummary,
} from './utils/health';
import { getTicketsForKpi, getKpiFilterPatch, KPI_CONFIG } from './utils/kpiDrilldown';
import { format } from 'date-fns';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [operationalFilter, setOperationalFilter] = useState(null);
  const [staleThresholdId, setStaleThresholdId] = useState(DEFAULT_STALE_THRESHOLD_ID);
  const [agingThresholdId, setAgingThresholdId] = useState(DEFAULT_AGING_THRESHOLD_ID);
  const [activeKpiDrilldown, setActiveKpiDrilldown] = useState(null);
  const [drilldownContext, setDrilldownContext] = useState(null);
  const [ticketKpiFilter, setTicketKpiFilter] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({
    tamId: '',
    accountId: '',
    priority: '',
    disposition: '',
    slaBreachOnly: false,
    period: 'month',
    referenceDate: '2026-06-22',
  });

  const { tickets: allTickets, tams, accounts, meta } = dataset;

  const activeFilters = useMemo(
    () => ({
      ...filters,
      referenceDate: new Date(`${filters.referenceDate}T12:00:00`).toISOString(),
    }),
    [filters],
  );

  const previousFilters = useMemo(
    () => ({
      ...activeFilters,
      referenceDate: getPreviousPeriodDate(activeFilters.referenceDate, filters.period).toISOString(),
    }),
    [activeFilters, filters.period],
  );

  const filteredTickets = useMemo(
    () => filterTickets(allTickets, activeFilters),
    [allTickets, activeFilters],
  );

  const operationalTickets = useMemo(
    () => getOperationalScope(allTickets, accounts, filters),
    [allTickets, accounts, filters],
  );

  const displayTickets = useMemo(() => {
    if (operationalFilter === 'stale') {
      return getStaleTicketsByThreshold(operationalTickets, activeFilters.referenceDate, staleThresholdId);
    }
    if (operationalFilter === 'aging') {
      return getAgingTicketsByThreshold(operationalTickets, activeFilters.referenceDate, agingThresholdId);
    }
    if (ticketKpiFilter) {
      return getTicketsForKpi(filteredTickets, ticketKpiFilter, {
        allTickets,
        filters: activeFilters,
      });
    }
    if (attentionOnly) {
      return filteredTickets.filter((t) => t.needs_attention);
    }
    return filteredTickets;
  }, [filteredTickets, allTickets, activeFilters, operationalTickets, attentionOnly, ticketKpiFilter, operationalFilter, staleThresholdId, agingThresholdId]);

  const previousTickets = useMemo(
    () => filterTickets(allTickets, previousFilters),
    [allTickets, previousFilters],
  );

  const summary = useMemo(
    () => computeSummary(filteredTickets, allTickets, activeFilters),
    [filteredTickets, allTickets, activeFilters],
  );

  const previousSummary = useMemo(
    () => computeSummary(previousTickets, allTickets, previousFilters),
    [previousTickets, allTickets, previousFilters],
  );

  const comparison = useMemo(
    () => buildComparisonSummary(summary, previousSummary),
    [summary, previousSummary],
  );

  const accountMetrics = useMemo(
    () => enrichAccountMetrics(groupByAccount(filteredTickets, allTickets, activeFilters)),
    [filteredTickets, allTickets, activeFilters],
  );

  const atRiskAccounts = useMemo(
    () => getAtRiskAccounts(accountMetrics),
    [accountMetrics],
  );

  const tamMetrics = useMemo(
    () => groupByTam(filteredTickets, allTickets, activeFilters, accounts, tams),
    [filteredTickets, allTickets, activeFilters, accounts, tams],
  );

  const attentionTickets = useMemo(
    () => getTicketsNeedingAttention(filteredTickets, 50),
    [filteredTickets],
  );

  const ratedTickets = useMemo(
    () => getCsatRatedTicketsInPeriod(allTickets, activeFilters),
    [allTickets, activeFilters],
  );

  const timeSeries = useMemo(
    () => buildTimeSeries(allTickets, activeFilters, 12),
    [allTickets, activeFilters],
  );

  const periodBounds = getPeriodBounds(activeFilters.referenceDate, filters.period);
  const periodLabel = `${format(periodBounds.start, 'MMM d, yyyy')} – ${format(periodBounds.end, 'MMM d, yyyy')}`;

  const handleSelectAccount = useCallback((accountId) => {
    setFilters((prev) => ({
      ...prev,
      accountId: prev.accountId === accountId ? '' : accountId,
    }));
    setActiveTab('accounts');
  }, []);

  const handleFilterTam = useCallback((tamId) => {
    setFilters((prev) => ({
      ...prev,
      tamId,
      accountId: '',
    }));
  }, []);

  const handleViewAttentionTickets = useCallback(() => {
    setAttentionOnly(true);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveTab('tickets');
  }, []);

  const handleViewStaleTickets = useCallback((thresholdId = DEFAULT_STALE_THRESHOLD_ID) => {
    setStaleThresholdId(thresholdId);
    setOperationalFilter('stale');
    setAttentionOnly(false);
    setTicketKpiFilter(null);
    setActiveTab('tickets');
  }, []);

  const handleViewAgingTickets = useCallback((thresholdId = DEFAULT_AGING_THRESHOLD_ID) => {
    setAgingThresholdId(thresholdId);
    setOperationalFilter('aging');
    setAttentionOnly(false);
    setTicketKpiFilter(null);
    setActiveTab('tickets');
  }, []);

  const handleKpiDrilldown = useCallback((kpiKey, context = null) => {
    setActiveKpiDrilldown(kpiKey);
    setDrilldownContext(context);
  }, []);

  const handleKpiViewAll = useCallback((kpiKey) => {
    const patch = getKpiFilterPatch(kpiKey);
    const { kpiFilter, ...filterPatch } = patch;
    setFilters((prev) => ({
      ...prev,
      ...filterPatch,
      ...(drilldownContext?.tamId ? { tamId: drilldownContext.tamId, accountId: '' } : {}),
    }));
    setTicketKpiFilter(kpiFilter ?? kpiKey);
    setAttentionOnly(false);
    setActiveKpiDrilldown(null);
    setDrilldownContext(null);
    setActiveTab('tickets');
  }, [drilldownContext]);

  const clearTicketFilters = useCallback(() => {
    setAttentionOnly(false);
    setOperationalFilter(null);
    setStaleThresholdId(DEFAULT_STALE_THRESHOLD_ID);
    setAgingThresholdId(DEFAULT_AGING_THRESHOLD_ID);
    setTicketKpiFilter(null);
  }, []);

  const openTicket = useCallback((ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const closeTicket = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  const tabCounts = {
    tams: tams.length,
    accounts: accountMetrics.length,
    tickets: filteredTickets.length,
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-wrap">
            <img src="/sinch-logo.svg" alt="Sinch" className="header__logo" width="124" height="32" />
          </div>
          <div>
            <h1>Sinch TAM Support Intelligence</h1>
            <p className="header__subtitle">
              {tams.length} TAMs · {accounts.length} Sinch messaging accounts · SMS, 10DLC, Conversation API
            </p>
          </div>
        </div>
        <div className="header__meta">
          <span className="badge badge--demo">{meta.source}</span>
          <span className="header__range">{periodLabel}</span>
        </div>
      </header>

      <FilterBar
        filters={filters}
        onChange={(f) => {
          setFilters(f);
          clearTicketFilters();
          setActiveKpiDrilldown(null);
          setDrilldownContext(null);
        }}
        tams={tams}
        accounts={accounts}
      />

      <div className="toolbar">
        <TabNav
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'tickets') clearTicketFilters();
          }}
          counts={tabCounts}
        />
        <ExportBar
          filteredTickets={filteredTickets}
          periodLabel={periodLabel}
          filters={filters}
          summary={summary}
          comparison={comparison}
          accountMetrics={accountMetrics}
          atRiskAccounts={atRiskAccounts}
          tams={tams}
        />
      </div>

      <main className="main">
        {filteredTickets.length === 0 && (
          <div className="empty-state empty-state--banner">
            No tickets in this period for the selected filters. Try a different date range or clear filters.
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard
            summary={summary}
            comparison={comparison}
            onDrilldown={handleKpiDrilldown}
            tams={tams}
            allTickets={allTickets}
            accounts={accounts}
            filters={filters}
            referenceDate={activeFilters.referenceDate}
            staleThresholdId={staleThresholdId}
            onStaleThresholdChange={setStaleThresholdId}
            agingThresholdId={agingThresholdId}
            onAgingThresholdChange={setAgingThresholdId}
            onOpenTicket={openTicket}
            onViewAllStale={handleViewStaleTickets}
            onViewAllAging={handleViewAgingTickets}
            attentionTickets={attentionTickets}
            onViewAttentionTickets={handleViewAttentionTickets}
            atRiskAccounts={atRiskAccounts}
            onSelectAccount={handleSelectAccount}
            accountMetrics={accountMetrics}
            ratedTickets={ratedTickets}
            periodLabel={periodLabel}
            timeSeries={timeSeries}
            tamMetrics={tamMetrics}
            onFilterTam={handleFilterTam}
          />
        )}

        {activeTab === 'tams' && (
          <TamDirectory
            tams={tams}
            tamMetrics={tamMetrics}
            referenceDate={activeFilters.referenceDate}
            onFilterTam={handleFilterTam}
            onSelectAccount={handleSelectAccount}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountTable
            accountMetrics={accountMetrics}
            onSelectAccount={handleSelectAccount}
            selectedAccountId={filters.accountId}
          />
        )}

        {activeTab === 'tickets' && (
          <>
            {(attentionOnly || ticketKpiFilter || operationalFilter) && (
              <div className="filter-banner">
                {ticketKpiFilter && KPI_CONFIG[ticketKpiFilter]?.title}
                {attentionOnly && 'Showing tickets needing attention only'}
                {operationalFilter === 'stale' && (
                  <>
                    <span>
                      Stale open tickets — no update in {getStaleThresholdLabel(staleThresholdId).toLowerCase()}
                    </span>
                    <StaleThresholdChips
                      value={staleThresholdId}
                      onChange={setStaleThresholdId}
                    />
                  </>
                )}
                {operationalFilter === 'aging' && (
                  <>
                    <span>
                      Aging open tickets — {getAgingThresholdLabel(agingThresholdId).toLowerCase()}+
                    </span>
                    <AgingThresholdChips
                      value={agingThresholdId}
                      onChange={setAgingThresholdId}
                    />
                  </>
                )}
                <button type="button" onClick={clearTicketFilters}>Clear</button>
              </div>
            )}
            <TicketFeed tickets={displayTickets} total={displayTickets.length} onOpenTicket={openTicket} />
          </>
        )}
      </main>

      {activeKpiDrilldown && (
        <KPIDrilldownModal
          kpiKey={activeKpiDrilldown}
          tickets={filteredTickets}
          allTickets={allTickets}
          filters={activeFilters}
          drilldownContext={drilldownContext}
          tams={tams}
          previousFilters={previousFilters}
          summary={summary}
          comparison={comparison}
          previousSummary={previousSummary}
          periodLabel={periodLabel}
          onClose={() => {
            setActiveKpiDrilldown(null);
            setDrilldownContext(null);
          }}
          onViewAll={handleKpiViewAll}
          onOpenTicket={openTicket}
        />
      )}

      <TicketDetailModal ticket={selectedTicket} onClose={closeTicket} />

      <footer className="footer">
        <p>
          {allTickets.length.toLocaleString()} tickets · {tams.length} TAMs · {accounts.length} accounts
          · Data from {format(new Date(meta.date_range.start), 'MMM yyyy')} – {format(new Date(meta.date_range.end), 'MMM yyyy')}
        </p>
      </footer>
    </div>
  );
}

export default App;
