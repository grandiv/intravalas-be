import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Grant public access to exchange-rate API
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (publicRole) {
      // Check if permissions already exist
      const existingPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: {
          role: publicRole.id,
          action: { startsWith: 'api::exchange-rate' },
        },
      });

      if (existingPermissions.length === 0) {
        // Create permissions for exchange-rate
        const actions = ['find', 'findOne'];
        for (const action of actions) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: `api::exchange-rate.exchange-rate.${action}`,
              role: publicRole.id,
              properties: {},
              subject: null,
            },
          });
        }
        strapi.log.info('✅ Public permissions created for exchange-rate API');
      }
    }
  },
};
