/**
 * Lifecycle hooks for Article content type
 * Automatically syncs the 'status' field with Strapi's draft/publish system
 */

export default {
  // Before publishing, ensure status is 'published'
  async beforePublish(event) {
    const { data } = event.params;
    data.status = 'published';
  },

  // Before unpublishing, ensure status is 'draft'
  async beforeUnpublish(event) {
    const { data } = event.params;
    data.status = 'draft';
  },
};
