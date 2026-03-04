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

// Generate a Strapi-compatible document ID (26 character alphanumeric)
function generateDocumentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 26; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    // Get admin user ID for ownership
    const adminResult = await pool.query('SELECT id FROM admin_users LIMIT 1');
    const adminId = adminResult.rows[0]?.id || 1;

    let inserted = 0;
    let updated = 0;

    for (const article of seedData) {
      const slug = generateSlug(article.title);

      // Check if article exists by slug
      const existingResult = await pool.query(
        'SELECT id, document_id FROM articles WHERE slug = $1',
        [slug]
      );

      if (existingResult.rows.length > 0) {
        // Update existing article
        const existingId = existingResult.rows[0].id;
        await pool.query(
          `UPDATE articles SET
           title = $1, description = $2, content = $3, read_time = $4,
           source = $5, category = $6, published_date = $7, thumbnail_url = $8,
           status = $9, updated_at = NOW(), updated_by_id = $10,
           created_by_id = COALESCE(created_by_id, $10)
           WHERE id = $11`,
          [
            article.title,
            article.description,
            article.content || article.description,
            article.readTime || null,
            article.source,
            article.category,
            article.publishedDate,
            article.thumbnailUrl || null,
            article.status || 'published',
            adminId,
            existingId
          ]
        );
        updated++;
        console.log(`  Updated: ${article.title.substring(0, 50)}...`);
      } else {
        // Insert new article - need BOTH draft and published rows for Strapi v5
        const documentId = generateDocumentId();

        // Insert draft version (published_at = NULL, status = 'draft')
        await pool.query(
          `INSERT INTO articles
           (document_id, title, slug, description, content, read_time, source, category, published_date, thumbnail_url, status, created_at, updated_at, locale, published_at, created_by_id, updated_by_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', NOW(), NOW(), $11, NULL, $12, $12)`,
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
            null, // locale = NULL for draft
            adminId
          ]
        );

        // Insert published version (published_at = NOW(), status = 'published')
        await pool.query(
          `INSERT INTO articles
           (document_id, title, slug, description, content, read_time, source, category, published_date, thumbnail_url, status, created_at, updated_at, locale, published_at, created_by_id, updated_by_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published', NOW(), NOW(), 'en', NOW(), $11, $11)`,
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
            adminId
          ]
        );
        inserted++;
        console.log(`  Inserted: ${article.title.substring(0, 50)}...`);
      }
    }

    console.log(`\nSuccessfully seeded ${inserted} new articles, updated ${updated} existing articles`);
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
