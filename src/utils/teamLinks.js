// Cross-team JIRA links. Zendesk is integrated with JIRA, and TAMs hand tickets
// across to the other teams they work with. These helpers summarise how many
// tickets in the current view are linked to each team.

export const PARTNER_TEAM_ORDER = [
  'Service Operations',
  'Engineering',
  'Global Product',
  'Customer Dashboard',
  'Anti-Fraud Analysis',
  'Supplier Escalation',
  'P2P',
];

// Short, dashboard-friendly labels for the escalations legend.
export const PARTNER_TEAM_SHORT_LABELS = {
  'Service Operations': 'ServOps',
  Engineering: 'DevTria',
  'Global Product': 'Global Product (GM)',
  'Customer Dashboard': 'CDG',
  'Anti-Fraud Analysis': 'AFA',
  'Supplier Escalation': 'Supplier',
  P2P: 'P2P',
};

export function teamShortLabel(team) {
  return PARTNER_TEAM_SHORT_LABELS[team] ?? team;
}

export const PARTNER_TEAM_COLORS = {
  'Service Operations': '#2563eb',
  Engineering: '#9333ea',
  'Global Product': '#0d9488',
  'Customer Dashboard': '#f59e0b',
  'Anti-Fraud Analysis': '#dc2626',
  'Supplier Escalation': '#db2777',
  P2P: '#65a30d',
};

/**
 * Count distinct tickets linked to each partner team. A ticket linked to two
 * teams counts once for each, so slice values can sum to more than the number
 * of linked tickets.
 */
export function getTeamLinkDistribution(tickets) {
  const counts = new Map();
  const projects = new Map();

  for (const ticket of tickets ?? []) {
    const seen = new Set();
    for (const link of ticket.team_links ?? []) {
      if (!link?.team || seen.has(link.team)) continue;
      seen.add(link.team);
      counts.set(link.team, (counts.get(link.team) ?? 0) + 1);
      if (!projects.has(link.team)) projects.set(link.team, link.project);
    }
  }

  return PARTNER_TEAM_ORDER
    .filter((team) => counts.has(team))
    .map((team) => ({ team, project: projects.get(team), value: counts.get(team) }))
    .sort((a, b) => b.value - a.value);
}

// JIRA statuses that mean the cross-team escalation is finished. Anything else
// (Open, In Progress, In Review, Blocked) is treated as still ongoing.
export const ESCALATION_DONE_STATUSES = new Set(['Done', 'Resolved', 'Closed']);

export function isOngoingTeamLink(link) {
  if (!link?.team) return false;
  return !ESCALATION_DONE_STATUSES.has(link.status);
}

/** True when a ticket has an ongoing (unfinished) escalation to the given team. */
export function hasOngoingEscalationToTeam(ticket, team) {
  return (ticket.team_links ?? []).some((l) => l.team === team && isOngoingTeamLink(l));
}

/** Count of tickets with an ongoing escalation to the given team. */
export function countOngoingEscalationsForTeam(tickets, team) {
  let count = 0;
  for (const ticket of tickets ?? []) {
    if (hasOngoingEscalationToTeam(ticket, team)) count += 1;
  }
  return count;
}

export function getTeamLinkTotals(tickets) {
  let ticketsWithLinks = 0;
  let totalLinks = 0;
  for (const ticket of tickets ?? []) {
    const links = ticket.team_links ?? [];
    if (links.length) ticketsWithLinks += 1;
    totalLinks += links.length;
  }
  return { ticketsWithLinks, totalLinks };
}
