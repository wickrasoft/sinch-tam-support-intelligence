/**
 * Generates realistic Zendesk-style dummy ticket data for TAM dedicated accounts.
 * Run: node scripts/generateData.js
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TAMS = [
  { id: 'tam-001', name: 'Sarah Chen', email: 'sarah.chen@sinch.com', region: 'US' },
  { id: 'tam-002', name: 'Marcus Rivera', email: 'marcus.rivera@sinch.com', region: 'US' },
  { id: 'tam-003', name: 'Priya Patel', email: 'priya.patel@sinch.com', region: 'EMEA' },
  { id: 'tam-004', name: 'James Okonkwo', email: 'james.okonkwo@sinch.com', region: 'APAC' },
  { id: 'tam-005', name: 'Elena Vasquez', email: 'elena.vasquez@sinch.com', region: 'LATAM' },
  { id: 'tam-006', name: 'David Kim', email: 'david.kim@sinch.com', region: 'US' },
  { id: 'tam-007', name: 'Amira Hassan', email: 'amira.hassan@sinch.com', region: 'EMEA' },
  { id: 'tam-008', name: 'Tomás Bergström', email: 'tomas.bergstrom@sinch.com', region: 'EMEA' },
  { id: 'tam-009', name: 'Rachel Okafor', email: 'rachel.okafor@sinch.com', region: 'US' },
  { id: 'tam-010', name: 'Yuki Tanaka', email: 'yuki.tanaka@sinch.com', region: 'APAC' },
  { id: 'tam-011', name: 'Sophie Laurent', email: 'sophie.laurent@sinch.com', region: 'EMEA' },
  { id: 'tam-012', name: 'Carlos Mendez', email: 'carlos.mendez@sinch.com', region: 'LATAM' },
  { id: 'tam-013', name: 'Aisha Rahman', email: 'aisha.rahman@sinch.com', region: 'APAC' },
  { id: 'tam-014', name: 'Liam O\'Brien', email: 'liam.obrien@sinch.com', region: 'EMEA' },
  { id: 'tam-015', name: 'Nina Kowalski', email: 'nina.kowalski@sinch.com', region: 'US' },
];

const ACCOUNT_DEFS = [
  { name: 'Acme Corporation', tam_id: 'tam-001', tier: 'Enterprise', industry: 'Manufacturing' },
  { name: 'GlobalTech Industries', tam_id: 'tam-001', tier: 'Enterprise', industry: 'Technology' },
  { name: 'Nexus Financial Group', tam_id: 'tam-002', tier: 'Enterprise', industry: 'Finance' },
  { name: 'HealthFirst Systems', tam_id: 'tam-002', tier: 'Enterprise', industry: 'Healthcare' },
  { name: 'RetailMax International', tam_id: 'tam-003', tier: 'Mid-Market', industry: 'Retail' },
  { name: 'CloudScale Ltd', tam_id: 'tam-003', tier: 'Enterprise', industry: 'SaaS' },
  { name: 'EduLearn Platform', tam_id: 'tam-004', tier: 'Mid-Market', industry: 'Education' },
  { name: 'LogiTrans Shipping', tam_id: 'tam-004', tier: 'Enterprise', industry: 'Logistics' },
  { name: 'MedCore Analytics', tam_id: 'tam-005', tier: 'Enterprise', industry: 'Healthcare' },
  { name: 'Aurora Energy Corp', tam_id: 'tam-006', tier: 'Enterprise', industry: 'Energy' },
  { name: 'FinEdge Capital', tam_id: 'tam-006', tier: 'Enterprise', industry: 'Finance' },
  { name: 'NovaRetail Group', tam_id: 'tam-007', tier: 'Mid-Market', industry: 'Retail' },
  { name: 'Skyline Media', tam_id: 'tam-007', tier: 'Enterprise', industry: 'Media' },
  { name: 'Baltic Shipping Co', tam_id: 'tam-008', tier: 'Enterprise', industry: 'Logistics' },
  { name: 'GreenField AgriTech', tam_id: 'tam-009', tier: 'Mid-Market', industry: 'Agriculture' },
  { name: 'Pacific Telecom', tam_id: 'tam-010', tier: 'Enterprise', industry: 'Telecom' },
  { name: 'Horizon Insurance', tam_id: 'tam-010', tier: 'Enterprise', industry: 'Insurance' },
  { name: 'Lumière Cosmetics', tam_id: 'tam-011', tier: 'Mid-Market', industry: 'Consumer' },
  { name: 'Andes Mining SA', tam_id: 'tam-012', tier: 'Enterprise', industry: 'Mining' },
  { name: 'Singapore FinHub', tam_id: 'tam-013', tier: 'Enterprise', industry: 'Finance' },
  { name: 'Dublin DataWorks', tam_id: 'tam-014', tier: 'Enterprise', industry: 'Technology' },
  { name: 'Cascade Pharmaceuticals', tam_id: 'tam-014', tier: 'Enterprise', industry: 'Pharma' },
  { name: 'Summit Outdoor Gear', tam_id: 'tam-015', tier: 'Mid-Market', industry: 'Retail' },
  { name: 'Vertex Aerospace', tam_id: 'tam-015', tier: 'Enterprise', industry: 'Aerospace' },
  { name: 'Urban Mobility Inc', tam_id: 'tam-005', tier: 'Enterprise', industry: 'Transportation' },
];

const ACCOUNTS = ACCOUNT_DEFS.map((a, i) => ({
  ...a,
  id: `acc-${String(i + 1).padStart(3, '0')}`,
}));

const SLA_TARGETS_MINUTES = {
  P1: { first_response: 60, resolution: 240 },
  P2: { first_response: 240, resolution: 1440 },
  P3: { first_response: 480, resolution: 2880 },
  P4: { first_response: 1440, resolution: 10080 },
};

const SUBJECTS = [
  { subject: 'US SMS delivery failures — error 50001 on AT&T routes', product: 'SMS API', category: 'delivery' },
  { subject: '10DLC campaign rejected — brand EIN mismatch', product: '10DLC Registration', category: 'compliance' },
  { subject: 'Conversation API webhook latency exceeding 5s threshold', product: 'Conversation API', category: 'performance' },
  { subject: 'OTP verification SMS not delivered to Vodafone UK', product: 'Verification API', category: 'delivery' },
  { subject: 'Throughput throttling on long code +1-415-555-0142', product: 'SMS API', category: 'capacity' },
  { subject: 'WhatsApp template message rejected by Meta', product: 'Conversation API', category: 'compliance' },
  { subject: 'DLR callbacks missing for batch_id BATCH-88421', product: 'SMS API', category: 'webhooks' },
  { subject: 'Number provisioning delay — US toll-free text enablement', product: 'Numbers API', category: 'provisioning' },
  { subject: 'RCS rich card fallback not triggering to SMS', product: 'Conversation API', category: 'routing' },
  { subject: 'Sinch Build account — invalid API credential after key rotation', product: 'SMS API', category: 'auth' },
  { subject: 'A2P 10DLC throughput limit increase request — 240 MPS', product: '10DLC Registration', category: 'capacity' },
  { subject: 'MMS attachment delivery failure on T-Mobile network', product: 'SMS API', category: 'delivery' },
  { subject: 'Flash Call verification timing out for APAC region', product: 'Verification API', category: 'performance' },
  { subject: 'SMS concatenation issue — multipart messages out of order', product: 'SMS API', category: 'messaging' },
  { subject: 'Hosted number LOA pending — blocking SMS send', product: 'Numbers API', category: 'provisioning' },
  { subject: 'Campaign registry update required after company rebrand', product: '10DLC Registration', category: 'compliance' },
  { subject: 'Alphanumeric sender ID blocked in destination country', product: 'SMS API', category: 'compliance' },
  { subject: 'Conversation API contact merge creating duplicate profiles', product: 'Conversation API', category: 'data' },
  { subject: 'Emergency SMS alert broadcast partial failure report', product: 'SMS API', category: 'delivery' },
  { subject: 'Number Lookup API returning stale carrier for ported numbers', product: 'Number Lookup API', category: 'data' },
  { subject: 'SMPP bind disconnects every 15 minutes from customer ESME', product: 'SMS API', category: 'connectivity' },
  { subject: 'Viber Business Messages channel onboarding stuck', product: 'Conversation API', category: 'provisioning' },
  { subject: 'Billing discrepancy on SMS segment count vs dashboard', product: 'SMS API', category: 'billing' },
  { subject: 'Opt-out keyword STOP not suppressing future sends', product: 'SMS API', category: 'compliance' },
  { subject: 'RCS agent verification rejected — logo asset resolution', product: 'Conversation API', category: 'compliance' },
];

const SINCH_REGIONS = ['US', 'EU', 'APAC', 'LATAM'];
const TAM_REGIONS = ['US', 'EMEA', 'APAC', 'LATAM'];
const TAM_AVAILABILITY_SCHEDULES = {
  'tam-003': { vacation: { start: '2026-06-10', end: '2026-07-05' }, backup_tam_id: 'tam-001' },
  'tam-008': { vacation: { start: '2026-06-01', end: '2026-07-05' }, backup_tam_id: 'tam-011' },
  'tam-012': { vacation: { start: '2026-06-15', end: '2026-07-05' }, backup_tam_id: 'tam-005' },
  'tam-007': { sick: { start: '2026-06-18', end: '2026-06-27' }, backup_tam_id: 'tam-011' },
};
const REGION_TIMEZONES = {
  US: 'America/New_York',
  EMEA: 'Europe/Paris',
  APAC: 'Asia/Singapore',
  LATAM: 'America/Sao_Paulo',
};
const ZENDESK_BASE_URL = 'https://sinchmessaging.zendesk.com/agent/tickets';

const SUPPORT_AGENTS = [
  { name: 'Lina Okonkwo', email: 'lina.okonkwo@sinch.com' },
  { name: 'Ben Carter', email: 'ben.carter@sinch.com' },
  { name: 'Mei Lin', email: 'mei.lin@sinch.com' },
  { name: 'André Silva', email: 'andre.silva@sinch.com' },
  { name: 'Kate Morrison', email: 'kate.morrison@sinch.com' },
];

const TAM_TO_ZD_REGION = {
  US: 'US',
  EMEA: 'EU',
  APAC: 'APAC',
  LATAM: 'LATAM',
};

const DESTINATION_COUNTRIES = {
  US: ['United States', 'Canada', 'Mexico'],
  EU: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Spain', 'Sweden'],
  APAC: ['Australia', 'Singapore', 'Japan', 'India', 'Philippines'],
  LATAM: ['Brazil', 'Colombia', 'Argentina', 'Chile', 'Mexico'],
};

const CASE_TYPES = [
  'Technical Issue', 'Delivery Failure', 'Compliance / 10DLC', 'Provisioning',
  'Performance Degradation', 'Configuration', 'Billing Dispute', 'Carrier Escalation',
];

const CSAT_COMMENTS_BY_SCORE = {
  1: [
    'Issue still not resolved after multiple follow-ups. Very disappointed with response time.',
    'Support did not understand our SMS routing setup. Escalation took too long.',
    'Delivery failures continue despite assurances. Considering moving traffic elsewhere.',
  ],
  2: [
    'Partial fix only — DLR callbacks still intermittent on our side.',
    'TAM was helpful but resolution took longer than our SLA expectations.',
    'Root cause explanation was unclear and we had to re-open the ticket.',
  ],
  3: [
    'Acceptable resolution but communication could have been more proactive.',
    'Issue fixed, though we needed several reminders to get status updates.',
    'Workaround helped but we still need a permanent fix on the carrier route.',
  ],
  4: [
    'Sarah was responsive and kept us updated throughout the incident.',
    'Good support on the 10DLC campaign rejection — clear next steps provided.',
    'Issue resolved within a reasonable timeframe. Appreciate the TAM follow-up.',
  ],
  5: [
    'Excellent support — root cause identified quickly and delivery restored same day.',
    'Very knowledgeable TAM team. Clear RCA and preventive actions documented.',
    'Outstanding handling of our P1 SMS outage. Would recommend Sinch support.',
    'Fast acknowledgment and fix for our Conversation API webhook latency issue.',
  ],
};

function buildCsatFeedback(score, rng) {
  if (score == null) {
    return { offered: false, score: null, rated: false, comment: null, rated_at: null };
  }
  const includeComment = rng() < 0.78;
  const pool = CSAT_COMMENTS_BY_SCORE[score] ?? CSAT_COMMENTS_BY_SCORE[3];
  return {
    offered: true,
    score,
    rated: true,
    comment: includeComment ? pool[Math.floor(rng() * pool.length)] : null,
    rated_at: null,
  };
}

const ISSUE_SOURCES = [
  'Customer Reported', 'Proactive Monitoring', 'Carrier Alert', 'TAM Escalation',
  'Internal QA', 'Scheduled Maintenance Follow-up',
];

const ROOT_CAUSES = [
  'Carrier routing misconfiguration', 'Customer API integration error', 'MNO aggregator outage',
  '10DLC campaign non-compliance', 'Rate limit misconfiguration', 'Invalid sender ID registration',
  'Webhook endpoint timeout', 'Number porting delay', 'Platform bug — patched', null,
];

const RESOLUTIONS = [
  'Issue resolved — traffic restored to normal', 'Workaround provided — permanent fix scheduled',
  'Carrier confirmed fix on MNO side', 'Customer updated integration per guidance',
  'Campaign re-submitted and approved', 'Configuration corrected in Sinch Build',
  'Escalated to vendor — resolved externally', null,
];

const VENDORS = ['AT&T', 'T-Mobile', 'Verizon', 'Vodafone', 'Telefónica', 'Orange', 'Telstra', 'Singtel', null, null];
const JIRA_STATUSES = ['Open', 'In Progress', 'In Review', 'Done', 'Blocked', 'Not Linked'];
const ZENDESK_FORMS = ['Sinch Messaging Support', 'Enterprise TAM Escalation', 'Carrier Operations', '10DLC Compliance'];
const SHARING_OPTIONS = ['Not shared', 'Shared with Carrier Ops', 'Shared with Engineering', 'Shared with Compliance Team'];
const CASE_ORIGINS = ['Email', 'Web Form', 'Phone', 'API', 'TAM Portal', 'Chat', 'Monitoring Alert'];

const TICKET_TYPES = ['incident', 'problem', 'question', 'task'];
const IMPACT_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

const ERROR_CODES = ['50001', '50003', '50102', '50201', 'DELIVERY_TIMEOUT', 'CARRIER_REJECT', 'INVALID_SENDER', 'THROTTLED', null, null];
const ESCALATION_TEAMS = ['Sinch Carrier Ops', '10DLC Compliance Team', 'SMS Platform Engineering', 'Conversation API Support', 'Numbers Provisioning', 'Verification Platform'];

const DISPOSITION_WEIGHTS_OPEN = [
  { disposition: 'in_progress', weight: 0.35 },
  { disposition: 'waiting_for_response', weight: 0.25 },
  { disposition: 'temp_resolution', weight: 0.15 },
  { disposition: 'escalated', weight: 0.10 },
  { disposition: 'closed', weight: 0.15 },
];

const DISPOSITION_WEIGHTS_OLD = [
  { disposition: 'closed', weight: 0.88 },
  { disposition: 'temp_resolution', weight: 0.05 },
  { disposition: 'escalated', weight: 0.03 },
  { disposition: 'in_progress', weight: 0.02 },
  { disposition: 'waiting_for_response', weight: 0.02 },
];

function buildAccountProfiles() {
  const profiles = {};
  ACCOUNTS.forEach((acc, i) => {
    const rng = seededRandom(1000 + i);
    profiles[acc.id] = {
      slaBreachRate: 0.06 + rng() * 0.18,
      csatBias: (rng() - 0.5) * 0.6,
      reopenRate: 0.04 + rng() * 0.12,
      volume: 0.7 + rng() * 0.8,
      escalationRate: 0.05 + rng() * 0.12,
    };
  });
  return profiles;
}

const ACCOUNT_PROFILES = buildAccountProfiles();

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickWeighted(rng, items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.disposition ?? item.priority ?? item;
  }
  const last = items[items.length - 1];
  return last.disposition ?? last.priority ?? last;
}

function randomDate(rng, start, end) {
  return new Date(start.getTime() + rng() * (end.getTime() - start.getTime()));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function diffMinutes(from, to) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
}

function estimateBusinessMinutes(calendarMinutes, rng) {
  const factor = 0.28 + rng() * 0.14;
  return Math.round(calendarMinutes * factor);
}

function buildZendeskMetrics({ createdAt, firstResponseAt, solvedAt, rng }) {
  const replyCalendar = firstResponseAt ? diffMinutes(createdAt, firstResponseAt) : null;
  const resolutionCalendar = solvedAt ? diffMinutes(createdAt, solvedAt) : null;
  const onHoldCalendar = replyCalendar != null && solvedAt != null && rng() < 0.35
    ? Math.round(rng() * Math.max(30, replyCalendar * 0.6))
    : 0;
  const agentWorkCalendar = replyCalendar != null
    ? (resolutionCalendar != null
      ? Math.max(15, resolutionCalendar - onHoldCalendar)
      : replyCalendar)
    : null;

  const toMetric = (calendar) => (calendar != null ? {
    calendar,
    business: estimateBusinessMinutes(calendar, rng),
  } : null);

  return {
    reply_time_in_minutes: toMetric(replyCalendar),
    full_resolution_time_in_minutes: toMetric(resolutionCalendar),
    requester_wait_time_in_minutes: toMetric(resolutionCalendar ?? replyCalendar),
    agent_work_time_in_minutes: toMetric(agentWorkCalendar),
    on_hold_time_in_minutes: {
      calendar: onHoldCalendar,
      business: estimateBusinessMinutes(onHoldCalendar, rng),
    },
  };
}

function mapDispositionToStatus(disposition) {
  switch (disposition) {
    case 'in_progress': return 'open';
    case 'waiting_for_response': return 'pending';
    case 'temp_resolution': return 'solved';
    case 'closed': return 'closed';
    case 'escalated': return 'open';
    default: return 'open';
  }
}

function computeAttentionReasons(ticket, ageDays) {
  const reasons = [];
  if (ticket.priority === 'P1') reasons.push('P1 Critical');
  if (ticket.priority === 'P2' && ticket.disposition !== 'closed') reasons.push('P2 High Priority');
  if (ticket.sla.any_breach && ticket.disposition !== 'closed') reasons.push('SLA Breached');
  if (ticket.disposition === 'escalated') reasons.push('Escalated');
  if (ticket.disposition === 'temp_resolution') reasons.push('Temp Resolution — verify permanent fix');
  if (ticket.disposition === 'waiting_for_response' && (ticket.priority === 'P1' || ticket.priority === 'P2')) {
    reasons.push('WFR on Priority Ticket');
  }
  if (ticket.reopen_count > 0 && ticket.disposition !== 'closed') reasons.push('Reopened');
  if (ticket.disposition === 'in_progress' && ageDays > 7 && ticket.priority !== 'P4') {
    reasons.push('Stale In Progress');
  }
  if (ticket.csat.rated && ticket.csat.score <= 2) reasons.push('Low CSAT');
  return reasons;
}

function buildConversation(subjectEntry, account, tam, rng, createdAt, firstResponseAt, disposition) {
  const contactName = ['Alex Morgan', 'Jordan Lee', 'Sam Patel', 'Chris Nguyen', 'Taylor Brooks'][Math.floor(rng() * 5)];
  const contactEmail = `${contactName.toLowerCase().replace(' ', '.')}@${account.name.toLowerCase().replace(/[^a-z]/g, '')}.com`;

  const threads = [
    {
      author: 'customer',
      author_name: contactName,
      at: createdAt.toISOString(),
      body: `Hi Sinch TAM team,\n\nWe're seeing issues with: ${subjectEntry.subject}\n\nAccount: ${account.name}\nProduct: ${subjectEntry.product}\nThis is affecting our ${account.industry} messaging workflows. Please advise urgently.\n\nThanks,\n${contactName}`,
    },
  ];

  if (!firstResponseAt) {
    return { contactName, contactEmail, threads };
  }

  threads.push({
    author: 'agent',
    author_name: tam.name,
    at: firstResponseAt.toISOString(),
    body: `Hi ${contactName.split(' ')[0]},\n\nThank you for reaching out. I'm ${tam.name}, your dedicated TAM. I've acknowledged this ${subjectEntry.product} issue and am investigating with our ${subjectEntry.category} team.\n\nI'll update you within the SLA window.`,
  });

  if (disposition === 'waiting_for_response') {
    threads.push({
      author: 'agent',
      author_name: tam.name,
      at: addMinutes(firstResponseAt, 30 + rng() * 60).toISOString(),
      body: 'Could you share recent batch IDs, affected destination numbers, and the exact API endpoint or SMPP bind configuration you are using?',
    });
  }

  if (disposition === 'escalated') {
    threads.push({
      author: 'system',
      author_name: 'Zendesk',
      at: addMinutes(firstResponseAt, 45).toISOString(),
      body: 'Ticket escalated to Sinch internal support queue.',
    });
  }

  if (['temp_resolution', 'closed'].includes(disposition)) {
    threads.push({
      author: 'agent',
      author_name: tam.name,
      at: addMinutes(firstResponseAt, 120 + rng() * 240).toISOString(),
      body: disposition === 'temp_resolution'
        ? 'Temporary workaround applied — traffic rerouted via alternate MNO aggregator. Permanent fix tracked under internal INC reference.'
        : 'Root cause identified and resolved. Monitoring delivery rates for 24h. Please confirm CSAT survey.',
    });
  }

  if (rng() > 0.6 && disposition !== 'closed') {
    threads.push({
      author: 'customer',
      author_name: contactName,
      at: addMinutes(firstResponseAt, 90 + rng() * 180).toISOString(),
      body: 'Following up — issue persists for ~15% of messages. Attaching sample message IDs from our logs.',
    });
  }

  return { contactName, contactEmail, threads };
}

function mapPriorityToZendesk(priority) {
  return { P1: 'urgent', P2: 'high', P3: 'normal', P4: 'low' }[priority] ?? 'normal';
}

function mapImpact(priority, volumeImpact) {
  if (priority === 'P1' || volumeImpact === 'critical') return 'Critical';
  if (priority === 'P2' || volumeImpact === 'high') return 'High';
  if (priority === 'P3') return 'Medium';
  return 'Low';
}

function buildZendeskFields({
  id, zendeskId, subjectEntry, account, tam, rng, priority, type, disposition,
  contactName, contactEmail, channel, tags, escalatedTo, region, volumeImpact,
  createdAt, firstResponseAt, solvedAt, allTicketIds,
}) {
  const assignee = rng() > 0.35
    ? { name: tam.name, email: tam.email }
    : SUPPORT_AGENTS[Math.floor(rng() * SUPPORT_AGENTS.length)];

  const followerCount = Math.floor(rng() * 4);
  const followers = [];
  const pool = [tam, ...SUPPORT_AGENTS].filter((a) => a.email !== assignee.email);
  for (let i = 0; i < followerCount && i < pool.length; i++) {
    const p = pool[Math.floor(rng() * pool.length)];
    if (!followers.some((f) => f.email === p.email)) followers.push({ name: p.name, email: p.email });
  }

  const isClosed = disposition === 'closed';
  const isInProgress = disposition === 'in_progress' || disposition === 'escalated';
  const hasVendor = rng() > 0.55 && (subjectEntry.category === 'delivery' || disposition === 'escalated');
  const vendor = hasVendor ? VENDORS[Math.floor(rng() * VENDORS.length)] : null;
  const jiraStatus = rng() > 0.25 ? JIRA_STATUSES[Math.floor(rng() * (JIRA_STATUSES.length - 1))] : 'Not Linked';
  const jiraKey = jiraStatus !== 'Not Linked' ? `SMS-${Math.floor(rng() * 90000 + 10000)}` : null;

  const linkedCount = rng() > 0.7 ? Math.floor(1 + rng() * 2) : 0;
  const linkedTickets = [];
  for (let i = 0; i < linkedCount; i++) {
    const linkedId = 100000 + Math.floor(rng() * Math.max(id - 1, 1));
    linkedTickets.push({ zendesk_id: linkedId, subject: `Related: ${SUBJECTS[Math.floor(rng() * SUBJECTS.length)].subject.slice(0, 50)}…` });
  }

  const linkedProblem = type === 'incident' && rng() > 0.75
    ? { zendesk_id: 100000 + Math.floor(rng() * Math.max(id - 1, 1)), subject: 'Recurring SMS delivery degradation — master problem' }
    : null;

  const rootCause = isClosed || disposition === 'temp_resolution'
    ? ROOT_CAUSES.filter(Boolean)[Math.floor(rng() * ROOT_CAUSES.filter(Boolean).length)]
    : null;
  const resolution = isClosed || disposition === 'temp_resolution'
    ? RESOLUTIONS.filter(Boolean)[Math.floor(rng() * RESOLUTIONS.filter(Boolean).length)]
    : null;

  const followUpDate = !isClosed && rng() > 0.4
    ? addMinutes(createdAt, Math.round(24 * 60 + rng() * 14 * 24 * 60)).toISOString()
    : null;

  const destCountries = DESTINATION_COUNTRIES[region] ?? DESTINATION_COUNTRIES.US;

  const jiraSummary = jiraKey
    ? `${subjectEntry.product} — ${subjectEntry.subject.slice(0, 55)}`
    : null;

  return {
    url: `${ZENDESK_BASE_URL}/${zendeskId}`,
    mail_thread_url: `${ZENDESK_BASE_URL}/${zendeskId}`,
    requester: { name: contactName, email: contactEmail },
    assignee,
    followers,
    sharing: SHARING_OPTIONS[Math.floor(rng() * SHARING_OPTIONS.length)],
    form: ZENDESK_FORMS[Math.floor(rng() * ZENDESK_FORMS.length)],
    tags,
    type,
    priority: mapPriorityToZendesk(priority),
    priority_label: priority,
    linked_problem: linkedProblem,
    impact: mapImpact(priority, volumeImpact),
    region,
    product: subjectEntry.product,
    case_type: CASE_TYPES[Math.floor(rng() * CASE_TYPES.length)],
    issue_category: subjectEntry.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    destination_country: destCountries[Math.floor(rng() * destCountries.length)],
    issue_source: ISSUE_SOURCES[Math.floor(rng() * ISSUE_SOURCES.length)],
    root_cause: rootCause,
    resolution,
    escalated_team: escalatedTo,
    vendor_supplier_name: vendor,
    supplier_ticket_id: vendor ? `SUP-${Math.floor(rng() * 900000 + 100000)}` : null,
    linked_tickets: linkedTickets,
    case_origin: CASE_ORIGINS[Math.floor(rng() * CASE_ORIGINS.length)],
    jira_ticket_status: jiraStatus,
    jira_key: jiraKey,
    jira: jiraKey ? {
      key: jiraKey,
      status: jiraStatus,
      summary: jiraSummary,
      url: `https://sinch.atlassian.net/browse/${jiraKey}`,
      issue_type: 'Bug',
      priority: priority === 'P1' ? 'Highest' : priority === 'P2' ? 'High' : 'Medium',
      assignee: 'SMS Platform Engineering',
    } : null,
    in_progress: isInProgress,
    follow_up_date: followUpDate,
  };
}

function generateTicket(id, account, rng, createdAt, endDate) {
  const profile = ACCOUNT_PROFILES[account.id];
  const priority = pickWeighted(rng, [
    { priority: 'P1', weight: 0.05 },
    { priority: 'P2', weight: 0.15 },
    { priority: 'P3', weight: 0.45 },
    { priority: 'P4', weight: 0.35 },
  ]);
  const sla = SLA_TARGETS_MINUTES[priority];
  const tam = TAMS.find((t) => t.id === account.tam_id);

  const ageDays = (endDate - createdAt) / (1000 * 60 * 60 * 24);
  const isRecent = ageDays < 45;
  let disposition = pickWeighted(rng, isRecent ? DISPOSITION_WEIGHTS_OPEN : DISPOSITION_WEIGHTS_OLD);

  if (rng() < profile.escalationRate && disposition !== 'closed') {
    disposition = 'escalated';
  }

  const forceBreach = rng() < profile.slaBreachRate;
  const mttaMultiplier = forceBreach && rng() > 0.5 ? 1.2 + rng() * 2.5 : 0.3 + rng() * 0.9;
  const mttrMultiplier = forceBreach ? 1.3 + rng() * 3.0 : 0.4 + rng() * 1.2;

  const pendingFirstResponse = isRecent
    && ['in_progress', 'waiting_for_response', 'escalated'].includes(disposition)
    && rng() < 0.1;

  const plannedMtta = Math.round(sla.first_response * mttaMultiplier);
  const plannedMttr = Math.round(sla.resolution * mttrMultiplier);

  const firstResponseAt = pendingFirstResponse ? null : addMinutes(createdAt, plannedMtta);
  const isResolved = ['temp_resolution', 'closed'].includes(disposition);
  const solvedAt = isResolved ? addMinutes(createdAt, plannedMttr) : null;
  const closedAt = disposition === 'closed' && solvedAt
    ? addMinutes(solvedAt, Math.round(rng() * 480))
    : null;

  const elapsedAtReference = diffMinutes(createdAt, endDate);
  const mttaMinutes = firstResponseAt ? diffMinutes(createdAt, firstResponseAt) : null;
  const mttrMinutes = solvedAt ? diffMinutes(createdAt, solvedAt) : null;

  const firstResponseBreached = firstResponseAt
    ? mttaMinutes > sla.first_response
    : elapsedAtReference > sla.first_response;
  const resolutionBreached = solvedAt
    ? mttrMinutes > sla.resolution
    : !isResolved && elapsedAtReference > sla.resolution;

  let reopenCount = 0;
  const reopenEvents = [];
  if (solvedAt) {
    reopenCount = disposition === 'temp_resolution' && rng() < profile.reopenRate
      ? Math.floor(1 + rng() * 3)
      : (disposition === 'closed' && rng() < profile.reopenRate * 0.5 ? 1 : 0);
    let lastEvent = solvedAt;
    for (let r = 0; r < reopenCount; r++) {
      lastEvent = addMinutes(lastEvent, Math.round(24 * 60 + rng() * 7 * 24 * 60));
      reopenEvents.push({ reopened_at: lastEvent.toISOString(), event_number: r + 1 });
    }
  }

  const willReopen = reopenCount > 0;

  const csatOffered = disposition === 'closed' && rng() > 0.12;
  let csatScore = null;
  if (csatOffered) {
    const base = 3.5 + profile.csatBias;
    csatScore = Math.max(1, Math.min(5, Math.round(base + (rng() - 0.5) * 2.5)));
    if (firstResponseBreached || resolutionBreached) csatScore = Math.max(1, csatScore - 1);
    if (reopenCount > 0) csatScore = Math.max(1, csatScore - 1);
  }
  const csat = csatOffered && csatScore != null
    ? buildCsatFeedback(csatScore, rng)
    : { offered: csatOffered, score: null, rated: false, comment: null, rated_at: null };
  if (csat.rated && closedAt) {
    csat.rated_at = addMinutes(closedAt, Math.round(6 * 60 + rng() * 48 * 60)).toISOString();
  }

  const status = mapDispositionToStatus(disposition);
  const escalatedTo = disposition === 'escalated'
    ? ESCALATION_TEAMS[Math.floor(rng() * ESCALATION_TEAMS.length)]
    : null;

  const subjectEntry = SUBJECTS[Math.floor(rng() * SUBJECTS.length)];
  const projectId = `proj-${account.id.replace('acc-', '')}-${Math.floor(rng() * 9000 + 1000)}`;
  const servicePlanId = `SP-${Math.floor(rng() * 900000 + 100000)}`;
  const senderId = rng() > 0.4
    ? `+1${Math.floor(rng() * 9000000000 + 1000000000)}`
    : account.name.split(' ')[0].toUpperCase().slice(0, 11);
  const errorCode = ERROR_CODES[Math.floor(rng() * ERROR_CODES.length)];
  const region = TAM_TO_ZD_REGION[tam.region] ?? SINCH_REGIONS[Math.floor(rng() * SINCH_REGIONS.length)];
  const volumeImpact = ['critical', 'high', 'medium', 'low'][Math.floor(rng() * 4)];

  const { contactName, contactEmail, threads } = buildConversation(
    subjectEntry, account, tam, rng, createdAt, firstResponseAt, disposition,
  );

  const ticketType = priority === 'P1' || priority === 'P2'
    ? (rng() > 0.85 ? 'problem' : 'incident')
    : TICKET_TYPES[Math.floor(rng() * TICKET_TYPES.length)];

  const tagList = [
    priority === 'P1' || priority === 'P2' ? 'priority' : null,
    disposition === 'escalated' ? 'escalated' : null,
    firstResponseBreached ? 'sla_breach' : null,
    reopenCount > 0 ? 'reopened' : null,
    account.tier.toLowerCase(),
    subjectEntry.product.toLowerCase().replace(/\s+/g, '_'),
    'sinch',
    'sms_messaging',
    region.toLowerCase(),
  ].filter(Boolean);

  const zendeskId = 100000 + id;

  const ticket = {
    id,
    zendesk_id: zendeskId,
    zendesk_url: `${ZENDESK_BASE_URL}/${zendeskId}`,
    subject: subjectEntry.subject,
    description: threads[0].body,
    account_id: account.id,
    account_name: account.name,
    account_tier: account.tier,
    industry: account.industry,
    tam_id: tam.id,
    tam_name: tam.name,
    tam_email: tam.email,
    priority,
    status,
    disposition,
    escalated_to: escalatedTo,
    type: ticketType,
    channel: ['email', 'web', 'api', 'phone'][Math.floor(rng() * 4)],
    requester: { name: contactName, email: contactEmail },
    sinch: {
      product: subjectEntry.product,
      category: subjectEntry.category,
      project_id: projectId,
      service_plan_id: servicePlanId,
      sender_id: senderId,
      region,
      error_code: errorCode,
      volume_impact: volumeImpact,
      api_version: 'v1',
      environment: rng() > 0.15 ? 'production' : 'staging',
    },
    conversation: threads,
    created_at: createdAt.toISOString(),
    first_response_at: firstResponseAt?.toISOString() ?? null,
    solved_at: solvedAt?.toISOString() ?? null,
    closed_at: closedAt?.toISOString() ?? null,
    sla: {
      first_response_target_minutes: sla.first_response,
      resolution_target_minutes: sla.resolution,
      first_response_breached: firstResponseBreached,
      resolution_breached: resolutionBreached,
      any_breach: firstResponseBreached || resolutionBreached,
    },
    mtta_minutes: mttaMinutes,
    mttr_minutes: mttrMinutes,
    csat,
    reopen_count: reopenCount,
    reopen_events: reopenEvents,
    tags: tagList,
  };

  ticket.zendesk = buildZendeskFields({
    id,
    zendeskId,
    subjectEntry,
    account,
    tam,
    rng,
    priority,
    type: ticketType,
    disposition,
    contactName,
    contactEmail,
    channel: ticket.channel,
    tags: tagList,
    escalatedTo,
    region,
    volumeImpact,
    createdAt,
    firstResponseAt,
    solvedAt,
  });
  ticket.zendesk.metrics = buildZendeskMetrics({
    createdAt,
    firstResponseAt,
    solvedAt,
    rng,
  });

  let lastUpdated = new Date(createdAt);
  if (firstResponseAt) lastUpdated = new Date(firstResponseAt);
  for (const msg of threads) {
    const t = new Date(msg.at);
    if (t > lastUpdated) lastUpdated = t;
  }
  for (const ev of reopenEvents) {
    const t = new Date(ev.reopened_at);
    if (t > lastUpdated) lastUpdated = t;
  }
  if (disposition !== 'closed' && rng() < 0.14) {
    lastUpdated = addMinutes(endDate, -Math.round((74 + rng() * 120) * 60));
  }
  ticket.last_updated_at = lastUpdated.toISOString();
  ticket.aging_days = Math.floor((endDate - createdAt) / (1000 * 60 * 60 * 24));
  ticket.is_stale = disposition !== 'closed'
    && (endDate - lastUpdated) / (1000 * 60 * 60) >= 72;

  const attentionReasons = computeAttentionReasons(ticket, ageDays);
  ticket.needs_attention = attentionReasons.length > 0 && disposition !== 'closed';
  ticket.attention_reasons = attentionReasons;

  if (ticket.is_stale && disposition !== 'closed') {
    ticket.attention_reasons = [...(ticket.attention_reasons ?? []), 'No update 72h+'];
    ticket.needs_attention = true;
  }

  return ticket;
}

function generateDataset() {
  const rng = seededRandom(42);
  const endDate = new Date('2026-06-22T23:59:59Z');
  const startDate = new Date('2024-01-01T00:00:00Z');
  const tickets = [];
  let ticketId = 1;

  for (const account of ACCOUNTS) {
    const profile = ACCOUNT_PROFILES[account.id];
    const ticketCount = Math.round(90 * profile.volume * 2.5);

    for (let i = 0; i < ticketCount; i++) {
      const createdAt = randomDate(rng, startDate, endDate);
      tickets.push(generateTicket(ticketId++, account, rng, createdAt, endDate));
    }
  }

  tickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    meta: {
      generated_at: new Date().toISOString(),
      source: 'Synthetic Zendesk Export — Sinch SMS & Messaging (Dummy Data)',
      description: 'Simulated Zendesk tickets for Sinch TAM dedicated enterprise accounts covering SMS API, 10DLC, Conversation API, Verification, and Numbers.',
      date_range: { start: startDate.toISOString(), end: endDate.toISOString() },
      total_tickets: tickets.length,
      total_tams: TAMS.length,
      total_accounts: ACCOUNTS.length,
      sla_policy: 'Priority-based SLA targets aligned with Zendesk Enterprise policy',
      metric_definitions: {
        mtta: 'Zendesk reply_time_in_minutes (calendar) — created_at → first public agent reply',
        mttr: 'Zendesk full_resolution_time_in_minutes (calendar) — created_at → solved_at',
      },
      dispositions: ['in_progress', 'waiting_for_response', 'temp_resolution', 'closed', 'escalated'],
      regions: SINCH_REGIONS,
      tam_regions: TAM_REGIONS,
      zendesk_base_url: ZENDESK_BASE_URL,
    },
    tams: TAMS.map((t) => ({
      ...t,
      timezone: REGION_TIMEZONES[t.region],
      availability: TAM_AVAILABILITY_SCHEDULES[t.id] ?? {},
    })),
    accounts: ACCOUNTS.map((a) => ({
      ...a,
      tam_name: TAMS.find((t) => t.id === a.tam_id).name,
    })),
    tickets,
  };
}

const dataset = generateDataset();
const outPath = join(__dirname, '../src/data/tickets.json');
writeFileSync(outPath, JSON.stringify(dataset));
console.log(`Generated ${dataset.tickets.length} tickets, ${TAMS.length} TAMs, ${ACCOUNTS.length} accounts → ${outPath}`);
