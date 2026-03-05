# Firebase Studio AI Prompt — PricePulse AI
## Copy this entire prompt into Firebase Studio's AI assistant

---

```
Build a full-stack Next.js 14 App Router application called "PricePulse AI" — an autonomous 
e-commerce competitive intelligence platform. This app uses the TinyFish Web Agent API to deploy 
AI agents that scrape competitor websites in real-time, detect price changes, and stream live 
progress back to the UI using Server-Sent Events (SSE).

---

## TECH STACK

- Framework: Next.js 14 with App Router (TypeScript)
- Styling: Tailwind CSS + shadcn/ui components
- Database: MongoDB with Mongoose ODM
- Auth: NextAuth.js (Google OAuth + credentials)
- Charts: Recharts
- Animation: Framer Motion (for agent streaming animation)
- State: Zustand
- Email: Nodemailer (SMTP) for alert notifications
- Deployment: Vercel

---

## ENVIRONMENT VARIABLES

Create a `.env.local` file with these variables:

```
TINYFISH_API_KEY=your_tinyfish_api_key_here
MONGODB_URI=mongodb+srv://zacharyongeri121_db_user:VdznWhbCA90PlVga@cluster0.n7vtwmz.mongodb.net/?appName=Cluster0
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=optional_for_google_oauth
GOOGLE_CLIENT_SECRET=optional_for_google_oauth
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ALERT_EMAIL_FROM=alerts@pricepulse.ai
```

---

## MONGODB SCHEMAS (create in `/lib/models/`)

### 1. Competitor (`/lib/models/Competitor.ts`)
```typescript
{
  _id: ObjectId,
  userId: String,           // owner's user ID from NextAuth
  name: String,             // "Nike", "Adidas"
  baseUrl: String,          // "https://nike.com"
  monitorUrls: [String],    // specific URLs to scrape
  scrapeIntervalHours: Number, // default: 6
  browserProfile: String,   // "stealth" | "default" — default: "stealth"
  proxyEnabled: Boolean,    // default: true
  proxyCountry: String,     // "US" default
  priceDropThresholdPct: Number,   // alert if price drops > X% (default: 2)
  priceIncreaseThresholdPct: Number, // alert if price rises > X% (default: 5)
  isActive: Boolean,
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
  lastScrapedAt: Date,
  lastStatus: String        // "completed" | "failed" | "running" | "pending"
}
```

### 2. PriceSnapshot (`/lib/models/PriceSnapshot.ts`)
```typescript
{
  _id: ObjectId,
  competitorId: ObjectId,   // ref → Competitor
  userId: String,
  scrapedAt: Date,
  url: String,
  products: [{
    name: String,
    sku: String | null,
    price: Number,            // normalized float, e.g. 129.99
    priceRaw: String,         // original string "$129.99"
    inStock: Boolean,
    productUrl: String | null,
    discountPct: Number | null,
    promoLabel: String | null,  // "SALE", "20% OFF", "BLACK FRIDAY"
    imageUrl: String | null
  }],
  agentRunId: String,         // TinyFish run ID for observability
  status: String,             // "completed" | "failed" | "partial"
  errorMessage: String | null,
  durationMs: Number          // how long the scrape took
}
```

### 3. Alert (`/lib/models/Alert.ts`)
```typescript
{
  _id: ObjectId,
  userId: String,
  competitorId: ObjectId,
  competitorName: String,
  alertType: String,          // "price_drop" | "price_increase" | "restock" | "out_of_stock" | "new_product" | "promo_detected"
  productName: String,
  oldValue: Number | null,
  newValue: Number | null,
  changePct: Number | null,
  promoLabel: String | null,
  severity: String,           // "high" | "medium" | "low"
  triggeredAt: Date,
  isRead: Boolean,
  notifiedByEmail: Boolean
}
```

### 4. User (`/lib/models/User.ts`)
```typescript
{
  _id: ObjectId,
  email: String,
  name: String,
  passwordHash: String | null,
  emailAlertsEnabled: Boolean,    // default: true
  alertEmail: String,
  plan: String,                   // "free" | "pro"
  maxCompetitors: Number,         // free: 5, pro: 50
  createdAt: Date
}
```

---

## TINYFISH API INTEGRATION

### Core service at `/lib/tinyfish.ts`

This is the most important file. Build it exactly as follows:

```typescript
const TINYFISH_BASE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse";

// TinyFish SSE event types that come back in the stream
interface TinyFishEvent {
  type: "STEP" | "COMPLETE" | "ERROR" | "PROGRESS";
  status?: "COMPLETED" | "FAILED" | "RUNNING";
  message?: string;        // progress message like "Navigating to page..."
  resultJson?: any;        // final structured data — only on COMPLETE
  error?: string;
}

// Options for the scrape call
interface ScrapeOptions {
  url: string;
  goal: string;
  browserProfile?: "stealth" | "default" | "lite";
  proxyEnabled?: boolean;
  proxyCountry?: string;
  onStep?: (message: string) => void;   // callback for each streaming step
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

// Main function — reads SSE stream and calls callbacks in real-time
export async function runTinyFishScrape(options: ScrapeOptions): Promise<{
  resultJson: any;
  steps: string[];
  durationMs: number;
}> {
  const startTime = Date.now();
  const steps: string[] = [];

  const response = await fetch(TINYFISH_BASE_URL, {
    method: "POST",
    headers: {
      "X-API-Key": process.env.TINYFISH_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: options.url,
      goal: options.goal,
      browser_profile: options.browserProfile ?? "stealth",
      proxy_config: {
        enabled: options.proxyEnabled ?? true,
        country_code: options.proxyCountry ?? "US",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`TinyFish API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let resultJson: any = null;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";  // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event: TinyFishEvent = JSON.parse(line.slice(6));

        if (event.type === "STEP" || event.type === "PROGRESS") {
          const msg = event.message ?? "Working...";
          steps.push(msg);
          options.onStep?.(msg);
        }

        if (event.type === "COMPLETE" && event.status === "COMPLETED") {
          resultJson = event.resultJson;
          options.onComplete?.(event.resultJson);
        }

        if (event.type === "ERROR") {
          options.onError?.(event.error ?? "Unknown error");
          throw new Error(event.error ?? "TinyFish agent error");
        }
      } catch (parseErr) {
        // Skip non-JSON lines (comments, keep-alives)
        continue;
      }
    }
  }

  return {
    resultJson,
    steps,
    durationMs: Date.now() - startTime,
  };
}

// Normalize raw price strings to float
export function normalizePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// Goal prompt templates — one per use case
export const SCRAPE_GOALS = {
  productListing: `Extract all products visible on this page as a JSON array. 
    Return: [{"name": string, "sku": string|null, "price": string, "in_stock": boolean, 
    "url": string|null, "discount_label": string|null, "image_url": string|null}]
    Return ONLY the JSON array, no explanation.`,

  promoDetection: `Check if there is an active sale, discount banner, countdown timer, 
    or promotional campaign on this page. 
    Return: {"has_promo": boolean, "promo_description": string|null, "discount_pct": number|null, 
    "promo_label": string|null, "ends_at": string|null}`,

  stockCheck: `For the product shown on this page, extract availability and pricing.
    Return: {"product_name": string, "in_stock": boolean, "stock_level": string, 
    "price": string, "price_was": string|null}`,

  newProducts: `Find all products tagged as new, "just dropped", "new arrival", or recently launched.
    Return: [{"name": string, "price": string, "tag": string, "url": string|null}]`,
};
```

---

## ALL API ROUTES (create in `/app/api/`)

### 1. POST `/api/competitors` — Add a new competitor
**File:** `/app/api/competitors/route.ts`
- Auth: require session
- Body: `{ name, baseUrl, monitorUrls[], scrapeIntervalHours, browserProfile, proxyCountry, priceDropThresholdPct }`
- Validate: `monitorUrls` must be valid URLs, max 10 per competitor
- Check user's plan: free = max 5 competitors
- Save to MongoDB `competitors` collection
- Response: `{ competitor: {...}, message: "Competitor added" }`

### 2. GET `/api/competitors` — List all competitors for user
**File:** `/app/api/competitors/route.ts`
- Auth: require session
- Query params: `?isActive=true&page=1&limit=20`
- Populate: include `lastScrapedAt`, `lastStatus`, and last snapshot's product count
- Response: `{ competitors: [...], total: number }`

### 3. PATCH `/api/competitors/[id]` — Update competitor config
**File:** `/app/api/competitors/[id]/route.ts`
- Auth: require session + ownership check
- Updatable fields: `name`, `monitorUrls`, `scrapeIntervalHours`, `isActive`, `browserProfile`, `priceDropThresholdPct`, `tags`
- Response: `{ competitor: {...} }`

### 4. DELETE `/api/competitors/[id]` — Remove competitor
**File:** `/app/api/competitors/[id]/route.ts`
- Auth: require session + ownership check
- Also delete all related `priceSnapshots` and `alerts`
- Response: `{ message: "Deleted" }`

### 5. POST `/api/scrape/run` — THIS IS THE MOST IMPORTANT ROUTE
**File:** `/app/api/scrape/run/route.ts`

This route triggers a live scrape AND streams progress back to the frontend using SSE.
The frontend connects to this route and displays a real-time animation of the agent working.

```typescript
// This is a streaming route — it returns SSE to the browser
export async function POST(req: Request) {
  const { competitorId, urls } = await req.json();
  
  // Set up SSE response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper: send SSE event to frontend
  const sendEvent = async (type: string, data: object) => {
    const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  // Start scraping in background — don't await here
  (async () => {
    try {
      await sendEvent("agent_start", { 
        message: "🤖 Agent initialized. Launching browser...",
        competitorId 
      });

      const competitor = await Competitor.findById(competitorId);
      const targetUrls = urls || competitor.monitorUrls;

      // Scrape all URLs in parallel
      const scrapePromises = targetUrls.map(async (url: string) => {
        await sendEvent("agent_navigate", { 
          message: `🌐 Navigating to ${new URL(url).hostname}...`,
          url 
        });

        const result = await runTinyFishScrape({
          url,
          goal: SCRAPE_GOALS.productListing,
          browserProfile: competitor.browserProfile,
          proxyEnabled: competitor.proxyEnabled,
          onStep: async (message) => {
            // Forward every TinyFish step to the browser UI in real time
            await sendEvent("agent_step", { message, url });
          },
        });

        await sendEvent("agent_extracted", {
          message: `✅ Extracted ${result.resultJson?.length ?? 0} products from ${new URL(url).hostname}`,
          url,
          productCount: result.resultJson?.length ?? 0,
        });

        return { url, result };
      });

      const allResults = await Promise.all(scrapePromises);

      // Save snapshots and run diff engine
      await sendEvent("agent_processing", { message: "🔍 Analyzing changes..." });
      
      for (const { url, result } of allResults) {
        const products = (result.resultJson ?? []).map((p: any) => ({
          name: p.name,
          price: normalizePrice(p.price),
          priceRaw: p.price,
          inStock: p.in_stock ?? true,
          productUrl: p.url ?? null,
          promoLabel: p.discount_label ?? null,
          sku: p.sku ?? null,
        }));

        // Save snapshot
        const snapshot = await PriceSnapshot.create({
          competitorId,
          userId: competitor.userId,
          url,
          scrapedAt: new Date(),
          products,
          status: "completed",
          durationMs: result.durationMs,
        });

        // Run diff engine against previous snapshot
        const prevSnapshot = await PriceSnapshot.findOne(
          { competitorId, url, _id: { $ne: snapshot._id } },
          {},
          { sort: { scrapedAt: -1 } }
        );

        if (prevSnapshot) {
          const changes = detectChanges(
            prevSnapshot.products,
            products,
            competitor.priceDropThresholdPct
          );

          for (const change of changes) {
            const alert = await Alert.create({
              userId: competitor.userId,
              competitorId,
              competitorName: competitor.name,
              ...change,
              triggeredAt: new Date(),
              isRead: false,
            });

            await sendEvent("alert_triggered", {
              message: `🚨 Alert: ${change.alertType} on "${change.productName}"`,
              alert,
            });
          }
        }
      }

      // Update competitor's lastScrapedAt
      await Competitor.findByIdAndUpdate(competitorId, {
        lastScrapedAt: new Date(),
        lastStatus: "completed",
      });

      await sendEvent("agent_complete", {
        message: "✅ Scrape complete. Dashboard updated.",
        competitorId,
      });

    } catch (error: any) {
      await sendEvent("agent_error", {
        message: `❌ Error: ${error.message}`,
        error: error.message,
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",  // important for Nginx/Vercel
    },
  });
}
```

### 6. GET `/api/snapshots/[competitorId]` — Price history for charts
**File:** `/app/api/snapshots/[competitorId]/route.ts`
- Auth: require session + ownership
- Query: `?productName=Air+Zoom+Pegasus&days=30`
- Returns price history grouped by product name, formatted for Recharts:
  ```json
  {
    "productName": "Air Zoom Pegasus 41",
    "history": [
      { "date": "2025-01-01", "price": 150.00, "inStock": true },
      { "date": "2025-01-07", "price": 127.00, "inStock": true }
    ]
  }
  ```

### 7. GET `/api/snapshots/[competitorId]/latest` — Latest products table
**File:** `/app/api/snapshots/[competitorId]/latest/route.ts`
- Returns the most recent snapshot's products as a flat table
- Include `priceChange` computed field (diff vs previous snapshot)

### 8. GET `/api/alerts` — All alerts for user
**File:** `/app/api/alerts/route.ts`
- Query: `?page=1&limit=20&type=price_drop&isRead=false&competitorId=xxx`
- Sorted by `triggeredAt` descending
- Response: `{ alerts: [...], total, unreadCount }`

### 9. PATCH `/api/alerts/[id]/read` — Mark alert as read
**File:** `/app/api/alerts/[id]/read/route.ts`
- Sets `isRead: true` on the alert
- Response: `{ success: true }`

### 10. PATCH `/api/alerts/read-all` — Mark all alerts as read
**File:** `/app/api/alerts/read-all/route.ts`
- Bulk update all unread alerts for the user

### 11. GET `/api/dashboard/summary` — Stats for the dashboard home
**File:** `/app/api/dashboard/summary/route.ts`
Returns:
```json
{
  "totalCompetitors": 12,
  "activeCompetitors": 10,
  "totalProducts": 847,
  "alertsToday": 5,
  "alertsUnread": 13,
  "biggestPriceDrop": {
    "productName": "Nike Air Zoom",
    "competitor": "Nike",
    "changePct": -18.5,
    "triggeredAt": "2025-01-15T10:30:00Z"
  },
  "scrapeSuccessRate": 94.2,
  "lastScrapeAt": "2025-01-15T12:00:00Z"
}
```

### 12. POST `/api/scrape/schedule` — Update scrape schedule
**File:** `/app/api/scrape/schedule/route.ts`
- Body: `{ competitorId, intervalHours }`
- Updates the competitor's `scrapeIntervalHours`
- Response: `{ message: "Schedule updated", nextRunAt: Date }`

### 13. POST `/api/auth/[...nextauth]` — NextAuth
**File:** `/app/api/auth/[...nextauth]/route.ts`
- Credentials provider (email + password)
- bcrypt password hashing
- JWT session strategy

---

## DIFF ENGINE (create at `/lib/diffEngine.ts`)

```typescript
interface Product {
  name: string;
  price: number;
  inStock: boolean;
  promoLabel: string | null;
}

export function detectChanges(
  prevProducts: Product[],
  newProducts: Product[],
  priceDropThresholdPct: number = 2
): AlertPayload[] {
  const changes: AlertPayload[] = [];
  const prevMap = new Map(prevProducts.map(p => [
    p.name.toLowerCase().trim(), p
  ]));
  const newNames = new Set(newProducts.map(p => p.name.toLowerCase().trim()));

  for (const newProd of newProducts) {
    const key = newProd.name.toLowerCase().trim();
    const prev = prevMap.get(key);

    if (!prev) {
      // New product appeared
      changes.push({
        alertType: "new_product",
        productName: newProd.name,
        oldValue: null,
        newValue: newProd.price,
        changePct: null,
        severity: "medium",
      });
      continue;
    }

    // Price change
    if (prev.price > 0 && newProd.price > 0) {
      const changePct = ((newProd.price - prev.price) / prev.price) * 100;

      if (changePct <= -priceDropThresholdPct) {
        changes.push({
          alertType: "price_drop",
          productName: newProd.name,
          oldValue: prev.price,
          newValue: newProd.price,
          changePct: parseFloat(changePct.toFixed(1)),
          severity: changePct <= -15 ? "high" : changePct <= -5 ? "medium" : "low",
        });
      } else if (changePct >= 5) {
        changes.push({
          alertType: "price_increase",
          productName: newProd.name,
          oldValue: prev.price,
          newValue: newProd.price,
          changePct: parseFloat(changePct.toFixed(1)),
          severity: "low",
        });
      }
    }

    // Stock changes
    if (prev.inStock && !newProd.inStock) {
      changes.push({
        alertType: "out_of_stock",
        productName: newProd.name,
        oldValue: null, newValue: null, changePct: null,
        severity: "medium",
      });
    }
    if (!prev.inStock && newProd.inStock) {
      changes.push({
        alertType: "restock",
        productName: newProd.name,
        oldValue: null, newValue: null, changePct: null,
        severity: "medium",
      });
    }

    // New promo
    if (!prev.promoLabel && newProd.promoLabel) {
      changes.push({
        alertType: "promo_detected",
        productName: newProd.name,
        promoLabel: newProd.promoLabel,
        oldValue: null, newValue: null, changePct: null,
        severity: "high",
      });
    }
  }

  // Check for products that disappeared
  for (const [key, prev] of prevMap) {
    if (!newNames.has(key)) {
      changes.push({
        alertType: "out_of_stock",  // treat removal as out of stock
        productName: prev.name,
        oldValue: null, newValue: null, changePct: null,
        severity: "low",
      });
    }
  }

  return changes;
}
```

---

## SCHEDULER (create at `/lib/scheduler.ts` + Vercel Cron)

### Vercel Cron config in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### Cron route at `/app/api/cron/scrape/route.ts`:
```typescript
// Runs every 2 hours — finds competitors due for scraping
export async function GET(req: Request) {
  // Verify it's actually a Vercel cron call (not public)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  
  // Find all active competitors whose next scrape time has passed
  const dueCompetitors = await Competitor.find({
    isActive: true,
    $or: [
      { lastScrapedAt: { $lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } },
      { lastScrapedAt: null }
    ]
  });

  // Fire scrapes — but cap concurrency to avoid rate limits
  // Max 3 competitors in parallel at once
  const chunks = chunk(dueCompetitors, 3);
  for (const batch of chunks) {
    await Promise.all(batch.map(c => scrapeCompetitorBackground(c)));
  }

  return Response.json({ 
    scraped: dueCompetitors.length,
    timestamp: now.toISOString()
  });
}
```

---

## FRONTEND PAGES & COMPONENTS

### App Router structure:
```
/app
  /dashboard
    page.tsx           ← Dashboard home with summary cards
  /competitors
    page.tsx           ← Competitor list
    /[id]
      page.tsx         ← Single competitor detail + price history charts
  /alerts
    page.tsx           ← Alerts inbox
  /settings
    page.tsx           ← User settings, alert preferences
  /auth
    /login/page.tsx
    /register/page.tsx
```

---

### COMPONENT: AgentStreamViewer (`/components/AgentStreamViewer.tsx`)
THIS IS THE CENTERPIECE COMPONENT. It displays a live terminal-like animation 
while the TinyFish agent is working. Build it exactly like this:

```typescript
// Uses EventSource to consume the SSE stream from /api/scrape/run
// Shows each step as it arrives with a typing animation
// Displays:
//   - A pulsing robot/agent icon
//   - A terminal window showing each step message as it arrives
//   - Each line slides in from the bottom with a fade-in
//   - A progress bar that fills as steps arrive
//   - Color coded: blue for navigation steps, green for extractions, red for errors
//   - When complete: plays a success animation and shows product count

// State:
// - steps: string[]           (each SSE message)
// - status: "idle" | "running" | "complete" | "error"
// - productsFound: number
// - alertsTriggered: Alert[]

// The component connects to the SSE stream via EventSource or fetch:
const startStream = async (competitorId: string) => {
  setStatus("running");
  setSteps([]);

  const response = await fetch("/api/scrape/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitorId }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
    
    for (const line of lines) {
      const event = JSON.parse(line.slice(6));
      
      if (event.type === "agent_step" || event.type === "agent_navigate" 
          || event.type === "agent_start" || event.type === "agent_extracted"
          || event.type === "agent_processing") {
        setSteps(prev => [...prev, event.message]);
      }

      if (event.type === "alert_triggered") {
        setAlertsTriggered(prev => [...prev, event.alert]);
      }

      if (event.type === "agent_complete") {
        setStatus("complete");
      }

      if (event.type === "agent_error") {
        setStatus("error");
        setSteps(prev => [...prev, event.message]);
      }
    }
  }
};

// Visual design of the terminal window:
// - Dark background (#0d1117), monospace font
// - Each step: small icon prefix (🌐 🔍 ✅ 🚨 ❌) + message text
// - New lines animate in with translateY(10px) → translateY(0) + opacity 0→1
// - Blinking cursor at the end of the last line while status === "running"
// - When status === "complete": entire terminal gets a green border glow
// - When alerts are triggered: a red badge slides in from the right
```

---

### COMPONENT: PriceHistoryChart (`/components/PriceHistoryChart.tsx`)
- Uses Recharts `LineChart`
- One line per competitor for the same product
- X axis: date, Y axis: price in USD
- Tooltip shows: date, price, stock status, any promo label
- Supports dark/light mode
- Show a dotted line when product was out of stock

### COMPONENT: CompetitorCard (`/components/CompetitorCard.tsx`)
Shows per competitor:
- Name + favicon
- Last scraped: "3 hours ago"
- Status badge: green "Live" / yellow "Scheduled" / red "Failed"
- Product count from latest snapshot
- Biggest price change in last 24h (with up/down arrow)
- "Scrape Now" button → opens AgentStreamViewer modal

### COMPONENT: AlertBadge & AlertItem
- `AlertBadge`: shows count of unread alerts in nav, red if > 0
- `AlertItem`: card showing alert type (color coded), product name, 
  old/new price with percentage badge, competitor name, time ago

### PAGE: Dashboard (`/app/dashboard/page.tsx`)
Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Summary Cards Row:                                      │
│  [Competitors: 12]  [Alerts Today: 5]  [Products: 847]  │
│  [Biggest Drop: -18.5%]  [Success Rate: 94%]            │
├─────────────────────────────────────────────────────────┤
│  Recent Alerts Feed (left 60%)  │  Quick Actions (40%)  │
│  - Last 10 alerts in real-time  │  - Add Competitor     │
│  - Each with type icon + info   │  - Scrape All Now     │
│                                 │  - Export CSV         │
├─────────────────────────────────────────────────────────┤
│  Competitors Grid — cards for each tracked competitor   │
└─────────────────────────────────────────────────────────┘
```

### PAGE: Competitor Detail (`/app/competitors/[id]/page.tsx`)
Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Competitor Header: name, URL, last scraped, status     │
│  [Scrape Now Button] → opens AgentStreamViewer          │
├─────────────────────────────────────────────────────────┤
│  Tabs: [Products Table] [Price History] [Alerts] [Config]│
├─────────────────────────────────────────────────────────┤
│  Products Table:                                        │
│  Name | Price | Change vs Last | Stock | Promo | URL   │
│  (sortable, searchable, highlight price changes)        │
├─────────────────────────────────────────────────────────┤
│  Price History Chart (Recharts LineChart)               │
│  - Select product from dropdown                         │
│  - 7d / 30d / 90d time range selector                   │
└─────────────────────────────────────────────────────────┘
```

---

## DESIGN SYSTEM

Use these Tailwind classes and colors consistently:

- **Primary**: `blue-600` / `#2563eb`
- **Background**: `gray-950` for dark, `gray-50` for light
- **Surface cards**: `gray-900` dark / `white` light with `border border-gray-200`
- **Success/up**: `emerald-500`
- **Danger/down**: `red-500`  
- **Warning/promo**: `amber-500`
- **Font**: Inter (Google Fonts)
- **Border radius**: `rounded-xl` for cards, `rounded-lg` for buttons
- **Shadow**: `shadow-sm` on cards, `shadow-xl` on modals

Alert type color coding:
- `price_drop` → red background `bg-red-50 border-red-200`
- `price_increase` → orange `bg-orange-50`
- `restock` → green `bg-emerald-50`
- `out_of_stock` → yellow `bg-yellow-50`
- `new_product` → blue `bg-blue-50`
- `promo_detected` → purple `bg-purple-50`

---

## IMPORTANT IMPLEMENTATION NOTES

1. **SSE + Vercel**: Set `X-Accel-Buffering: no` header on all SSE responses. 
   This prevents Vercel's edge from buffering the stream. Without this, 
   streaming won't work in production.

2. **TinyFish parallel scraping**: When a competitor has multiple `monitorUrls`,
   call TinyFish for each URL simultaneously with `Promise.all()`. Do NOT 
   chain them sequentially — parallel is 3-5x faster.

3. **Price normalization**: Always run prices through `normalizePrice()` before 
   storing. Input can be "$1,299.00", "1299", "£129", "€99,99" — strip 
   everything except digits and decimal point, then `parseFloat()`.

4. **Product name matching in diff engine**: Use case-insensitive, trimmed 
   comparison. Consider using `fuse.js` for fuzzy matching if exact match 
   misses products (names sometimes have minor variations between scrapes).

5. **Error handling on TinyFish**: If TinyFish returns a 402 (out of credits),
   catch it specifically and send a clear SSE event `{ type: "credits_exhausted" }`
   so the UI can show a helpful message instead of a generic error.

6. **MongoDB indexes**: Add these indexes for performance:
   ```
   PriceSnapshot: { competitorId: 1, scrapedAt: -1 }
   Alert: { userId: 1, triggeredAt: -1 }
   Alert: { userId: 1, isRead: 1 }
   Competitor: { userId: 1, isActive: 1 }
   ```

7. **Rate limiting**: Add a concurrency guard in the scrape cron — never run 
   more than 5 TinyFish requests at the same time globally. Use a simple 
   in-memory counter or Redis if available.

8. **The AgentStreamViewer auto-scrolls**: When new lines are added to the 
   terminal, always scroll to the bottom automatically. Use a `useEffect` 
   that watches `steps.length` and calls `scrollIntoView()` on a ref 
   attached to the last line.

---

## FILE STRUCTURE TO CREATE

```
/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── competitors/route.ts
│   │   ├── competitors/[id]/route.ts
│   │   ├── scrape/run/route.ts          ← SSE streaming route
│   │   ├── scrape/schedule/route.ts
│   │   ├── snapshots/[competitorId]/route.ts
│   │   ├── snapshots/[competitorId]/latest/route.ts
│   │   ├── alerts/route.ts
│   │   ├── alerts/[id]/read/route.ts
│   │   ├── alerts/read-all/route.ts
│   │   ├── dashboard/summary/route.ts
│   │   └── cron/scrape/route.ts
│   ├── dashboard/page.tsx
│   ├── competitors/page.tsx
│   ├── competitors/[id]/page.tsx
│   ├── alerts/page.tsx
│   ├── settings/page.tsx
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   └── layout.tsx
├── components/
│   ├── AgentStreamViewer.tsx            ← Live SSE animation terminal
│   ├── PriceHistoryChart.tsx
│   ├── CompetitorCard.tsx
│   ├── AlertItem.tsx
│   ├── AlertBadge.tsx
│   ├── SummaryCard.tsx
│   └── ui/                             ← shadcn components
├── lib/
│   ├── tinyfish.ts                     ← TinyFish API wrapper + goal prompts
│   ├── diffEngine.ts                   ← Change detection logic
│   ├── scheduler.ts                    ← Background scrape runner
│   ├── mongodb.ts                      ← MongoDB connection
│   ├── auth.ts                         ← NextAuth config
│   └── models/
│       ├── Competitor.ts
│       ├── PriceSnapshot.ts
│       ├── Alert.ts
│       └── User.ts
├── hooks/
│   ├── useAlerts.ts                    ← SWR hook for alerts
│   ├── useCompetitors.ts
│   └── useDashboardSummary.ts
├── .env.local
├── vercel.json                         ← Cron config
└── package.json
```

---

## PACKAGES TO INSTALL

```bash
npm install mongoose next-auth bcryptjs nodemailer recharts framer-motion zustand swr
npm install -D @types/bcryptjs @types/nodemailer
```

---

## START WITH THIS ORDER

1. Set up MongoDB connection (`/lib/mongodb.ts`) and all 4 models
2. Build `/lib/tinyfish.ts` with `runTinyFishScrape()` and goal prompts
3. Build `/lib/diffEngine.ts`
4. Build the SSE streaming route `/api/scrape/run`
5. Build the `AgentStreamViewer` component (the live animation terminal)
6. Build remaining API routes
7. Build dashboard and competitor detail pages
8. Add auth, scheduler, and email alerts last

Test after step 4 by calling the scrape route with curl and verifying you see 
SSE events streaming back. Then connect the AgentStreamViewer component in step 5.
```

---

*Copy everything between the triple backticks above into Firebase Studio AI.*
*This is a complete, build-ready specification with every API, schema, and component defined.*
