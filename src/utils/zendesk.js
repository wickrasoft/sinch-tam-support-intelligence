export const ZENDESK_BASE_URL = 'https://sinchmessaging.zendesk.com/agent/tickets';

export function getZendeskTicketUrl(zendeskId) {
  return `${ZENDESK_BASE_URL}/${zendeskId}`;
}

export const ZD_REGIONS = ['US', 'EU', 'APAC', 'LATAM'];
