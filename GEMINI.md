# PricePulse AI: Agentic Competitive Intelligence

PricePulse AI is an autonomous, AI-powered competitive intelligence platform designed for e-commerce businesses. It uses intelligent AI agents to monitor competitor pricing, stock levels, and promotional strategies in real-time, moving beyond traditional brittle web scraping.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) (via Shadcn UI), [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Agents:** [TinyFish API](https://agent.tinyfish.ai/) (Mino Agent)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Charts:** [Recharts](https://recharts.org/)
- **Notifications:** [Nodemailer](https://nodemailer.com/), [Sonner](https://sonner.emilkowal.ski/)

## 🏗️ Architecture & Core Logic

### 1. Agentic Scraping (`src/lib/tinyfish.ts`)
The core of the platform is the integration with the **TinyFish Web Agent API**. Unlike static scrapers, these agents use natural language goals to navigate sites, handle dynamic content, and bypass bot detection.
- **Streaming:** Uses Server-Sent Events (SSE) to provide real-time feedback of agent "thoughts" and actions to the UI.
- **Goal-Oriented:** Uses predefined prompt templates (`SCRAPE_GOALS`) for product listings, promo detection, and stock checks.

### 2. Diff Engine (`src/lib/diffEngine.ts`)
A specialized utility that compares the latest scrape results with historical data stored in Supabase.
- **Change Detection:** Automatically identifies `price_drop`, `price_increase`, `restock`, `out_of_stock`, `new_product`, and `promo_detected`.
- **Severity Scoring:** Assigns severity levels (Low, Medium, High) based on the percentage of change.

### 3. Dashboard (`src/app/(dashboard)`)
A centralized interface for:
- Managing monitored competitors and URLs.
- Viewing real-time agent execution streams.
- Analyzing historical price trends and alert logs.

## 🛠️ Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000`. |
| `npm run build` | Compiles the production application. |
| `npm run start` | Runs the compiled production server. |
| `npm run lint` | Runs ESLint to check for code quality and style issues. |

## 📐 Coding Conventions

- **Atomic Components:** UI components are located in `src/components/ui` (Shadcn UI) and composed into feature-specific components in `src/components`.
- **API Routes:** Backend logic is organized in `src/app/api/` using Next.js Route Handlers.
- **Type Safety:** Strict TypeScript usage is expected. Interfaces for data models (Products, Alerts, Competitors) should be kept consistent across the frontend and backend.
- **Styling:** Adhere to Tailwind CSS 4 utility classes. Use `cn()` utility for conditional class merging.
- **Environment Variables:** Ensure `TINYFISH_API_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are configured in `.env.local`.

## 📂 Project Structure

- `src/app`: Next.js App Router (Pages, Layouts, API routes).
- `src/components`: React components (Dashboard, Sidebar, Agent Viewers).
- `src/hooks`: Custom React hooks (e.g., `use-mobile`).
- `src/lib`: Core business logic (Supabase client, TinyFish integration, Diff Engine).
- `public`: Static assets (SVG icons, logos).
