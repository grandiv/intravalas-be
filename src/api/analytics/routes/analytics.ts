export default {
  routes: [
    {
      method: 'GET',
      path: '/analytics/report',
      handler: 'analytics.getReport',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/analytics/summary',
      handler: 'analytics.getSummary',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/analytics/clear-cache',
      handler: 'analytics.clearCache',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
