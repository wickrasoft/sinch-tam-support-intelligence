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
import AccountHealthDrilldownModal from './components/AccountHealthDrilldownModal';
import AtRiskAccountsDrilldownModal from './components/AtRiskAccountsDrilldownModal';
import AttentionTicketsDrilldownModal from './components/AttentionTicketsDrilldownModal';
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
import { buildRegionPortfolioDistribution } from './utils/regionMetrics';
import { format, parseISO } from 'date-fns';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [operationalFilter, setOperationalFilter] = useState(null);
  const [staleThresholdId, setStaleThresholdId] = useState(DEFAULT_STALE_THRESHOLD_ID);
  const [agingThresholdId, setAgingThresholdId] = useState(DEFAULT_AGING_THRESHOLD_ID);
  const [activeRegionDrilldown, setActiveRegionDrilldown] = useState(null);
  const [activeKpiDrilldown, setActiveKpiDrilldown] = useState(null);
  const [drilldownContext, setDrilldownContext] = useState(null);
  const [activeAccountHealthDrilldown, setActiveAccountHealthDrilldown] = useState(null);
  const [showAtRiskDrilldown, setShowAtRiskDrilldown] = useState(false);
  const [showAttentionDrilldown, setShowAttentionDrilldown] = useState(false);
  const [accountsAtRiskOnly, setAccountsAtRiskOnly] = useState(false);
  const [atRiskReturnPending, setAtRiskReturnPending] = useState(false);
  const [attentionReturnPending, setAttentionReturnPending] = useState(false);
  const [ticketKpiFilter, setTicketKpiFilter] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({
    tamId: '',
    accountId: '',
    priority: '',
    disposition: '',
    region: '',
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
    () => filterTickets(allTickets, activeFilters, { tams }),
    [allTickets, activeFilters, tams],
  );

  const operationalTickets = useMemo(
    () => getOperationalScope(allTickets, accounts, filters),
    [allTickets, accounts, filters],
  );

  const previousTickets = useMemo(
    () => filterTickets(allTickets, previousFilters, { tams }),
    [allTickets, previousFilters, tams],
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

  const previousAccountMetrics = useMemo(
    () => enrichAccountMetrics(groupByAccount(previousTickets, allTickets, previousFilters)),
    [previousTickets, allTickets, previousFilters],
  );

  const activeAccountHealthData = useMemo(() => {
    if (!activeAccountHealthDrilldown) return null;
    const current = accountMetrics.find((row) => row.account_id === activeAccountHealthDrilldown);
    if (!current) return null;
    const previous = previousAccountMetrics.find((row) => row.account_id === activeAccountHealthDrilldown);
    return { current, previous };
  }, [activeAccountHealthDrilldown, accountMetrics, previousAccountMetrics]);

  const atRiskAccounts = useMemo(
    () => getAtRiskAccounts(accountMetrics),
    [accountMetrics],
  );

  const displayTickets = useMemo(() => {
    if (operationalFilter === 'at-risk-attention') {
      const ids = new Set(atRiskAccounts.map((a) => a.account_id));
      return filteredTickets.filter((t) => ids.has(t.account_id) && t.needs_attention);
    }
    if (operationalFilter === 'at-risk') {
      const ids = new Set(atRiskAccounts.map((a) => a.account_id));
      return filteredTickets.filter((t) => ids.has(t.account_id));
    }
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
  }, [filteredTickets, allTickets, activeFilters, operationalTickets, attentionOnly, ticketKpiFilter, operationalFilter, staleThresholdId, agingThresholdId, atRiskAccounts]);

  const filtersWithoutRegion = useMemo(
    () => ({ ...activeFilters, region: '' }),
    [activeFilters],
  );

  const ticketsForRegionChart = useMemo(
    () => filterTickets(allTickets, filtersWithoutRegion, { tams }),
    [allTickets, filtersWithoutRegion, tams],
  );

  const tamMetrics = useMemo(
    () => groupByTam(filteredTickets, allTickets, activeFilters, accounts, tams),
    [filteredTickets, allTickets, activeFilters, accounts, tams],
  );

  const regionChartTamMetrics = useMemo(
    () => groupByTam(ticketsForRegionChart, allTickets, filtersWithoutRegion, accounts, tams),
    [ticketsForRegionChart, allTickets, filtersWithoutRegion, accounts, tams],
  );

  const regionDistribution = useMemo(
    () => buildRegionPortfolioDistribution(regionChartTamMetrics, tams),
    [regionChartTamMetrics, tams],
  );

  const activeRegionData = useMemo(() => {
    const row = regionDistribution.find((entry) => entry.region === activeRegionDrilldown);
    if (!row) return null;
    return {
      ...row,
      __portfolioTotal: regionDistribution.reduce((sum, entry) => sum + entry.value, 0),
    };
  }, [regionDistribution, activeRegionDrilldown]);

  const attentionTickets = useMemo(
    () => getTicketsNeedingAttention(filteredTickets),
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

  const handleAccountHealthDrilldown = useCallback((accountId) => {
    setActiveAccountHealthDrilldown(accountId);
  }, []);

  const handleAccountFilterPortfolio = useCallback((accountId) => {
    setFilters((prev) => ({
      ...prev,
      accountId,
      tamId: '',
    }));
    setActiveAccountHealthDrilldown(null);
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveTab('overview');
  }, []);

  const handleAccountViewTickets = useCallback((accountId) => {
    setFilters((prev) => ({
      ...prev,
      accountId,
      priority: '',
      disposition: '',
      slaBreachOnly: false,
    }));
    setActiveAccountHealthDrilldown(null);
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveTab('tickets');
  }, []);

  const handleAccountViewDetail = useCallback((accountId) => {
    setFilters((prev) => ({
      ...prev,
      accountId,
    }));
    setActiveAccountHealthDrilldown(null);
    setActiveTab('accounts');
  }, []);

  const handleViewAllAccounts = useCallback(() => {
    setShowAtRiskDrilldown(false);
    setActiveAccountHealthDrilldown(null);
    setAccountsAtRiskOnly(true);
    setAtRiskReturnPending(true);
    setFilters((prev) => ({ ...prev, accountId: '' }));
    setActiveTab('accounts');
  }, []);

  const handleOpenAtRiskDrilldown = useCallback(() => {
    setShowAtRiskDrilldown(true);
  }, []);

  const handleCloseAtRiskDrilldown = useCallback(() => {
    setShowAtRiskDrilldown(false);
  }, []);

  const handleAtRiskFilterPortfolio = useCallback(() => {
    setShowAtRiskDrilldown(false);
    setActiveTab('overview');
  }, []);

  const handleAtRiskAccountDrilldown = useCallback((accountId) => {
    setShowAtRiskDrilldown(false);
    setActiveAccountHealthDrilldown(accountId);
  }, []);

  const handleAtRiskViewTickets = useCallback(() => {
    setShowAtRiskDrilldown(false);
    setOperationalFilter('at-risk-attention');
    setAttentionOnly(false);
    setTicketKpiFilter(null);
    setAtRiskReturnPending(true);
    setActiveTab('tickets');
  }, []);

  const handleBackToAtRiskDrilldown = useCallback(() => {
    setAccountsAtRiskOnly(false);
    setOperationalFilter(null);
    setAttentionOnly(false);
    setTicketKpiFilter(null);
    setAtRiskReturnPending(false);
    setActiveAccountHealthDrilldown(null);
    setShowAtRiskDrilldown(true);
    setActiveTab('overview');
  }, []);

  const clearAccountsViewFilter = useCallback(() => {
    setAccountsAtRiskOnly(false);
    setAtRiskReturnPending(false);
  }, []);

  const handleFilterTam = useCallback((tamId) => {
    setFilters((prev) => ({
      ...prev,
      tamId,
      accountId: '',
    }));
  }, []);

  const handleViewAttentionTickets = useCallback(() => {
    setShowAttentionDrilldown(false);
    setAttentionOnly(true);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setAttentionReturnPending(true);
    setActiveTab('tickets');
  }, []);

  const handleOpenAttentionDrilldown = useCallback(() => {
    setShowAttentionDrilldown(true);
  }, []);

  const handleCloseAttentionDrilldown = useCallback(() => {
    setShowAttentionDrilldown(false);
  }, []);

  const handleAttentionFilterPortfolio = useCallback(() => {
    setShowAttentionDrilldown(false);
    setActiveTab('overview');
  }, []);

  const handleAttentionSelectTicket = useCallback((ticket) => {
    setShowAttentionDrilldown(false);
    setSelectedTicket(ticket);
  }, []);

  const handleBackToAttentionDrilldown = useCallback(() => {
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setAttentionReturnPending(false);
    setShowAttentionDrilldown(true);
    setActiveTab('overview');
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

  const handleRegionDrilldown = useCallback((region) => {
    if (!region) {
      setActiveRegionDrilldown(null);
      setFilters((prev) => ({ ...prev, region: '' }));
      return;
    }
    setActiveRegionDrilldown(region);
  }, []);

  const handleRegionFilterPortfolio = useCallback((region) => {
    setFilters((prev) => ({
      ...prev,
      region,
      tamId: '',
      accountId: '',
    }));
    setActiveRegionDrilldown(null);
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveTab('overview');
  }, []);

  const handleRegionViewTickets = useCallback((region) => {
    setFilters((prev) => ({
      ...prev,
      region,
      tamId: '',
      accountId: '',
      priority: '',
      disposition: '',
      slaBreachOnly: false,
    }));
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveRegionDrilldown(null);
    setActiveTab('tickets');
  }, []);

  const handleKpiViewAll = useCallback((kpiKey) => {
    const patch = getKpiFilterPatch(kpiKey);
    const { kpiFilter, ...filterPatch } = patch;
    setFilters((prev) => ({
      ...prev,
      ...filterPatch,
      ...(drilldownContext?.tamId ? { tamId: drilldownContext.tamId } : {}),
      ...(drilldownContext?.accountId ? { accountId: drilldownContext.accountId } : {}),
      ...(drilldownContext?.bucketDate
        ? { referenceDate: format(parseISO(drilldownContext.bucketDate), 'yyyy-MM-dd') }
        : {}),
    }));
    setTicketKpiFilter(kpiFilter ?? kpiKey);
    setAttentionOnly(false);
    setActiveKpiDrilldown(null);
    setDrilldownContext(null);
    setActiveTab('tickets');
  }, [drilldownContext]);

  const handleKpiFilterPortfolio = useCallback((scope) => {
    const ctx = scope ?? drilldownContext ?? {};
    setFilters((prev) => ({
      ...prev,
      tamId: ctx.tamId ?? '',
      accountId: ctx.accountId ?? '',
    }));
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveKpiDrilldown(null);
    setDrilldownContext(null);
    setActiveTab('overview');
  }, [drilldownContext]);

  const handleKpiViewAccount = useCallback((accountId) => {
    const id = accountId ?? drilldownContext?.accountId;
    if (!id) return;
    setFilters((prev) => ({ ...prev, accountId: id }));
    setActiveKpiDrilldown(null);
    setDrilldownContext(null);
    setActiveTab('accounts');
  }, [drilldownContext]);

  const clearTicketFilters = useCallback(() => {
    setAttentionOnly(false);
    setOperationalFilter(null);
    setStaleThresholdId(DEFAULT_STALE_THRESHOLD_ID);
    setAgingThresholdId(DEFAULT_AGING_THRESHOLD_ID);
    setTicketKpiFilter(null);
    setAccountsAtRiskOnly(false);
    setAtRiskReturnPending(false);
    setAttentionReturnPending(false);
  }, []);

  const handleTicketFilterPortfolio = useCallback((ticket) => {
    if (!ticket) return;
    setSelectedTicket(null);
    setFilters((prev) => ({
      ...prev,
      tamId: ticket.tam_id,
      accountId: ticket.account_id,
    }));
    setAttentionOnly(false);
    setOperationalFilter(null);
    setTicketKpiFilter(null);
    setActiveTab('overview');
  }, []);

  const handleTicketViewAccount = useCallback((ticket) => {
    if (!ticket) return;
    setSelectedTicket(null);
    handleAccountHealthDrilldown(ticket.account_id);
  }, [handleAccountHealthDrilldown]);

  const handleTicketViewTickets = useCallback((ticket) => {
    if (!ticket) return;
    setSelectedTicket(null);
    handleAccountViewTickets(ticket.account_id);
  }, [handleAccountViewTickets]);

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
            <img
              src="/sinch-logo.png"
              alt="Sinch"
              className="header__logo"
              width="214"
              height="86"
            />
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
            filteredTickets={filteredTickets}
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
            onOpenAttentionDrilldown={handleOpenAttentionDrilldown}
            atRiskAccounts={atRiskAccounts}
            onSelectAccount={handleSelectAccount}
            onAccountHealthDrilldown={handleAccountHealthDrilldown}
            onOpenAtRiskDrilldown={handleOpenAtRiskDrilldown}
            accountMetrics={accountMetrics}
            ratedTickets={ratedTickets}
            periodLabel={periodLabel}
            timeSeries={timeSeries}
            tamMetrics={tamMetrics}
            regionChartTamMetrics={regionChartTamMetrics}
            selectedRegion={filters.region || activeRegionDrilldown}
            onRegionDrilldown={handleRegionDrilldown}
            onFilterTam={handleFilterTam}
          />
        )}

        {activeTab === 'tams' && (
          <TamDirectory
            tams={tams}
            tamMetrics={tamMetrics}
            referenceDate={activeFilters.referenceDate}
            onFilterTam={handleFilterTam}
            onSelectAccount={handleAccountHealthDrilldown}
          />
        )}

        {activeTab === 'accounts' && (
          <>
            {accountsAtRiskOnly && (
              <div className="filter-banner filter-banner--at-risk">
                <div className="filter-banner__main">
                  {atRiskReturnPending && (
                    <button
                      type="button"
                      className="filter-banner__back"
                      onClick={handleBackToAtRiskDrilldown}
                    >
                      ← Back to at-risk accounts
                    </button>
                  )}
                  <span className="filter-banner__label">
                    Showing {atRiskAccounts.length} at-risk accounts · sorted by highest risk
                  </span>
                </div>
                <button type="button" className="filter-banner__secondary" onClick={clearAccountsViewFilter}>
                  Show all accounts
                </button>
              </div>
            )}
            <AccountTable
              accountMetrics={accountsAtRiskOnly ? atRiskAccounts : accountMetrics}
              onSelectAccount={handleAccountHealthDrilldown}
              selectedAccountId={filters.accountId}
              atRiskOnly={accountsAtRiskOnly}
            />
          </>
        )}

        {activeTab === 'tickets' && (
          <>
            {(attentionOnly || ticketKpiFilter || operationalFilter) && (
              <div className={`filter-banner ${
                atRiskReturnPending
                  ? 'filter-banner--at-risk'
                  : attentionReturnPending
                    ? 'filter-banner--attention'
                    : ''
              }`}>
                <div className="filter-banner__main">
                  {atRiskReturnPending && (
                    <button
                      type="button"
                      className="filter-banner__back"
                      onClick={handleBackToAtRiskDrilldown}
                    >
                      ← Back to at-risk accounts
                    </button>
                  )}
                  {attentionReturnPending && (
                    <button
                      type="button"
                      className="filter-banner__back filter-banner__back--attention"
                      onClick={handleBackToAttentionDrilldown}
                    >
                      ← Back to attention tickets
                    </button>
                  )}
                  <span className="filter-banner__label">
                    {ticketKpiFilter && KPI_CONFIG[ticketKpiFilter]?.title}
                    {attentionOnly && 'Showing tickets needing attention only'}
                    {operationalFilter === 'stale' && (
                      <>Stale open tickets — no update in {getStaleThresholdLabel(staleThresholdId).toLowerCase()}</>
                    )}
                    {operationalFilter === 'aging' && (
                      <>Aging open tickets — {getAgingThresholdLabel(agingThresholdId).toLowerCase()}+</>
                    )}
                    {operationalFilter === 'at-risk-attention' && (
                      <>Tickets needing attention from {atRiskAccounts.length} at-risk accounts</>
                    )}
                    {operationalFilter === 'at-risk' && (
                      <>All tickets from {atRiskAccounts.length} at-risk accounts</>
                    )}
                  </span>
                </div>
                <div className="filter-banner__actions">
                  {operationalFilter === 'stale' && (
                    <StaleThresholdChips
                      value={staleThresholdId}
                      onChange={setStaleThresholdId}
                    />
                  )}
                  {operationalFilter === 'aging' && (
                    <AgingThresholdChips
                      value={agingThresholdId}
                      onChange={setAgingThresholdId}
                    />
                  )}
                  <button type="button" className="filter-banner__secondary" onClick={clearTicketFilters}>
                    Clear
                  </button>
                </div>
              </div>
            )}
            <TicketFeed tickets={displayTickets} total={displayTickets.length} onOpenTicket={openTicket} />
          </>
        )}
      </main>

      {activeRegionDrilldown && activeRegionData && (
        <RegionDrilldownModal
          region={activeRegionDrilldown}
          regionData={activeRegionData}
          periodLabel={periodLabel}
          onClose={() => setActiveRegionDrilldown(null)}
          onFilterPortfolio={handleRegionFilterPortfolio}
          onViewTickets={handleRegionViewTickets}
          onFilterTam={(tamId) => {
            setActiveRegionDrilldown(null);
            handleFilterTam(tamId);
          }}
        />
      )}

      {showAttentionDrilldown && attentionTickets.length > 0 && (
        <AttentionTicketsDrilldownModal
          tickets={attentionTickets}
          periodLabel={periodLabel}
          portfolioScoped={Boolean(filters.tamId || filters.region || filters.accountId)}
          onClose={handleCloseAttentionDrilldown}
          onSelectTicket={handleAttentionSelectTicket}
          onFilterPortfolio={handleAttentionFilterPortfolio}
          onViewAllTickets={handleViewAttentionTickets}
        />
      )}

      {showAtRiskDrilldown && atRiskAccounts.length > 0 && (
        <AtRiskAccountsDrilldownModal
          atRiskAccounts={atRiskAccounts}
          periodLabel={periodLabel}
          portfolioScoped={Boolean(filters.tamId || filters.region || filters.accountId)}
          onClose={handleCloseAtRiskDrilldown}
          onFilterPortfolio={handleAtRiskFilterPortfolio}
          onAccountDrilldown={handleAtRiskAccountDrilldown}
          onViewAccountMatrix={handleViewAllAccounts}
          onViewTickets={handleAtRiskViewTickets}
        />
      )}

      {activeAccountHealthData && (
        <AccountHealthDrilldownModal
          account={activeAccountHealthData.current}
          previousAccount={activeAccountHealthData.previous}
          tickets={filteredTickets}
          periodLabel={periodLabel}
          onClose={() => setActiveAccountHealthDrilldown(null)}
          onFilterPortfolio={handleAccountFilterPortfolio}
          onViewAccount={handleAccountViewDetail}
          onViewTickets={handleAccountViewTickets}
          onOpenTicket={openTicket}
        />
      )}

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
          onFilterPortfolio={handleKpiFilterPortfolio}
          onViewAccount={handleKpiViewAccount}
          onOpenTicket={openTicket}
          accounts={accounts}
        />
      )}

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={closeTicket}
        onFilterPortfolio={handleTicketFilterPortfolio}
        onViewAccount={handleTicketViewAccount}
        onViewTickets={handleTicketViewTickets}
      />

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
