import KPICards from './KPICards';
import OperationalPanels from './OperationalPanels';
import TicketsNeedingAttention from './TicketsNeedingAttention';
import AtRiskPanel from './AtRiskPanel';
import AccountHealthChart from './AccountHealthChart';
import PriorityChart from './PriorityChart';
import SlaBreachChart from './SlaBreachChart';
import CsatsSection from './CsatsSection';
import ResponseTimeChart from './ResponseTimeChart';
import ReopeningsChart from './ReopeningsChart';
import TamOverview from './TamOverview';

export default function OverviewDashboard({
  summary,
  comparison,
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
  onViewAttentionTickets,
  atRiskAccounts,
  onSelectAccount,
  accountMetrics,
  ratedTickets,
  periodLabel,
  timeSeries,
  tamMetrics,
  onFilterTam,
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
          onViewAll={onViewAttentionTickets}
          onSelectTicket={onOpenTicket}
        />
        <AtRiskPanel
          atRiskAccounts={atRiskAccounts}
          onSelectAccount={onSelectAccount}
        />
      </section>

      <section className="grid grid--2">
        <AccountHealthChart
          accountMetrics={accountMetrics}
          onSelectAccount={onSelectAccount}
        />
        <PriorityChart data={timeSeries} accountData={accountMetrics} />
      </section>

      <section className="grid grid--2">
        <SlaBreachChart accountData={accountMetrics} timeSeries={timeSeries} />
        <CsatsSection
          summary={summary}
          ratedTickets={ratedTickets}
          periodLabel={periodLabel}
          onDrilldown={onDrilldown}
          onOpenTicket={onOpenTicket}
        />
      </section>

      <section className="grid grid--2">
        <ResponseTimeChart timeSeries={timeSeries} summary={summary} />
        <ReopeningsChart
          timeSeries={timeSeries}
          summary={summary}
          onDrilldown={onDrilldown}
        />
      </section>

      <TamOverview
        tamMetrics={tamMetrics}
        allTams={tams}
        onSelectAccount={onSelectAccount}
        onFilterTam={onFilterTam}
        onDrilldown={onDrilldown}
      />
    </>
  );
}
