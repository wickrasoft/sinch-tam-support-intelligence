// Distribution of tickets by Sinch product (ticket.sinch.product). Used by the
// "Tickets by Product" pie chart next to the JIRA escalations panel.

export const PRODUCT_COLORS = {
  'SMS API': '#2563eb',
  'Conversation API': '#0d9488',
  'Verification API': '#9333ea',
  'Numbers API': '#f59e0b',
  'Number Lookup API': '#db2777',
  '10DLC Registration': '#dc2626',
};

// Stable fallback palette for any product not in the map above.
const FALLBACK_PALETTE = ['#64748b', '#0ea5e9', '#84cc16', '#e11d48', '#7c3aed', '#14b8a6'];

export function productColor(product, index = 0) {
  return PRODUCT_COLORS[product] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export function getProductDistribution(tickets) {
  const counts = new Map();
  for (const ticket of tickets ?? []) {
    const product = ticket.sinch?.product ?? 'Other';
    counts.set(product, (counts.get(product) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([product, value]) => ({ product, value }))
    .sort((a, b) => b.value - a.value);
}
