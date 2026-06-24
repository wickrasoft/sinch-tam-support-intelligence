import KPICards from './KPICards';
import OperationalPanels from './OperationalPanels';
import TicketsNeedingAttention from './TicketsNeedingAttention';
import AtRiskPanel from './AtRiskPanel';
import AccountHealthChart from './AccountHealthChart';
import PriorityChart from './PriorityChart';
import SlaBreachChart from './SlaBreachChart';
import RegionDistributionPanel from './RegionDistributionPanel';
import CsatsSection from './CsatsSection';
import ResponseTimeChart from './ResponseTimeChart';
import ReopeningsChart from './ReopeningsChart';
import TamOverview from './TamOverview';

export default function OverviewDashboard({
  summary,
  comparison,
  filteredTickets,
  onDrilldown,
  tams,
  allTickets,
  accounts,
  filters,
  referenceDate,
  staleThresholdId,
  onStaleThresholdChange,
  agingThresholdId,
  onAgingThresholdChange,
  onOpenTicket,
  onViewAllStale,
  onViewAllAging,
  attentionTickets,
  onOpenAttentionDrilldown,
  atRiskAccounts,
  onSelectAccount,
  onAccountHealthDrilldown,
  onOpenAtRiskDrilldown,
  accountMetrics,
  ratedTickets,
  periodLabel,
  timeSeries,
  tamMetrics,
  regionChartTamMetrics,
  onFilterTam,
  selectedRegion,
  onRegionDrilldown,
}) {
  return (
    <>
      <KPICards summary={summary} comparison={comparison} onDrilldown={onDrilldown} />

      <OperationalPanels
        tams={tams}
        tickets={allTickets}
        accounts={accounts}
        filters={filters}
        referenceDate={referenceDate}
        staleThresholdId={staleThresholdId}
        onStaleThresholdChange={onStaleThresholdChange}
        agingThresholdId={agingThresholdId}
        onAgingThresholdChange={onAgingThresholdChange}
        onOpenTicket={onOpenTicket}
        onViewAllStale={onViewAllStale}
        onViewAllAging={onViewAllAging}
      />

      <section className="grid grid--alert">
        <TicketsNeedingAttention
          tickets={attentionTickets}
          onSelectTicket={onOpenTicket}
          onOpenDrilldown={onOpenAttentionDrilldown}
        />
        <AtRiskPanel
          atRiskAccounts={atRiskAccounts}
          onAccountDrilldown={onAccountHealthDrilldown}
          onOpenDrilldown={onOpenAtRiskDrilldown}
        />
      </section>

      <section className="grid grid--2">
        <AccountHealthChart
          accountMetrics={accountMetrics}
          onAccountDrilldown={onAccountHealthDrilldown}
        />
        <PriorityChart
          data={timeSeries}
          accountData={accountMetrics}
          tamMetrics={tamMetrics}
          tickets={filteredTickets}
          summary={summary}
          onDrilldown={onDrilldown}
        />
      </section>

      <section className="grid grid--2">
        <SlaBreachChart accountData={accountMetrics} timeSeries={timeSeries} onDrilldown={onDrilldown} />
        <RegionDistributionPanel
          regionChartTamMetrics={regionChartTamMetrics}
          allTams={tams}
          selectedRegion={selectedRegion}
          onRegionDrilldown={onRegionDrilldown}
        />
      </section>

      <CsatsSection
        summary={summary}
        ratedTickets={ratedTickets}
        periodLabel={periodLabel}
        onDrilldown={onDrilldown}
        onOpenTicket={onOpenTicket}
      />

      <section className="grid grid--2">
        <ResponseTimeChart timeSeries={timeSeries} summary={summary} onDrilldown={onDrilldown} />
        <ReopeningsChart
          timeSeries={timeSeries}
          summary={summary}
          onDrilldown={onDrilldown}
        />
      </section>

      <TamOverview
        tamMetrics={tamMetrics}
        allTams={tams}
        referenceDate={referenceDate}
        selectedRegion={selectedRegion}
        onSelectAccount={onAccountHealthDrilldown}
        onFilterTam={onFilterTam}
        onDrilldown={onDrilldown}
      />
    </>
  );
}
