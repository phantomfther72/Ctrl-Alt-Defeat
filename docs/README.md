# New Era Insights Platform — Technical Documentation

> **Version:** 1.0  
> **Last Updated:** March 14, 2026  
> **Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase (Lovable Cloud) · Recharts

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [Edge Functions (Backend)](#6-edge-functions-backend)
7. [Pages & Routes](#7-pages--routes)
8. [Authentication](#8-authentication)
9. [Design System](#9-design-system)
10. [AI Integration](#10-ai-integration)
11. [Data Flow](#11-data-flow)
12. [Feature Catalog](#12-feature-catalog)
13. [Future Features (Roadmap)](#13-future-features-roadmap)
14. [Deprecation & Removal Log](#14-deprecation--removal-log)
15. [Environment Variables](#15-environment-variables)
16. [Development Guidelines](#16-development-guidelines)

---

## 1. Project Overview

**New Era Insights Platform** is a newspaper distribution analytics dashboard built to help decision-makers:

- Track daily sales, returns, and revenue across distribution points
- Identify demand trends and seasonal patterns
- Generate AI-powered supply recommendations to reduce waste
- Forecast future demand using historical data
- Monitor AI model performance

The platform serves a newspaper distribution company operating across multiple retail outlets (service stations, supermarkets, convenience stores).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  React + TypeScript + Vite + Tailwind + Recharts │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Dashboard │  │ Supply AI│  │ Insights │  ...  │
│  └──────────┘  └──────────┘  └──────────┘       │
│         │              │            │            │
│         └──────────────┼────────────┘            │
│                        │                         │
│              Supabase JS Client                  │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              Lovable Cloud (Supabase)            │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │  PostgreSQL   │  │   Edge Functions       │   │
│  │  (12 tables)  │  │  - analyze-trends      │   │
│  │  + RLS        │  │  - generate-forecast   │   │
│  │               │  │  - generate-insights   │   │
│  │               │  │  - parse-dataset       │   │
│  │               │  │  - process-dataset     │   │
│  └──────────────┘  └────────────────────────┘   │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │   Storage     │  │  Lovable AI Gateway    │   │
│  │  (uploads)    │  │  (Gemini/GPT models)   │   │
│  └──────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer       | Technology                          | Purpose                        |
|-------------|-------------------------------------|--------------------------------|
| Frontend    | React 18 + TypeScript               | UI framework                   |
| Build       | Vite                                | Dev server & bundler           |
| Styling     | Tailwind CSS + shadcn/ui            | Design system & components     |
| Charts      | Recharts                            | Data visualizations            |
| State       | TanStack React Query                | Server state management        |
| Routing     | React Router v6                     | Client-side routing            |
| Backend     | Supabase (Lovable Cloud)            | Database, Auth, Edge Functions |
| AI          | Lovable AI Gateway                  | AI-powered insights & analysis |
| Icons       | Lucide React                        | Icon library                   |
| Animations  | CSS keyframes + Tailwind utilities  | UI transitions                 |

---

## 4. Folder Structure

```
├── docs/                          # Documentation
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── robots.txt
│   └── sample-dataset.csv         # Sample data for testing
├── src/
│   ├── App.tsx                    # Root component, route definitions
│   ├── App.css
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles, CSS variables, design tokens
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── AppLayout.tsx          # Page layout wrapper
│   │   ├── AppSidebar.tsx         # Navigation sidebar
│   │   ├── InsightCard.tsx        # Insight display card
│   │   ├── KpiCard.tsx            # KPI metric card
│   │   ├── NavLink.tsx            # Navigation link component
│   │   ├── ProtectedRoute.tsx     # Auth guard wrapper
│   │   ├── RecommendationCard.tsx # AI recommendation display
│   │   ├── TopBar.tsx             # Top navigation bar
│   │   └── ui/                    # shadcn/ui component library (30+ components)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication state management
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile breakpoint detection
│   │   └── use-toast.ts           # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client (auto-generated, DO NOT EDIT)
│   │       └── types.ts           # Database types (auto-generated, DO NOT EDIT)
│   ├── lib/
│   │   └── utils.ts               # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx              # Main dashboard (Distribution Dashboard + AI Trend Analysis)
│   │   ├── Admin.tsx              # Admin panel
│   │   ├── AiMonitor.tsx          # AI model monitoring
│   │   ├── DataIngestion.tsx      # File upload & data processing
│   │   ├── Forecasting.tsx        # Revenue/demand forecasting
│   │   ├── Insights.tsx           # AI-generated insights
│   │   ├── SupplyAI.tsx           # AI Supply Intelligence dashboard
│   │   ├── Login.tsx              # Login page
│   │   ├── Signup.tsx             # Registration page
│   │   ├── ForgotPassword.tsx     # Password recovery
│   │   ├── ResetPassword.tsx      # Password reset
│   │   └── NotFound.tsx           # 404 page
│   ├── hooks/
│   │   ├── useDistributionData.ts # Shared hook for monthly + location data
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── test/
│       ├── example.test.ts
│       └── setup.ts
├── supabase/
│   ├── config.toml                # Supabase configuration (DO NOT EDIT)
│   └── functions/
│       ├── analyze-trends/        # AI trend analysis
│       ├── generate-forecast/     # Demand forecasting
│       ├── generate-insights/     # AI insight generation
│       ├── parse-dataset/         # CSV/file parsing
│       └── process-dataset/       # Data cleaning & processing
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 5. Database Schema

### Tables

| Table                | Purpose                                      | Key Columns                                              |
|----------------------|----------------------------------------------|----------------------------------------------------------|
| `clean_data`         | Cleaned distribution records per outlet      | shop_id, shop_name, month, quantity_sold, quantity_returned, revenue, category |
| `distribution_events`| Holidays, campaigns, events affecting demand | event_name, event_type, start_date, end_date, description|
| `file_uploads`       | Uploaded file tracking                       | file_name, status, user_id, file_size, row_count         |
| `forecast_data`      | Forecast predictions with scenarios          | month, scenario, forecast, actual, lower_bound, upper_bound, growth_rate |
| `insights`           | AI-generated business insights               | title, description, type, category, metric, is_active    |
| `model_metrics`      | AI model performance metrics                 | metric_name, metric_value, model_version, evaluated_at   |
| `monthly_summary`    | Aggregated monthly sales/returns             | month, total_sales, total_returns, revenue, sell_through_pct, return_rate_pct |
| `parsed_data`        | Raw parsed data from uploads                 | file_upload_id, row_index, data (JSONB)                  |
| `predictions`        | Per-outlet sales predictions                 | shop_id, shop_name, month, predicted_sales, actual_sales |
| `trend_analysis`     | Computed trend metrics                       | analysis_type, metric_name, metric_value, location, trend_direction, insight |

> **Note:** `analytics_data` and `traffic_sources` tables exist in the schema but are no longer used by any page. They were part of the removed Dashboard.tsx (web analytics). They can be dropped in a future migration.

### Row-Level Security (RLS)

All tables have RLS enabled. General policy pattern:
- **SELECT**: Authenticated users can read
- **INSERT**: Authenticated users can insert
- **UPDATE/DELETE**: Varies by table (some restricted)

### Key Relationships

```
file_uploads (1) ──→ (N) parsed_data   [via file_upload_id]
```

Most tables are independent (no foreign keys to each other) to allow flexible data ingestion.

---

## 6. Edge Functions (Backend)

All edge functions run on Deno and are deployed automatically.

| Function             | Purpose                                        | Trigger       | AI Model Used          |
|----------------------|------------------------------------------------|---------------|------------------------|
| `analyze-trends`     | Analyze clean_data + events for trend insights | On-demand     | Gemini 2.5 Flash       |
| `generate-forecast`  | Generate demand/revenue forecasts              | On-demand     | Gemini 3 Flash Preview |
| `generate-insights`  | Produce business insights from data            | On-demand     | Gemini 3 Flash Preview |
| `parse-dataset`      | Parse uploaded CSV/Excel files                 | After upload  | None                   |
| `process-dataset`    | Clean and transform parsed data                | After parsing | None                   |

### Calling Edge Functions

```typescript
// From frontend — use supabase.functions.invoke()
const { data, error } = await supabase.functions.invoke('analyze-trends', {
  body: { /* payload */ }
});

// Or via direct URL (for streaming)
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-trends`;
```

---

## 7. Pages & Routes

| Route              | Page Component    | Auth Required | Description                              |
|--------------------|-------------------|---------------|------------------------------------------|
| `/`                | `Index.tsx`       | No            | Landing / Distribution Dashboard         |
| `/login`           | `Login.tsx`       | No            | User login                               |
| `/signup`          | `Signup.tsx`      | No            | User registration                        |
| `/forgot-password` | `ForgotPassword`  | No            | Password recovery                        |
| `/reset-password`  | `ResetPassword`   | No            | Password reset (from email link)         |
| `/dashboard`       | `Dashboard.tsx`   | Yes           | Secondary dashboard                      |
| `/data-ingestion`  | `DataIngestion`   | Yes           | Upload & process data files              |
| `/insights`        | `Insights.tsx`    | Yes           | AI-generated business insights           |
| `/forecasting`     | `Forecasting.tsx` | Yes           | Demand & revenue forecasting             |
| `/demand-trends`   | `DemandTrends`    | Yes           | Trend analysis with AI                   |
| `/distribution`    | `Distribution`    | Yes           | Distribution event management            |
| `/ai-monitor`      | `AiMonitor.tsx`   | Yes           | AI model performance monitoring          |
| `/supply-ai`       | `SupplyAI.tsx`    | Yes           | AI Supply Intelligence advisor           |
| `/admin`           | `Admin.tsx`       | Yes           | Administration panel                     |
| `*`                | `NotFound.tsx`    | No            | 404 page                                |

### Sidebar Navigation

Defined in `AppSidebar.tsx` with two groups:
- **Analytics**: Dashboard, Data Ingestion, Insights, Forecasting, Demand Trends, Distribution, AI Monitor, Supply AI
- **System**: Admin

---

## 8. Authentication

Authentication is managed via Supabase Auth through `AuthContext.tsx`.

- **Provider**: Email/password
- **Session**: Persisted in localStorage with auto-refresh
- **Route protection**: `ProtectedRoute` component wraps authenticated pages
- **Email verification**: Required before sign-in (auto-confirm is disabled)

### Auth Flow

```
User → /login → AuthContext.signIn() → Supabase Auth → Session stored
                                                       → Redirect to /dashboard

User → /signup → AuthContext.signUp() → Supabase Auth → Verification email sent
                                                       → User verifies → Can sign in
```

---

## 9. Design System

### Fonts
- **Headings**: Space Grotesk (variable weight 300–700)
- **Body**: DM Sans (variable weight 100–1000)

### Color Tokens (HSL in `index.css`)

| Token              | Light Mode           | Dark Mode            | Usage                    |
|--------------------|----------------------|----------------------|--------------------------|
| `--primary`        | 243 75% 59%          | 243 75% 65%          | Primary actions, links   |
| `--accent`         | 167 72% 60%          | 167 72% 50%          | Accent highlights        |
| `--background`     | 220 20% 97%          | 220 30% 6%           | Page background          |
| `--card`           | 0 0% 100%            | 220 28% 10%          | Card backgrounds         |
| `--destructive`    | 0 84% 60%            | 0 62% 30%            | Error states             |
| `--kpi-up`         | 152 60% 42%          | —                    | Positive KPI changes     |
| `--kpi-down`       | 0 72% 55%            | —                    | Negative KPI changes     |
| `--chart-1..5`     | Various              | —                    | Chart color palette      |

### Custom Utilities

```css
.gradient-primary   /* Purple gradient background */
.gradient-accent    /* Teal gradient background */
.shadow-card        /* Subtle card shadow */
.shadow-elevated    /* Elevated element shadow */
```

### Component Library

Built on **shadcn/ui** with 30+ components in `src/components/ui/`. Key custom components:

- `KpiCard` — Metric display with trend indicator
- `InsightCard` — AI insight with category badge
- `RecommendationCard` — Prioritized recommendation with impact

---

## 10. AI Integration

### Lovable AI Gateway

- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Auth**: `LOVABLE_API_KEY` (auto-provisioned, never exposed to client)
- **Default Model**: `google/gemini-3-flash-preview`

### AI Features in the App

| Feature                | Edge Function        | Model                  | Output                      |
|------------------------|----------------------|------------------------|-----------------------------|
| Trend analysis         | `analyze-trends`     | Gemini 2.5 Flash       | Trend insights → `trend_analysis` table |
| Business insights      | `generate-insights`  | Gemini 3 Flash Preview | Insights → `insights` table |
| Demand forecasting     | `generate-forecast`  | Gemini 3 Flash Preview | Forecasts → `forecast_data` table |
| Supply recommendations | Client-side logic    | N/A (rule-based)       | Displayed in Supply AI page |

### Supply AI Recommendation Logic (Rule-Based)

```
IF trend=growing AND sell_through ≥ 85%:
  → Increase supply by 15%, confidence 92%

IF trend=declining OR return_rate > 35%:
  → Reduce supply by 25%, confidence 88%

IF sell_through ≥ 75% (stable):
  → Slight increase by 8%, confidence 74%

OTHERWISE:
  → Maintain current levels, confidence 81%
```

---

## 11. Data Flow

### Upload → Dashboard Pipeline

```
1. User uploads CSV/Excel file
   └─→ File stored in Supabase Storage ("uploads" bucket)
   └─→ Record created in `file_uploads` table

2. parse-dataset edge function triggered
   └─→ Parses file rows into `parsed_data` table

3. process-dataset edge function triggered
   └─→ Cleans data → inserts into `clean_data` table
   └─→ Aggregates → inserts into `monthly_summary` table

4. Dashboard & Supply AI pages fetch from:
   └─→ `monthly_summary` (charts, KPIs)
   └─→ `clean_data` (per-outlet analysis)
   └─→ `distribution_events` (seasonal context)

5. AI analysis (on-demand):
   └─→ analyze-trends reads clean_data + events
   └─→ Sends to Lovable AI Gateway
   └─→ Results stored in `trend_analysis` table
```

### Auto-Refresh

The Supply AI page auto-refreshes data every 60 seconds via `setInterval`.

---

## 12. Feature Catalog

### ✅ Implemented Features

| Feature                          | Page/Component       | Status    |
|----------------------------------|----------------------|-----------|
| Distribution Dashboard           | `Index.tsx`          | Complete  |
| KPI cards (Sales, Returns, Revenue, Sell-Through) | `KpiCard.tsx` | Complete |
| Sales vs Returns chart           | `Index.tsx`          | Complete  |
| Top Locations bar chart          | `Index.tsx`          | Complete  |
| Efficiency trend charts          | `Index.tsx`          | Complete  |
| Over-distribution alerts         | `Index.tsx`          | Complete  |
| CSV/Excel data upload            | `DataIngestion.tsx`  | Complete  |
| AI-powered business insights     | `Insights.tsx`       | Complete  |
| Demand forecasting               | `Forecasting.tsx`    | Complete  |
| Demand trend analysis (AI)       | `DemandTrends.tsx`   | Complete  |
| Distribution event management    | `Distribution.tsx`   | Complete  |
| AI model monitoring              | `AiMonitor.tsx`      | Complete  |
| Supply AI advisor dashboard      | `SupplyAI.tsx`       | Complete  |
| Network demand trend chart       | `SupplyAI.tsx`       | Complete  |
| Outlet recommendation cards      | `SupplyAI.tsx`       | Complete  |
| Demand signal summary cards      | `SupplyAI.tsx`       | Complete  |
| Email/password authentication    | `Login/Signup.tsx`   | Complete  |
| Password recovery flow           | `ForgotPassword.tsx` | Complete  |
| Protected routes                 | `ProtectedRoute.tsx` | Complete  |
| Dark/light mode support          | `index.css`          | Complete  |
| Mobile responsive sidebar        | `AppSidebar.tsx`     | Complete  |

---

## 13. Future Features (Roadmap)

### 🔜 High Priority

| Feature                                      | Description                                                        | Affected Files/Tables                  |
|----------------------------------------------|--------------------------------------------------------------------|----------------------------------------|
| **Predictive Demand Forecasting**            | ML-based prediction of future demand per outlet using time-series  | New edge function, `predictions` table |
| **Distribution Event Management UI**         | Full CRUD for holidays, campaigns, breaking news events            | `Distribution.tsx`, `distribution_events` |
| **Event Markers on Charts**                  | Overlay event annotations on demand trend charts                   | `SupplyAI.tsx`, `DemandTrends.tsx`     |
| **Bulk Recommendation Actions**              | Accept/dismiss AI supply recommendations in bulk                   | `SupplyAI.tsx`, new table              |
| **Date Range Filters**                       | Filter all dashboards by custom date ranges                        | All dashboard pages                    |

### 📋 Medium Priority

| Feature                                      | Description                                                        | Affected Files/Tables                  |
|----------------------------------------------|--------------------------------------------------------------------|----------------------------------------|
| **Export to PDF/CSV**                         | Download reports, charts, and recommendations                      | All dashboard pages                    |
| **Real-time Data Updates**                    | Supabase Realtime subscriptions for live dashboard updates         | Enable realtime on key tables          |
| **User Roles & Permissions**                 | Admin, Manager, Viewer roles with granular access                  | New `user_roles` table + RLS policies  |
| **Email Notifications**                      | Alerts for high return rates or demand spikes                      | New edge function + email integration  |
| **Multi-tenant Support**                     | Separate data per organization/region                              | Add org_id to tables + RLS            |

### 🔮 Future Considerations

| Feature                                      | Description                                                        |
|----------------------------------------------|--------------------------------------------------------------------|
| **Mobile App (PWA)**                         | Progressive Web App for field distribution managers                |
| **Delivery Route Optimization**              | Suggest optimal delivery routes based on demand                    |
| **Weather Integration**                      | Correlate weather data with demand patterns                        |
| **Competitor Analysis**                      | Track competitor pricing/coverage impact                           |
| **Natural Language Query**                   | "What was the best performing outlet last month?" via AI chat      |
| **Automated Supply Orders**                  | Auto-generate distribution orders from AI recommendations         |

---

## 14. Deprecation & Removal Log

Track features that have been deprecated or removed.

| Date       | Feature/Component    | Action       | Reason                                    | Migration Notes                     |
|------------|----------------------|--------------|-------------------------------------------|-------------------------------------|
| —          | —                    | —            | No deprecations yet                       | —                                   |

### Deprecation Process

1. **Announce**: Mark feature as deprecated in this log with a target removal date
2. **Warn**: Add console warnings or UI notices for deprecated features
3. **Migrate**: Provide migration path or replacement feature
4. **Remove**: Delete code and update this log with removal date

### Guidelines for Removal

- Remove unused components from `src/components/` and their imports
- Remove unused pages from `src/pages/` and their route in `App.tsx`
- Remove sidebar nav entry in `AppSidebar.tsx`
- Drop unused database tables via migration (backup data first)
- Remove unused edge functions from `supabase/functions/`
- Update this documentation

---

## 15. Environment Variables

### Auto-Configured (DO NOT EDIT)

| Variable                          | Source          | Usage                    |
|-----------------------------------|-----------------|--------------------------|
| `VITE_SUPABASE_URL`              | Lovable Cloud   | Supabase API endpoint    |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | Lovable Cloud   | Supabase anon key        |
| `VITE_SUPABASE_PROJECT_ID`       | Lovable Cloud   | Project identifier       |

### Backend Secrets (Edge Functions)

| Secret                    | Purpose                              |
|---------------------------|--------------------------------------|
| `SUPABASE_URL`            | Backend Supabase URL                 |
| `SUPABASE_ANON_KEY`       | Backend anon key                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for admin operations  |
| `SUPABASE_DB_URL`         | Direct database connection           |
| `LOVABLE_API_KEY`         | AI Gateway authentication            |

---

## 16. Development Guidelines

### Do's

- ✅ Use semantic design tokens (`bg-primary`, `text-muted-foreground`) not raw colors
- ✅ Import Supabase client from `@/integrations/supabase/client`
- ✅ Add RLS policies to all new tables
- ✅ Use edge functions for AI calls — never call AI gateway from client
- ✅ Include fallback data for pages that fetch from Supabase
- ✅ Keep components small and focused
- ✅ Use `useCallback` and `useMemo` for performance-critical renders

### Don'ts

- ❌ Never edit `src/integrations/supabase/client.ts` or `types.ts`
- ❌ Never edit `supabase/config.toml` or `.env` manually
- ❌ Never store private keys in frontend code
- ❌ Never use `ALTER DATABASE` in migrations
- ❌ Never modify Supabase reserved schemas (auth, storage, realtime)
- ❌ Never call AI models directly from the client side
- ❌ Never hardcode Supabase URLs — use environment variables

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx` (wrap with `<ProtectedRoute>` if auth required)
3. Add sidebar entry in `src/components/AppSidebar.tsx`
4. Create any needed database tables via migration
5. Add RLS policies
6. Update this documentation

### Adding a New Edge Function

1. Create `supabase/functions/<name>/index.ts`
2. Include CORS headers
3. Set `verify_jwt` in `supabase/config.toml`
4. Use `Deno.env.get()` for secrets
5. Deploy is automatic
6. Call via `supabase.functions.invoke('<name>')` from frontend

---

## Appendix: File Ownership

| File                          | Auto-Generated | Editable |
|-------------------------------|----------------|----------|
| `src/integrations/supabase/client.ts` | Yes      | ❌ No    |
| `src/integrations/supabase/types.ts`  | Yes      | ❌ No    |
| `supabase/config.toml`               | Yes      | ❌ No    |
| `.env`                               | Yes      | ❌ No    |
| `supabase/migrations/*`             | Generated | ❌ No    |
| Everything else                      | No       | ✅ Yes   |
