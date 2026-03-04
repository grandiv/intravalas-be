/**
 * Seed script for exchange rates
 * Run with: npx tsx database/seed-exchange-rates.ts
 */

import { exchangeRatesData } from './seed-data';

// Use CommonJS compatible approach for Strapi
const { default: strapi } = await import('@strapi/strapi');

async function seedExchangeRates() {
  // Bootstrap Strapi
  const appContext = await strapi().load();

  try {
    console.log('Starting exchange rates seed...');

    // Clear existing data for the same effective date
    const existingRates = await appContext.db.query('api::exchange-rate.exchange-rate').findMany({
      where: { effectiveDate: exchangeRatesData[0].effectiveDate }
    });

    if (existingRates.length > 0) {
      console.log(`Deleting ${existingRates.length} existing rates for ${exchangeRatesData[0].effectiveDate}...`);
      await appContext.db.query('api::exchange-rate.exchange-rate').deleteMany({
        where: { effectiveDate: exchangeRatesData[0].effectiveDate }
      });
    }

    // Insert new data
    let inserted = 0;
    for (const rate of exchangeRatesData) {
      await appContext.db.query('api::exchange-rate.exchange-rate').create({
        data: rate
      });
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} exchange rates`);
  } catch (error) {
    console.error('Error seeding exchange rates:', error);
    throw error;
  } finally {
    await appContext.destroy();
  }
}

seedExchangeRates();
