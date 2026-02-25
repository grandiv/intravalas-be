# Intravalas Backend - Getting Started Tutorial

## Prerequisites

- **Node.js** >= 20.x
- **PostgreSQL** running locally (default: `127.0.0.1:5432`)
- Create a database:
  ```sql
  psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE intravalas;"
  ```

## 1. Start the Server

```bash
cd strapi/intravalas-be
npm run develop
```

The first run will build the admin panel and create all database tables automatically. Strapi starts on `http://localhost:1337`.

## 2. Create Your Admin Account

Open `http://localhost:1337/admin` in your browser. You'll see a registration form:

- Fill in your name, email, and password
  name: admin
  email: grandivfarand@gmail.com
  password: 4Dm1n1337$
- This creates your **super admin** account
- You'll land on the Strapi admin dashboard

## 3. Verify Content Types

In the left sidebar:

- **Content Manager** — you should see **Currency** and **Article** listed
- **Content-Type Builder** — shows all fields for each type (read-only while the server runs in develop mode)

### Currency Fields

| Field | Type | Notes |
|-------|------|-------|
| name | String | required, e.g. "US Dollar" |
| code | String | required, unique, e.g. "USD" |
| buyRate | Decimal | required |
| sellRate | Decimal | required |
| middleRate | Decimal | required |
| date | Date | required |
| source | String | required, e.g. "Bank Indonesia" |
| changePercentage | Decimal | default 0 |
| notes | Text | optional |

### Article Fields

| Field | Type | Notes |
|-------|------|-------|
| title | String | required |
| slug | UID | auto-generated from title |
| content | Rich Text | for slug-based articles |
| embedUrl | String | for embed-based articles |
| embedType | Enum | iframe, script, oembed |
| source | String | required |
| category | String | article category |
| publishedDate | Date | required |
| thumbnail | Media | images only, optional |
| isEmbed | Boolean | default false |
| status | Enum | draft, published, archived |

## 4. Create Test Entries

### Currency

1. Go to **Content Manager > Currency > Create new entry**
2. Fill in the fields:
   - name: `US Dollar`
   - code: `USD`
   - buyRate: `15850.00`
   - sellRate: `16050.00`
   - middleRate: `15950.00`
   - date: `2026-02-26`
   - source: `Bank Indonesia`
3. Click **Save** (no publish step needed — Currency has no draft workflow)

### Article (slug-based)

1. Go to **Content Manager > Article > Create new entry**
2. Fill in:
   - title: `Rupiah Strengthens Against Dollar`
   - content: write your article body
   - source: `Editorial`
   - publishedDate: `2026-02-26`
   - isEmbed: `false`
   - status: `published`
3. Click **Save**, then **Publish**

### Article (embed-based)

1. Create another article entry
2. Fill in:
   - title: `Market Watch Live`
   - embedUrl: `https://example.com/embed/market-watch`
   - embedType: `iframe`
   - source: `External`
   - publishedDate: `2026-02-26`
   - isEmbed: `true`
   - status: `published`
3. Click **Save**, then **Publish**

## 5. Configure API Permissions

By default all API endpoints require authentication. To configure access:

Go to **Settings > Users & Permissions > Roles**.

### Public Role (unauthenticated access)

1. Click **Public**
2. Under **Currency**: check `find` and `findOne`
3. Under **Article**: check `find` and `findOne`
4. Click **Save**

### Authenticated Role (token-based access)

1. Click **Authenticated**
2. Under **Currency**: check all (`find`, `findOne`, `create`, `update`, `delete`)
3. Under **Article**: check all (`find`, `findOne`, `create`, `update`, `delete`)
4. Under **Analytics**: check `getReport`, `getSummary`, `clearCache`
5. Click **Save**

## 6. Create an API Token

1. Go to **Settings > API Tokens > Create new API Token**
2. Name: `Dashboard Frontend`
3. Token type: `Full access` (or `Custom` to pick specific permissions)
4. Click **Save** and copy the generated token

## 7. Test REST Endpoints

### Public Endpoints (no auth required)

```bash
# List all currencies
curl http://localhost:1337/api/currencies

# Get a single currency by document ID
curl http://localhost:1337/api/currencies/<documentId>

# List all articles
curl http://localhost:1337/api/articles

# Filter: embed articles only
curl "http://localhost:1337/api/articles?filters[isEmbed][$eq]=true"

# Filter: find by slug
curl "http://localhost:1337/api/articles?filters[slug][$eq]=rupiah-strengthens-against-dollar"

# Include thumbnail media
curl "http://localhost:1337/api/articles?populate=thumbnail"
```

### Authenticated Endpoints (token required)

```bash
TOKEN="your-api-token-here"

# Create a currency
curl -X POST http://localhost:1337/api/currencies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Euro",
      "code": "EUR",
      "buyRate": 17100.00,
      "sellRate": 17300.00,
      "middleRate": 17200.00,
      "date": "2026-02-26",
      "source": "Bank Indonesia"
    }
  }'

# Update a currency
curl -X PUT http://localhost:1337/api/currencies/<documentId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "buyRate": 17150.00
    }
  }'

# Delete a currency
curl -X DELETE http://localhost:1337/api/currencies/<documentId> \
  -H "Authorization: Bearer $TOKEN"

# Analytics summary
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:1337/api/analytics/summary?startDate=30daysAgo&endDate=today"

# Analytics report with custom dimensions/metrics
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:1337/api/analytics/report?startDate=30daysAgo&endDate=today&metrics=screenPageViews,sessions&dimensions=pagePath"

# Clear analytics cache
curl -X POST http://localhost:1337/api/analytics/clear-cache \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Configure Google Analytics (Optional)

The analytics endpoints require a Google Analytics 4 service account.

### Setup Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Analytics Data API**
3. Create a **Service Account** and download the JSON key
4. In your GA4 property, go to **Admin > Property Access Management** and grant the service account email **Viewer** access

### Environment Variables

Add these to your `.env`:

```env
GA_PROPERTY_ID=123456789
GA_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GA_CACHE_TTL=300
```

Restart the server after updating `.env`.

## 9. API Endpoints Reference

### Currency (auto-generated by Strapi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/currencies` | List all currencies |
| GET | `/api/currencies/:documentId` | Get one currency |
| POST | `/api/currencies` | Create a currency |
| PUT | `/api/currencies/:documentId` | Update a currency |
| DELETE | `/api/currencies/:documentId` | Delete a currency |

### Article (auto-generated by Strapi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/:documentId` | Get one article |
| POST | `/api/articles` | Create an article |
| PUT | `/api/articles/:documentId` | Update an article |
| DELETE | `/api/articles/:documentId` | Delete an article |

### Analytics (custom)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/report` | Configurable GA report |
| GET | `/api/analytics/summary` | Overview dashboard metrics |
| POST | `/api/analytics/clear-cache` | Clear cached GA data |

## 10. Production Deployment

Set `NODE_ENV=production` and configure these environment variables:

```env
# Required
DATABASE_URL=postgres://user:password@host:5432/dbname
DATABASE_SSL=true
PUBLIC_URL=https://your-api-domain.com
CORS_ORIGINS=https://your-frontend-domain.com

# Generate unique random values for each
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=random-string
ADMIN_JWT_SECRET=random-string
TRANSFER_TOKEN_SALT=random-string
ENCRYPTION_KEY=random-string
JWT_SECRET=random-string
```

Then build and start:

```bash
npm run build
npm start
```
