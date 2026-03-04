# Intravalas Backend V2 - Exchange Rate Setup

This guide covers the new **Exchange Rate** content type and how to configure it after deployment.

---

## 1. Exchange Rate Content Type

The new `exchange-rate` content type replaces the old `currency` collection. It supports multiple rates per currency based on nominal (bill denomination).

### Exchange Rate Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currencyName | String | Yes | Full name (e.g., "US Dollar", "Euro") |
| currencyCode | String | Yes | ISO 4217 code (e.g., "USD", "EUR") |
| countryCode | String | No | ISO 3166-1 alpha-2 for flag icons (e.g., "US", "EU") |
| nominal | String | Yes | Bill denomination (e.g., "100 good", "50", "5-20", "Old") |
| weBuy | Decimal | No | Bank's buying rate (null if not applicable) |
| weSell | Decimal | No | Bank's selling rate (null if not applicable) |
| effectiveDate | Date | Yes | Date these rates are effective |
| notes | String | No | Additional notes |

---

## 2. Configure Public API Permissions

After deployment, you must configure permissions to allow public access to the exchange-rate API.

### Steps

1. Go to **https://api-intravalas.izcy.tech/admin**
2. Log in with your admin credentials
3. Navigate to **Settings** (gear icon in left sidebar)
4. Under **USERS & PERMISSIONS PLUGIN**, click **Roles**
5. Click **Public**
6. Scroll down to **EXCHANGE-RATE** section
7. Check the following permissions:
   - ✅ `find` - List all exchange rates
   - ✅ `findOne` - Get a single exchange rate
8. Click **Save** at the top right

### Screenshot Reference

```
Settings > Users & Permissions > Roles > Public

┌─────────────────────────────────────────────────┐
│ EXCHANGE-RATE                                   │
├─────────────────────────────────────────────────┤
│ ☑ find    GET /api/exchange-rates              │
│ ☑ findOne GET /api/exchange-rates/:documentId   │
│ ☐ create  POST /api/exchange-rates             │
│ ☐ update  PUT /api/exchange-rates/:documentId   │
│ ☐ delete  DELETE /api/exchange-rates/:documentId│
└─────────────────────────────────────────────────┘
```

---

## 3. Seed Exchange Rate Data

After configuring permissions, seed the database with initial exchange rate data.

### On VPS (Production)

```bash
ssh izcy-engine
cd /home/AgentZcy/apps/intravalas-be/strapi/intravalas-be
npm run seed:rates
```

Expected output:
```
Starting exchange rates seed...
Successfully seeded 46 exchange rates
```

### Local Development

```bash
cd strapi/intravalas-be
npm run seed:rates
```

---

## 4. Test Exchange Rate Endpoints

### Public Endpoints (after configuring permissions)

```bash
# List all exchange rates
curl https://api-intravalas.izcy.tech/api/exchange-rates

# Get rates for a specific currency
curl "https://api-intravalas.izcy.tech/api/exchange-rates?filters[currencyCode][\$eq]=USD"

# Get rates for a specific date
curl "https://api-intravalas.izcy.tech/api/exchange-rates?filters[effectiveDate][\$eq]=2026-03-04"

# Combine filters
curl "https://api-intravalas.izcy.tech/api/exchange-rates?filters[currencyCode][\$eq]=USD&filters[effectiveDate][\$eq]=2026-03-04"
```

### Expected Response Format

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123...",
      "currencyName": "US Dollar",
      "currencyCode": "USD",
      "countryCode": "US",
      "nominal": "100 good",
      "weBuy": 16.750,
      "weSell": 17.000,
      "effectiveDate": "2026-03-04",
      "notes": null
    },
    {
      "id": 2,
      "documentId": "def456...",
      "currencyName": "US Dollar",
      "currencyCode": "USD",
      "countryCode": "US",
      "nominal": "100 2nd",
      "weBuy": 16.650,
      "weSell": null,
      "effectiveDate": "2026-03-04",
      "notes": null
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 2,
      "total": 46
    }
  }
}
```

---

## 5. Frontend Integration

### Grouping Rates by Currency

The frontend should group flat rate data by currency code:

```javascript
const response = await fetch('https://api-intravalas.izcy.tech/api/exchange-rates');
const { data } = await response.json();

// Group by currency code
const grouped = data.reduce((acc, rate) => {
  const key = rate.currencyCode;
  if (!acc[key]) {
    acc[key] = {
      currencyName: rate.currencyName,
      currencyCode: rate.currencyCode,
      countryCode: rate.countryCode,
      rates: []
    };
  }
  acc[key].rates.push({
    nominal: rate.nominal,
    weBuy: rate.weBuy,
    weSell: rate.weSell
  });
  return acc;
}, {});

// Result:
// {
//   USD: { currencyName: "US Dollar", currencyCode: "USD", countryCode: "US", rates: [...] },
//   EUR: { currencyName: "Euro", currencyCode: "EUR", countryCode: "EU", rates: [...] },
//   ...
// }
```

### Flag Icons

Use `countryCode` with a flag icon library:

**React:**
```jsx
import Flag from 'react-country-flag';

<Flag countryCode={rate.countryCode} svg />
```

**Vue:**
```vue
<flag :iso="rate.countryCode" />
```

**CSS (flag-icons):**
```html
<link rel="stylesheet" href="flag-icons/css/flag-icons.min.css">
<span class="fi fi-{{ countryCode | lowercase }}"></span>
```

---

## 6. Daily Rate Updates

To update rates daily:

### Option A: Replace All Rates

```bash
# SSH into VPS and run
cd /home/AgentZcy/apps/intravalas-be/strapi/intravalas-be

# 1. Update the seed-data.ts file with new rates
# 2. Run the seed script (it will replace rates for the same date)
npm run seed:rates
```

### Option B: Update via API

Use an authenticated API token to update rates programmatically:

```bash
TOKEN="your-api-token"

# Create new rates for a new date
curl -X POST https://api-intravalas.izcy.tech/api/exchange-rates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "currencyName": "US Dollar",
      "currencyCode": "USD",
      "countryCode": "US",
      "nominal": "100 good",
      "weBuy": 16.800,
      "weSell": 17.050,
      "effectiveDate": "2026-03-05"
    }
  }'
```

---

## 7. Country Code Reference

| Currency | Code | Country Code | Flag |
|----------|------|--------------|------|
| US Dollar | USD | US | 🇺🇸 |
| Euro | EUR | EU | 🇪🇺 |
| Canadian Dollar | CAD | CA | 🇨🇦 |
| Pound Sterling | GBP | GB | 🇬🇧 |
| Australian Dollar | AUD | AU | 🇦🇺 |
| Japanese Yen | JPY | JP | 🇯🇵 |
| Swiss Franc | CHF | CH | 🇨🇭 |
| Singapore Dollar | SGD | SG | 🇸🇬 |
| New Zealand Dollar | NZD | NZ | 🇳🇿 |
| Hong Kong Dollar | HKD | HK | 🇭🇰 |
| Chinese Yuan | CNY | CN | 🇨🇳 |
| Saudi Riyal | SAR | SA | 🇸🇦 |
| Malaysian Ringgit | MYR | MY | 🇲🇾 |
| Thai Baht | THB | TH | 🇹🇭 |
| Indian Rupee | INR | IN | 🇮🇳 |
| Philippine Peso | PHP | PH | 🇵🇭 |
| South Korean Won | KRW | KR | 🇰🇷 |
| Vietnamese Dong | VND | VN | 🇻🇳 |
| Brunei Dollar | BND | BN | 🇧🇳 |
| UAE Dirham | AED | AE | 🇦🇪 |

---

## 8. API Endpoints Reference

### Exchange Rate (auto-generated by Strapi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exchange-rates` | List all exchange rates |
| GET | `/api/exchange-rates/:documentId` | Get one exchange rate |
| POST | `/api/exchange-rates` | Create an exchange rate (auth required) |
| PUT | `/api/exchange-rates/:documentId` | Update an exchange rate (auth required) |
| DELETE | `/api/exchange-rates/:documentId` | Delete an exchange rate (auth required) |

### Query Examples

```bash
# Pagination
curl "https://api-intravalas.izcy.tech/api/exchange-rates?pagination[page]=1&pagination[pageSize]=10"

# Sort by currency code
curl "https://api-intravalas.izcy.tech/api/exchange-rates?sort=currencyCode:asc"

# Filter multiple currencies
curl "https://api-intravalas.izcy.tech/api/exchange-rates?filters[currencyCode][\$in]=USD&filters[currencyCode][\$in]=EUR&filters[currencyCode][\$in]=GBP"
```

---

## 9. Troubleshooting

### 403 Forbidden Error

**Problem:** `/api/exchange-rates` returns 403 Forbidden

**Solution:** Configure public permissions in Settings > Users & Permissions > Roles > Public (see Section 2)

### 502 Bad Gateway

**Problem:** API returns 502 after deployment

**Solution:** Wait 30-60 seconds for Strapi to fully start. If persists, check PM2 logs:
```bash
ssh izcy-engine
pm2 logs intravalas-be --lines 50
```

### Empty Data Response

**Problem:** API returns `{"data": [], "meta": {...}}`

**Solution:** Run the seed script to populate data (see Section 3)

---

## 10. Migration from Old Currency Collection

The old `currency` collection is deprecated. Key differences:

| Old (Currency) | New (Exchange Rate) |
|----------------|---------------------|
| Single rate per currency | Multiple rates per nominal |
| buyRate / sellRate | weBuy / weSell |
| No flag support | countryCode for flags |
| changePercentage | Removed |
| middleRate | Removed |

Update your frontend to use `/api/exchange-rates` instead of `/api/currencies`.
