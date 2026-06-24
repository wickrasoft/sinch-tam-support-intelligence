import { format } from 'date-fns';
import { formatDurationHours, csatIndicator } from './metrics';

export function computeHealthScore(metrics) {
  if (!metrics.totalTickets) return null;

  let score = 100;
  score -= metrics.slaBreachRate * 0.45;
  if (metrics.avgCsat != null) score -= (5 - metrics.avgCsat) * 10;
  score -= Math.min(18, metrics.reopenings * 1.5);
  score -= Math.min(12, metrics.p1p2Count * 1.2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function healthIndicator(score) {
  if (score == null) return { label: 'No Data', level: 'neutral', color: '#94a3b8' };
  if (score >= 80) return { label: 'Healthy', level: 'excellent', color: '#059669' };
  if (score >= 65) return { label: 'Stable', level: 'good', color: '#10b981' };
  if (score >= 50) return { label: 'Watch', level: 'fair', color: '#f59e0b' };
  return { label: 'At Risk', level: 'poor', color: '#ef4444' };
}

export function computeAccountRiskScore(account) {
  const { metrics, healthScore } = account;
  if (healthScore == null || !metrics.totalTickets) return 0;

  let risk = 100 - healthScore;
  risk += (metrics.p1Count ?? 0) * 10;
  risk += (metrics.p2Count ?? 0) * 3;
  if (metrics.avgCsat != null && metrics.avgCsat < 3.5) {
    risk += (3.5 - metrics.avgCsat) * 8;
  }
  if (metrics.slaBreachRate > 18) {
    risk += Math.min(15, (metrics.slaBreachRate - 18) * 0.75);
  }
  risk += Math.min(8, (metrics.reopenings ?? 0) * 2);

  return Math.min(100, Math.round(risk));
}

export function getAccountRiskRank(account) {
  const { metrics, healthScore } = account;
  return {
    riskScore: computeAccountRiskScore(account),
    healthScore: healthScore ?? 100,
    p1Count: metrics.p1Count ?? 0,
    slaBreachRate: metrics.slaBreachRate ?? 0,
    avgCsat: metrics.avgCsat ?? 5,
    p1p2Count: metrics.p1p2Count ?? 0,
    reopenings: metrics.reopenings ?? 0,
  };
}

/** Highest composite risk score first. */
export function compareAccountRisk(a, b) {
  const ra = getAccountRiskRank(a);
  const rb = getAccountRiskRank(b);

  if (ra.riskScore !== rb.riskScore) return rb.riskScore - ra.riskScore;
  if (ra.p1Count !== rb.p1Count) return rb.p1Count - ra.p1Count;
  if (ra.healthScore !== rb.healthScore) return ra.healthScore - rb.healthScore;
  if (ra.slaBreachRate !== rb.slaBreachRate) return rb.slaBreachRate - ra.slaBreachRate;
  if (ra.avgCsat !== rb.avgCsat) return ra.avgCsat - rb.avgCsat;
  if (ra.p1p2Count !== rb.p1p2Count) return rb.p1p2Count - ra.p1p2Count;
  return rb.reopenings - ra.reopenings;
}

export function isAccountAtRisk(account) {
  const { metrics, healthScore } = account;
  if (healthScore == null || !metrics.totalTickets) return false;

  return (
    healthScore < 60
    || metrics.slaBreachRate > 18
    || (metrics.avgCsat != null && metrics.avgCsat < 3.5)
    || metrics.p1Count > 0
  );
}

export function getAtRiskAccounts(accountMetrics) {
  return accountMetrics
    .filter(isAccountAtRisk)
    .map((account) => ({
      ...account,
      riskScore: computeAccountRiskScore(account),
    }))
    .sort(compareAccountRisk);
}

export function enrichAccountMetrics(accountMetrics) {
  return accountMetrics.map((account) => {
    const healthScore = computeHealthScore(account.metrics);
    return {
      ...account,
      healthScore,
      health: healthIndicator(healthScore),
    };
  });
}

export function getHealthScoreFactors(metrics) {
  if (!metrics?.totalTickets) return [];

  const slaPenalty = metrics.slaBreachRate * 0.45;
  const csatPenalty = metrics.avgCsat != null ? (5 - metrics.avgCsat) * 10 : 0;
  const reopenPenalty = Math.min(18, metrics.reopenings * 1.5);
  const priorityPenalty = Math.min(12, metrics.p1p2Count * 1.2);

  return [
    {
      label: 'SLA breach rate',
      detail: `${metrics.slaBreachRate.toFixed(1)}%`,
      penalty: slaPenalty,
      tone: slaPenalty > 15 ? 'bad' : slaPenalty > 8 ? 'warn' : 'good',
    },
    {
      label: 'CSAT average',
      detail: metrics.avgCsat?.toFixed(1) ?? 'N/A',
      penalty: csatPenalty,
      tone: csatPenalty > 15 ? 'bad' : csatPenalty > 8 ? 'warn' : 'good',
    },
    {
      label: 'Reopenings',
      detail: String(metrics.reopenings),
      penalty: reopenPenalty,
      tone: reopenPenalty > 6 ? 'bad' : reopenPenalty > 3 ? 'warn' : 'good',
    },
    {
      label: 'P1/P2 volume',
      detail: String(metrics.p1p2Count),
      penalty: priorityPenalty,
      tone: priorityPenalty > 6 ? 'bad' : priorityPenalty > 3 ? 'warn' : 'good',
    },
  ];
}

export function getAccountRiskFlags(account) {
  const { metrics, healthScore } = account;
  const flags = [];

  if (healthScore != null && healthScore < 60) {
    flags.push(`Health score ${healthScore}/100`);
  }
  if (metrics.slaBreachRate > 18) {
    flags.push(`SLA breach rate ${metrics.slaBreachRate.toFixed(1)}%`);
  }
  if (metrics.avgCsat != null && metrics.avgCsat < 3.5) {
    flags.push(`CSAT ${metrics.avgCsat.toFixed(1)} below target`);
  }
  if (metrics.p1Count > 0) {
    flags.push(`${metrics.p1Count} open P1 ticket${metrics.p1Count !== 1 ? 's' : ''}`);
  }
  if (metrics.p2Count > 3) {
    flags.push(`${metrics.p2Count} P2 tickets in period`);
  }
  if (metrics.reopenings > 2) {
    flags.push(`${metrics.reopenings} reopen events`);
  }

  return flags;
}

export function computeDelta(current, previous, lowerIsBetter = false) {
  if (previous == null || current == null || Number.isNaN(previous) || Number.isNaN(current)) {
    return null;
  }

  const diff = current - previous;
  const pct = previous !== 0 ? (diff / previous) * 100 : (diff !== 0 ? 100 : 0);
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const neutral = Math.abs(diff) < 0.01;

  return { diff, pct, improved, neutral, previous, current };
}

export function formatDelta(delta, suffix = '', invertDisplay = false) {
  if (!delta || delta.neutral) return { text: '—', className: 'delta--neutral' };

  const sign = delta.diff > 0 ? '+' : '';
  const improved = invertDisplay ? !delta.improved : delta.improved;
  const className = improved ? 'delta--good' : 'delta--bad';

  if (Math.abs(delta.pct) >= 1) {
    return { text: `${sign}${delta.pct.toFixed(0)}% vs prior`, className };
  }

  return { text: `${sign}${delta.diff.toFixed(1)}${suffix} vs prior`, className };
}

/** Period-over-period delta for MTTA/MTTR (stored in minutes, displayed in hours). */
export function formatDurationDelta(delta, invertDisplay = false) {
  if (!delta || delta.neutral) return { text: '—', className: 'delta--neutral' };
  return formatDelta({ ...delta, diff: delta.diff / 60 }, ' hr', invertDisplay);
}

export function buildComparisonSummary(current, previous) {
  return {
    p1Count: computeDelta(current.p1Count, previous.p1Count, true),
    p2Count: computeDelta(current.p2Count, previous.p2Count, true),
    slaBreaches: computeDelta(current.slaBreaches, previous.slaBreaches, true),
    slaBreachRate: computeDelta(current.slaBreachRate, previous.slaBreachRate, true),
    avgCsat: computeDelta(current.avgCsat, previous.avgCsat, false),
    avgMtta: computeDelta(current.avgMtta, previous.avgMtta, true),
    avgMttr: computeDelta(current.avgMttr, previous.avgMttr, true),
    reopenings: computeDelta(current.reopenings, previous.reopenings, true),
    resolvedCount: computeDelta(current.resolvedCount, previous.resolvedCount, false),
    closedInPeriodCount: computeDelta(current.closedInPeriodCount, previous.closedInPeriodCount, false),
    totalTickets: computeDelta(current.totalTickets, previous.totalTickets, true),
    needsAttention: computeDelta(current.needsAttention, previous.needsAttention, true),
    escalated: computeDelta(
      current.dispositionCounts?.escalated ?? 0,
      previous.dispositionCounts?.escalated ?? 0,
      true,
    ),
  };
}

export function ticketsToCsv(tickets) {
  const headers = [
    'Zendesk ID', 'Created', 'Account', 'TAM', 'Priority', 'Status', 'Subject',
    'SLA Breached', 'CSAT', 'Reopens', 'MTTA (hr)', 'MTTR (hr)',
  ];

  const rows = tickets.map((t) => [
    t.zendesk_id,
    t.created_at,
    t.account_name,
    t.tam_name,
    t.priority,
    t.status,
    `"${t.subject.replace(/"/g, '""')}"`,
    t.sla.any_breach ? 'Yes' : 'No',
    t.csat.score ?? '',
    t.reopen_count,
    t.mtta_minutes != null ? (t.mtta_minutes / 60).toFixed(1) : '',
    t.mttr_minutes != null ? (t.mttr_minutes / 60).toFixed(1) : '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function buildReportSnapshot({
  periodLabel,
  filters,
  summary,
  comparison,
  accountMetrics,
  atRiskAccounts,
  tams,
}) {
  const tamName = filters.tamId
    ? tams.find((t) => t.id === filters.tamId)?.name
    : 'All TAMs';
  const regionName = filters.region || 'All Regions';
  const csat = csatIndicator(summary.avgCsat, summary.csatPct);

  return {
    title: 'TAM Support Report',
    periodLabel,
    tamName,
    regionName,
    generatedAt: format(new Date(), 'MMM d, yyyy HH:mm'),
    summaryRows: [
      { metric: 'Total Tickets', value: String(summary.totalTickets), delta: formatDelta(comparison.totalTickets).text },
      { metric: 'P1 Tickets', value: String(summary.p1Count), delta: formatDelta(comparison.p1Count).text },
      { metric: 'P2 Tickets', value: String(summary.p2Count), delta: formatDelta(comparison.p2Count).text },
      {
        metric: 'SLA Breaches',
        value: `${summary.slaBreaches} (${summary.slaBreachRate.toFixed(1)}%)`,
        delta: formatDelta(comparison.slaBreaches).text,
      },
      {
        metric: 'CSAT',
        value: `${summary.avgCsat?.toFixed(1) ?? 'N/A'} (${csat.label})`,
        delta: formatDelta(comparison.avgCsat).text,
      },
      { metric: 'MTTA', value: formatDurationHours(summary.avgMtta), delta: formatDurationDelta(comparison.avgMtta).text },
      { metric: 'MTTR', value: formatDurationHours(summary.avgMttr), delta: formatDurationDelta(comparison.avgMttr).text },
      { metric: 'Reopenings', value: String(summary.reopenings), delta: formatDelta(comparison.reopenings).text },
    ],
    atRiskAccounts: atRiskAccounts.map((account) => ({
      accountName: account.account_name,
      health: `${account.healthScore}/100`,
      tamName: account.tam_name,
      slaRate: `${account.metrics.slaBreachRate.toFixed(1)}%`,
      csat: account.metrics.avgCsat?.toFixed(1) ?? 'N/A',
      p1p2: String(account.metrics.p1p2Count),
      reopenings: String(account.metrics.reopenings),
    })),
    accountRows: accountMetrics.map((account) => [
      account.account_name,
      account.healthScore != null ? String(account.healthScore) : '—',
      String(account.metrics.totalTickets),
      String(account.metrics.p1Count),
      String(account.metrics.p2Count),
      `${account.metrics.slaBreachRate.toFixed(1)}%`,
      account.metrics.avgCsat?.toFixed(1) ?? '—',
      formatDurationHours(account.metrics.avgMttr),
    ]),
    footer: 'Report generated from TAM Support Intelligence Dashboard (synthetic Zendesk data)',
  };
}

export function buildMarkdownReport(params) {
  const snapshot = buildReportSnapshot(params);

  let md = `# ${snapshot.title}\n\n`;
  md += `**Period:** ${snapshot.periodLabel}  \n`;
  md += `**Region:** ${snapshot.regionName}  \n`;
  md += `**TAM:** ${snapshot.tamName}  \n`;
  md += `**Generated:** ${snapshot.generatedAt}\n\n`;

  md += `## Executive Summary\n\n`;
  md += `| Metric | Value | vs Prior Period |\n`;
  md += `|--------|-------|------------------|\n`;
  for (const row of snapshot.summaryRows) {
    md += `| ${row.metric} | ${row.value} | ${row.delta} |\n`;
  }
  md += '\n';

  if (snapshot.atRiskAccounts.length) {
    md += `## Accounts Requiring Attention (${snapshot.atRiskAccounts.length})\n\n`;
    for (const account of snapshot.atRiskAccounts) {
      md += `### ${account.accountName} — Health ${account.health}\n`;
      md += `- TAM: ${account.tamName}\n`;
      md += `- SLA breach rate: ${account.slaRate}\n`;
      md += `- CSAT: ${account.csat}\n`;
      md += `- P1/P2: ${account.p1p2} | Reopenings: ${account.reopenings}\n\n`;
    }
  }

  md += `## Account Breakdown\n\n`;
  md += `| Account | Health | Tickets | P1 | P2 | SLA % | CSAT | MTTR |\n`;
  md += `|---------|--------|---------|----|----|-------|------|------|\n`;

  for (const row of snapshot.accountRows) {
    md += `| ${row.join(' | ')} |\n`;
  }

  md += `\n---\n*${snapshot.footer}*\n`;
  return md;
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}