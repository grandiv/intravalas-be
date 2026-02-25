import { BetaAnalyticsDataClient } from '@google-analytics/data';
import NodeCache from 'node-cache';

let analyticsClient: BetaAnalyticsDataClient | null = null;
let cache: NodeCache | null = null;

function getCache(): NodeCache {
  if (!cache) {
    const ttl = parseInt(process.env.GA_CACHE_TTL || '300', 10);
    cache = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2 });
  }
  return cache;
}

function getClient(): BetaAnalyticsDataClient {
  if (!analyticsClient) {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      analyticsClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
      });
    } else {
      // Falls back to GOOGLE_APPLICATION_CREDENTIALS file
      analyticsClient = new BetaAnalyticsDataClient();
    }
  }
  return analyticsClient;
}

function getPropertyId(): string {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) {
    throw new Error('GA_PROPERTY_ID environment variable is not set');
  }
  return propertyId;
}

export default {
  async getAnalyticsData({
    startDate = '30daysAgo',
    endDate = 'today',
    dimensions = [],
    metrics = [],
  }: {
    startDate?: string;
    endDate?: string;
    dimensions?: string[];
    metrics?: string[];
  }) {
    const cacheKey = `report:${startDate}:${endDate}:${dimensions.join(',')}:${metrics.join(',')}`;
    const cached = getCache().get(cacheKey);
    if (cached) return cached;

    const client = getClient();
    const propertyId = getPropertyId();

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
    });

    const result = {
      rows: (response.rows || []).map((row) => ({
        dimensions: (row.dimensionValues || []).map((d) => d.value),
        metrics: (row.metricValues || []).map((m) => m.value),
      })),
      dimensionHeaders: (response.dimensionHeaders || []).map((h) => h.name),
      metricHeaders: (response.metricHeaders || []).map((h) => h.name),
      rowCount: response.rowCount,
    };

    getCache().set(cacheKey, result);
    return result;
  },

  async getSummary({
    startDate = '30daysAgo',
    endDate = 'today',
  }: {
    startDate?: string;
    endDate?: string;
  }) {
    const cacheKey = `summary:${startDate}:${endDate}`;
    const cached = getCache().get(cacheKey);
    if (cached) return cached;

    const client = getClient();
    const propertyId = getPropertyId();

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
      ],
    });

    const row = response.rows?.[0];
    const values = row?.metricValues || [];

    const result = {
      pageViews: parseInt(values[0]?.value || '0', 10),
      sessions: parseInt(values[1]?.value || '0', 10),
      users: parseInt(values[2]?.value || '0', 10),
      bounceRate: parseFloat(values[3]?.value || '0'),
      avgSessionDuration: parseFloat(values[4]?.value || '0'),
      newUsers: parseInt(values[5]?.value || '0', 10),
      dateRange: { startDate, endDate },
    };

    getCache().set(cacheKey, result);
    return result;
  },

  clearCache() {
    getCache().flushAll();
    return { message: 'Analytics cache cleared' };
  },
};
