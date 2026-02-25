# Intravalas Backend - Production Deployment Guide

This guide covers deploying the Strapi v5 backend to production and provides everything a frontend developer needs to integrate with the API.

---

## Table of Contents

1. [Deployment Options](#1-deployment-options)
2. [Deploy to Railway (Recommended)](#2-deploy-to-railway)
3. [Deploy to Render](#3-deploy-to-render)
4. [Deploy to VPS (Manual)](#4-deploy-to-vps)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Post-Deployment Setup](#6-post-deployment-setup)
7. [Frontend Integration Guide](#7-frontend-integration-guide)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Deployment Options

Strapi v5 requires:
- **Node.js** >= 20.x
- **PostgreSQL** >= 14
- Persistent file storage (for media uploads)

| Platform | PostgreSQL | File Storage | Notes |
|----------|-----------|--------------|-------|
| Railway | Built-in add-on | Persistent volume | Easiest setup |
| Render | Built-in managed DB | Persistent disk | Free tier available |
| VPS (DigitalOcean, etc.) | Self-managed | Local disk | Full control |

---

## 2. Deploy to Railway

### Step 1: Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project > Deploy from GitHub repo**
3. Select `grandiv/intravalas-be`

### Step 2: Add PostgreSQL

1. In your Railway project, click **+ New > Database > PostgreSQL**
2. Railway automatically sets `DATABASE_URL` for linked services

### Step 3: Configure environment variables

In the Strapi service settings, go to **Variables** and add:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://your-service.up.railway.app

# Generate each with: openssl rand -base64 32
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=generate-random-string
ADMIN_JWT_SECRET=generate-random-string
TRANSFER_TOKEN_SALT=generate-random-string
ENCRYPTION_KEY=generate-random-string
JWT_SECRET=generate-random-string

# Railway provides this automatically if PostgreSQL is linked
# DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true

# Frontend URL(s)
CORS_ORIGINS=https://your-frontend-domain.com

# Google Analytics (optional)
GA_PROPERTY_ID=your-ga4-property-id
GA_CLIENT_EMAIL=your-sa@project.iam.gserviceaccount.com
GA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GA_CACHE_TTL=300
```

### Step 4: Configure build & start commands

In service settings:
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Root directory:** `/` (leave default)

### Step 5: Deploy

Railway deploys automatically on push to `master`. After deployment:
1. Open your service URL + `/admin` to create the admin account
2. The service URL is your `PUBLIC_URL`

---

## 3. Deploy to Render

### Step 1: Create a PostgreSQL database

1. Go to [render.com](https://render.com) > **New > PostgreSQL**
2. Choose a plan and create the database
3. Copy the **Internal Database URL** for later

### Step 2: Create a Web Service

1. **New > Web Service > Connect** the `grandiv/intravalas-be` repo
2. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`

### Step 3: Set environment variables

In the web service **Environment** tab, add:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
PUBLIC_URL=https://your-service.onrender.com

APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=generate-random-string
ADMIN_JWT_SECRET=generate-random-string
TRANSFER_TOKEN_SALT=generate-random-string
ENCRYPTION_KEY=generate-random-string
JWT_SECRET=generate-random-string

DATABASE_URL=your-internal-database-url
DATABASE_SSL=true

CORS_ORIGINS=https://your-frontend-domain.com
```

> **Note:** Render uses port 10000 by default. Set `PORT=10000` or configure it in Render's settings.

### Step 4: Add persistent disk (for uploads)

1. In your web service, go to **Disks**
2. Add a disk at mount path `/opt/render/project/src/public/uploads`
3. This persists uploaded media files across deploys

---

## 4. Deploy to VPS

### Step 1: Server setup

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres createdb intravalas
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your-secure-password';"
```

### Step 2: Clone and install

```bash
git clone https://github.com/grandiv/intravalas-be.git
cd intravalas-be
npm install
```

### Step 3: Create `.env`

```bash
cp .env.example .env
nano .env
```

Fill in all values (see [Environment Variables Reference](#5-environment-variables-reference)).

### Step 4: Build and start

```bash
# Build for production
NODE_ENV=production npm run build

# Start with a process manager
npm install -g pm2
NODE_ENV=production pm2 start npm --name "intravalas-be" -- start
pm2 save
pm2 startup
```

### Step 5: Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_pass_request_headers on;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/intravalas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add SSL with Certbot
sudo certbot --nginx -d api.yourdomain.com
```

---

## 5. Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `HOST` | Bind address | `0.0.0.0` |
| `PORT` | Server port | `1337` |
| `PUBLIC_URL` | Public-facing URL | `https://api.yourdomain.com` |
| `APP_KEYS` | Comma-separated session keys | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | Salt for API tokens | random string |
| `ADMIN_JWT_SECRET` | Secret for admin JWT | random string |
| `TRANSFER_TOKEN_SALT` | Salt for transfer tokens | random string |
| `ENCRYPTION_KEY` | Data encryption key | random string |
| `JWT_SECRET` | Secret for user JWT | random string |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `DATABASE_SSL` | Enable SSL for database | `true` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://frontend.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | DB host (if not using DATABASE_URL) | `localhost` |
| `DATABASE_PORT` | DB port | `5432` |
| `DATABASE_NAME` | DB name | `strapi` |
| `DATABASE_USERNAME` | DB user | `strapi` |
| `DATABASE_PASSWORD` | DB password | `strapi` |
| `GA_PROPERTY_ID` | Google Analytics 4 property ID | — |
| `GA_CLIENT_EMAIL` | GA service account email | — |
| `GA_PRIVATE_KEY` | GA service account private key | — |
| `GA_CACHE_TTL` | Analytics cache TTL in seconds | `300` |

### Generate secrets

```bash
# Generate all secrets at once
for key in APP_KEY1 APP_KEY2 APP_KEY3 APP_KEY4 API_TOKEN_SALT ADMIN_JWT_SECRET TRANSFER_TOKEN_SALT ENCRYPTION_KEY JWT_SECRET; do
  echo "$key=$(openssl rand -base64 32)"
done
```

---

## 6. Post-Deployment Setup

After the first deployment:

### Create admin account
1. Open `https://your-api-url.com/admin`
2. Register the first admin user
3. This account has full access to the Strapi dashboard

### Configure API permissions
1. Go to **Settings > Users & Permissions > Roles**
2. **Public** role: enable `find` and `findOne` for Currency and Article
3. **Authenticated** role: enable all actions for Currency, Article, and Analytics
4. Save both roles

### Create an API token for the frontend
1. Go to **Settings > API Tokens > Create new API Token**
2. Name: `Frontend Production`
3. Token type: `Custom`
4. Under Currency: enable `find`, `findOne`
5. Under Article: enable `find`, `findOne`
6. Under Analytics: enable `getReport`, `getSummary`
7. Save and copy the token — **it's only shown once**

---

## 7. Frontend Integration Guide

### Base URL

```
Production: https://your-api-url.com
Local dev:  http://localhost:1337
```

### Authentication

Include the API token in every request:

```
Authorization: Bearer <your-api-token>
```

Public endpoints (currencies list, articles list) work without a token if configured in the Public role.

### Fetch examples (JavaScript/TypeScript)

```typescript
const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
};

// List all currencies
const currencies = await fetch(`${API_URL}/api/currencies`, { headers })
  .then(res => res.json());

// List published articles (non-embed, slug-based)
const articles = await fetch(
  `${API_URL}/api/articles?filters[isEmbed][$eq]=false&populate=thumbnail`,
  { headers }
).then(res => res.json());

// List embed articles
const embeds = await fetch(
  `${API_URL}/api/articles?filters[isEmbed][$eq]=true`,
  { headers }
).then(res => res.json());

// Find article by slug
const article = await fetch(
  `${API_URL}/api/articles?filters[slug][$eq]=rupiah-strengthens&populate=thumbnail`,
  { headers }
).then(res => res.json());

// Analytics summary (authenticated only)
const analytics = await fetch(
  `${API_URL}/api/analytics/summary?startDate=30daysAgo&endDate=today`,
  { headers }
).then(res => res.json());
```

### Response format

All Strapi responses follow this structure:

```json
{
  "data": [ ... ] or { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

Single item responses have `data` as an object. List responses have `data` as an array.

### Pagination

```
?pagination[page]=1&pagination[pageSize]=10
```

### Sorting

```
?sort=date:desc
?sort[0]=publishedDate:desc&sort[1]=title:asc
```

### Field selection

```
?fields[0]=name&fields[1]=code&fields[2]=buyRate&fields[3]=sellRate
```

### Populating relations (media)

```
?populate=thumbnail
?populate=*
```

---

## 8. API Endpoints Reference

### Currency

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/currencies` | Public | List all currencies |
| GET | `/api/currencies/:documentId` | Public | Get one currency |
| POST | `/api/currencies` | Token | Create a currency |
| PUT | `/api/currencies/:documentId` | Token | Update a currency |
| DELETE | `/api/currencies/:documentId` | Token | Delete a currency |

**Currency object:**
```json
{
  "id": 1,
  "documentId": "abc123",
  "name": "US Dollar",
  "code": "USD",
  "buyRate": 15850,
  "sellRate": 16050,
  "middleRate": 15950,
  "date": "2026-02-26",
  "source": "Bank Indonesia",
  "changePercentage": 0,
  "notes": null
}
```

### Article

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/articles` | Public | List all articles |
| GET | `/api/articles/:documentId` | Public | Get one article |
| POST | `/api/articles` | Token | Create an article |
| PUT | `/api/articles/:documentId` | Token | Update an article |
| DELETE | `/api/articles/:documentId` | Token | Delete an article |

**Useful filters:**
```
?filters[isEmbed][$eq]=true          — embed articles only
?filters[isEmbed][$eq]=false         — slug articles only
?filters[slug][$eq]=my-article       — find by slug
?filters[category][$eq]=finance      — filter by category
?filters[status][$eq]=published      — filter by status
```

**Article object:**
```json
{
  "id": 1,
  "documentId": "xyz789",
  "title": "Rupiah Strengthens Against Dollar",
  "slug": "rupiah-strengthens-against-dollar",
  "content": "...",
  "embedUrl": null,
  "embedType": null,
  "source": "Editorial",
  "category": "finance",
  "publishedDate": "2026-02-26",
  "isEmbed": false,
  "status": "published",
  "thumbnail": {
    "url": "/uploads/image.jpg",
    "width": 800,
    "height": 600
  }
}
```

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/report` | Token | Custom GA report |
| GET | `/api/analytics/summary` | Token | Dashboard overview |
| POST | `/api/analytics/clear-cache` | Token | Clear GA cache |

**Summary query params:**
```
?startDate=30daysAgo&endDate=today
?startDate=2026-01-01&endDate=2026-02-26
```

**Summary response:**
```json
{
  "data": {
    "pageViews": 12500,
    "sessions": 8200,
    "users": 5100,
    "bounceRate": 0.42,
    "avgSessionDuration": 185.5,
    "newUsers": 3200,
    "dateRange": {
      "startDate": "30daysAgo",
      "endDate": "today"
    }
  }
}
```

**Report query params:**
```
?startDate=30daysAgo&endDate=today&metrics=screenPageViews,sessions&dimensions=pagePath
```

**Report response:**
```json
{
  "data": {
    "rows": [
      {
        "dimensions": ["/home"],
        "metrics": ["5000", "3200"]
      }
    ],
    "dimensionHeaders": ["pagePath"],
    "metricHeaders": ["screenPageViews", "sessions"],
    "rowCount": 10
  }
}
```

---

## 9. Troubleshooting

### "Connection refused" on deployment
- Ensure `DATABASE_URL` or `DATABASE_HOST`/`DATABASE_PORT` are correct
- Check that PostgreSQL is accepting connections and the database exists

### CORS errors from frontend
- Add your frontend URL to `CORS_ORIGINS` (comma-separated for multiple)
- Restart the Strapi service after changing env vars

### Admin panel shows blank page
- Ensure `PUBLIC_URL` matches the actual URL the service is accessible at
- Run `npm run build` again after changing `PUBLIC_URL`

### Media uploads return 404
- On Render/Railway: ensure persistent storage is configured
- Media URL is relative by default (`/uploads/file.jpg`); prepend `PUBLIC_URL` on the frontend

### Analytics endpoints return 500
- Verify `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` are set
- Ensure the service account has Viewer access on the GA4 property
- Check that `GA_PRIVATE_KEY` has `\n` newlines preserved (not literal newlines)
