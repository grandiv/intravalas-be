import type { Core } from '@strapi/strapi';
import analyticsService from '../services/analytics';

export default {
  async getReport(ctx) {
    try {
      const { startDate, endDate, dimensions, metrics } = ctx.query;

      if (!metrics) {
        return ctx.badRequest('metrics query parameter is required');
      }

      const data = await analyticsService.getAnalyticsData({
        startDate: startDate as string,
        endDate: endDate as string,
        dimensions: dimensions ? (dimensions as string).split(',') : [],
        metrics: (metrics as string).split(','),
      });

      return { data };
    } catch (error) {
      strapi.log.error('Analytics report error:', error);
      return ctx.internalServerError('Failed to fetch analytics report');
    }
  },

  async getSummary(ctx) {
    try {
      const { startDate, endDate } = ctx.query;

      const data = await analyticsService.getSummary({
        startDate: (startDate as string) || '30daysAgo',
        endDate: (endDate as string) || 'today',
      });

      return { data };
    } catch (error) {
      strapi.log.error('Analytics summary error:', error);
      return ctx.internalServerError('Failed to fetch analytics summary');
    }
  },

  async clearCache(ctx) {
    try {
      const data = analyticsService.clearCache();
      return { data };
    } catch (error) {
      strapi.log.error('Analytics clear cache error:', error);
      return ctx.internalServerError('Failed to clear analytics cache');
    }
  },
};
