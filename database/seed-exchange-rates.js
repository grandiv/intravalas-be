/**
 * Seed script for exchange rates
 * Run with: node database/seed-exchange-rates.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Load seed data
const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8')
);

async function seedExchangeRates() {
  // Get Strapi - use require for CommonJS
  const { createStrapi } = require('@strapi/strapi');

  // Bootstrap Strapi
  const strapi = createStrapi();
  await strapi.load();

  try {
    console.log('Starting exchange rates seed...');

    // Clear existing data for the same effective date
    const existingRates = await strapi.db.query('api::exchange-rate.exchange-rate').findMany({
      where: { effectiveDate: seedData[0].effectiveDate }
    });

    if (existingRates.length > 0) {
      console.log(`Deleting ${existingRates.length} existing rates for ${seedData[0].effectiveDate}...`);
      await strapi.db.query('api::exchange-rate.exchange-rate').deleteMany({
        where: { effectiveDate: seedData[0].effectiveDate }
      });
    }

    // Insert new data
    let inserted = 0;
    for (const rate of seedData) {
      await strapi.db.query('api::exchange-rate.exchange-rate').create({
        data: rate
      });
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} exchange rates`);
  } catch (error) {
    console.error('Error seeding exchange rates:', error);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

seedExchangeRates().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
