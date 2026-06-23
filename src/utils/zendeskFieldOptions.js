export const FIELD_OPTIONS = {
  sharing: ['Not shared', 'Shared with Carrier Ops', 'Shared with Engineering', 'Shared with Compliance Team'],
  form: ['Sinch Messaging Support', 'Enterprise TAM Escalation', 'Carrier Operations', '10DLC Compliance'],
  type: ['incident', 'problem', 'question', 'task'],
  priority: [
    { value: 'P1', label: 'P1 — Urgent' },
    { value: 'P2', label: 'P2 — High' },
    { value: 'P3', label: 'P3 — Normal' },
    { value: 'P4', label: 'P4 — Low' },
  ],
  impact: ['Critical', 'High', 'Medium', 'Low'],
  region: ['US', 'EU', 'APAC', 'LATAM'],
  product: [
    'SMS API', '10DLC Registration', 'Conversation API', 'Verification API',
    'Numbers API', 'Voice API', 'Mailgun', 'Number Lookup',
  ],
  case_type: [
    'Technical Issue', 'Delivery Failure', 'Compliance / 10DLC', 'Provisioning',
    'Performance Degradation', 'Configuration', 'Billing Dispute', 'Carrier Escalation',
  ],
  issue_source: [
    'Customer Reported', 'Proactive Monitoring', 'Carrier Alert', 'TAM Escalation',
    'Internal QA', 'Scheduled Maintenance Follow-up',
  ],
  root_cause: [
    'Carrier routing misconfiguration', 'Customer API integration error', 'MNO aggregator outage',
    '10DLC campaign non-compliance', 'Rate limit misconfiguration', 'Invalid sender ID registration',
    'Webhook endpoint timeout', 'Number porting delay', 'Platform bug — patched',
  ],
  resolution: [
    'Issue resolved — traffic restored to normal', 'Workaround provided — permanent fix scheduled',
    'Carrier confirmed fix on MNO side', 'Customer updated integration per guidance',
    'Campaign re-submitted and approved', 'Configuration corrected in Sinch Build',
    'Escalated to vendor — resolved externally',
  ],
  escalated_team: [
    'Sinch Carrier Ops', '10DLC Compliance Team', 'SMS Platform Engineering',
    'Conversation API Support', 'Numbers Provisioning', 'Verification Platform',
  ],
  case_origin: ['Email', 'Web Form', 'Phone', 'API', 'TAM Portal', 'Chat', 'Monitoring Alert'],
  jira_status: ['Open', 'In Progress', 'In Review', 'Done', 'Blocked', 'Not Linked'],
  in_progress: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
};
