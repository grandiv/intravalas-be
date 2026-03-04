/**
 * Seed script for articles - Direct PostgreSQL version
 * Run with: node database/seed-articles.js
 *
 * Loads .env from parent directory and connects directly to PostgreSQL
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

// Load seed data
const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seed-data-news.json'), 'utf8')
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

// Generate a Strapi-compatible document ID
function generateDocumentId() {
  return crypto.randomUUID();
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function seedArticles() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Starting articles seed...');

    // Clear existing articles (optional - comment out if you want to keep existing)
    const deleteResult = await pool.query('DELETE FROM articles');
    console.log(`Deleted ${deleteResult.rowCount} existing articles`);

    // Insert new data
    let inserted = 0;
    for (const article of seedData) {
      const documentId = generateDocumentId();
      const slug = generateSlug(article.title);

      await pool.query(
        `INSERT INTO articles
         (document_id, title, slug, description, content, read_time, source, category, published_date, thumbnail_url, status, created_at, updated_at, locale, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), 'en', NOW())`,
        [
          documentId,
          article.title,
          slug,
          article.description,
          article.content || article.description,
          article.readTime || null,
          article.source,
          article.category,
          article.publishedDate,
          article.thumbnailUrl || null,
          article.status || 'published'
        ]
      );
      inserted++;
      console.log(`  Inserted: ${article.title.substring(0, 50)}...`);
    }

    console.log(`\nSuccessfully seeded ${inserted} articles`);
  } catch (error) {
    console.error('Error seeding articles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedArticles().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
