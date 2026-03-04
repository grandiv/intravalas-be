/**
 * Seed script for exchange rates - Direct PostgreSQL version
 * Run with: node database/seed-exchange-rates.js
 *
 * Loads .env from parent directory and connects directly to PostgreSQL
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load seed data
const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8')
);

// Load .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at:', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=');
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  }
}

async function seedExchangeRates() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Starting exchange rates seed...');
    const effectiveDate = seedData[0].effectiveDate;

    // Clear existing data for the same effective date
    const deleteResult = await pool.query(
      'DELETE FROM exchange_rates WHERE "effectiveDate" = $1',
      [effectiveDate]
    );
    console.log(`Deleted ${deleteResult.rowCount} existing rates for ${effectiveDate}`);

    // Insert new data
    let inserted = 0;
    for (const rate of seedData) {
      await pool.query(
        `INSERT INTO exchange_rates
         ("currencyName", "currencyCode", "countryCode", "nominal", "weBuy", "weSell", "effectiveDate", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          rate.currencyName,
          rate.currencyCode,
          rate.countryCode || null,
          rate.nominal,
          rate.weBuy,
          rate.weSell,
          rate.effectiveDate,
          rate.notes || null
        ]
      );
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} exchange rates`);
  } catch (error) {
    console.error('Error seeding exchange rates:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedExchangeRates().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
