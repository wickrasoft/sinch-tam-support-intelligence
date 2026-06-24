import { normalizeTamRegion } from './tamAvailability';
import { getPortfolioActivityBreakdown, sumPortfolioActivityBreakdown } from './metrics';

export const TAM_REGIONS = ['US', 'EMEA', 'APAC', 'LATAM'];

export const REGION_CHART_COLORS = {
  US: '#38bdf8',
  EMEA: '#8b5cf6',
  APAC: '#34d399',
  LATAM: '#fb923c',
};

function emptyRegionBucket(region) {
  return {
    region,
    value: 0,
    tamCount: 0,
    created: 0,
    p1p2: 0,
    p3p5: 0,
    resolved: 0,
    closed: 0,
    tams: [],
  };
}

export function buildRegionPortfolioDistribution(tamMetrics, allTams) {
  const buckets = Object.fromEntries(
    TAM_REGIONS.map((region) => [region, emptyRegionBucket(region)]),
  );

  for (const tam of tamMetrics) {
    const meta = allTams.find((t) => t.id === tam.tam_id);
    const region = normalizeTamRegion(meta?.region);
    const bucket = buckets[region] ?? buckets.US;
    const breakdown = tam.metrics.activityBreakdown ?? getPortfolioActivityBreakdown(tam.metrics);
    const activityTotal = tam.metrics.activityTotal ?? sumPortfolioActivityBreakdown(breakdown);

    bucket.value += activityTotal;
    bucket.tamCount += 1;
    bucket.created += breakdown.created ?? 0;
    bucket.p1p2 += breakdown.p1p2 ?? 0;
    bucket.p3p5 += breakdown.p3p5 ?? 0;
    bucket.resolved += breakdown.resolved ?? 0;
    bucket.closed += breakdown.closed ?? 0;
    bucket.tams.push({ ...tam, region, tamMeta: meta });
  }

  return TAM_REGIONS.map((region) => buckets[region]);
}

export function getRegionDistributionTotal(data) {
  return data.reduce((sum, row) => sum + row.value, 0);
}

export function getTamIdsForRegion(allTams, region) {
  return allTams
    .filter((tam) => normalizeTamRegion(tam.region) === region)
    .map((tam) => tam.id);
}
