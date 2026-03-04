/**
 * Seed script for exchange rates
 * Run with: npx tsx database/seed-exchange-rates.ts
 */

import { exchangeRatesData } from './seed-data';

async function seedExchangeRates() {
  // Dynamic import for Strapi
  const strapiModule = await import('@strapi/strapi');
  const strapi = strapiModule.default;

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

// Run the seed function
seedExchangeRates().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
