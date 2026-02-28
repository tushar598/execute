# 🌿 Grento — Carbon Credit Marketplace Platform

A full-stack **carbon credit trading platform** built with **Next.js 16**, **MongoDB**, and **Google Gemini AI**. The platform connects **farmers**, **community admins**, **aggregators**, and **companies** in a transparent carbon credit supply chain — from credit generation on farms all the way to corporate purchase, with blockchain-style SHA-256 audit logging at every step.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Environment Variables](#-environment-variables)
- [Roles & Workflows](#-roles--workflows)
  - [1. Farmer / User](#1-farmer--user)
  - [2. Community Admin](#2-community-admin)
  - [3. Aggregator](#3-aggregator)
  - [4. Company (Buyer)](#4-company-buyer)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
  - [Authentication](#authentication)
  - [User / Farmer APIs](#user--farmer-apis)
  - [Community Admin APIs](#community-admin-apis)
  - [Community Data APIs](#community-data-apis)
  - [Aggregator APIs](#aggregator-apis)
  - [Company APIs](#company-apis)
  - [AI-Powered APIs](#ai-powered-apis)
  - [Transaction & Audit APIs](#transaction--audit-apis)
- [Core Business Logic](#-core-business-logic)
  - [Credit Distribution (AI)](#credit-distribution-ai)
  - [Payment Cascade (Buy Project)](#payment-cascade-buy-project)
  - [Blockchain-Style Audit Trail](#blockchain-style-audit-trail)
- [Frontend Pages](#-frontend-pages)
- [Scripts](#-scripts)
- [Getting Started](#-getting-started)

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  Landing Page │ Login/Signup │ Role Selection │ Dashboards        │
└──────────────────────────┬───────────────────────────────────────┘
                           │ API Routes (app/api/*)
┌──────────────────────────▼───────────────────────────────────────┐
│                      BACKEND (API Routes)                        │
│  Auth │ Users │ Community │ CommunityAdmin │ Aggregator │ Company│
│  AI (Gemini) │ Transactions │ AuditLogs                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼───────────────────────────────────────┐
│                     DATABASE (MongoDB Atlas)                     │
│  16 Collections: User, UserProfile, Credit, Community,           │
│  CommunityAdmin, CommunityCarbonCredits, CarbonMarket,           │
│  CommunityAggregatorDeal, AggregatorProfile, AggregatorDeals,    │
│  AggregatorProject, Company, CompanyDeals, Transaction,          │
│  AuditLog, MemberPayout                                          │
└──────────────────────────────────────────────────────────────────┘
```

**Data flow:**

```
Farmers → generate credits (AI) → Community pools credits
→ Listed on Carbon Market → Aggregator proposes deal → Community accepts
→ Aggregator bundles into Project → Company buys project
→ Payment cascades back to individual farmer wallets
```

---

## 📁 Project Structure

```
demowallet/
├── app/
│   ├── layout.tsx                  # Root layout (Geist fonts, global CSS)
│   ├── page.tsx                    # Landing page (Hero, About, Stats, Solutions)
│   ├── globals.css                 # Global styles (Tailwind)
│   │
│   ├── api/                        # ── Backend API Routes ──
│   │   ├── auth/
│   │   │   ├── register/route.ts   # POST — Register user or company
│   │   │   ├── login/route.ts      # POST — Login (organisation / company)
│   │   │   ├── me/route.ts         # GET  — Get current session user
│   │   │   └── logout/route.ts     # POST — Clear auth cookie
│   │   │
│   │   ├── users/
│   │   │   ├── onboarding/route.ts    # POST — Farmer profile onboarding (multipart)
│   │   │   ├── getprofile/route.ts    # GET  — Fetch profile + credits + balance
│   │   │   ├── updateprofile/route.ts # PATCH — Update profile fields/files
│   │   │   └── my_payouts/route.ts    # GET  — Fetch all payout history
│   │   │
│   │   ├── communityadmin/
│   │   │   ├── onboarding/route.ts         # POST — Create community + admin link
│   │   │   ├── getcommunityadmin/route.ts  # GET  — Fetch admin profile + community
│   │   │   ├── updatecommunitydata/route.ts# PATCH — Update community (admin only)
│   │   │   └── verifycommunityadmin/route.ts# GET  — Check if user is community admin
│   │   │
│   │   ├── community/
│   │   │   ├── getcommunity/route.ts                          # GET  — List all communities
│   │   │   ├── getspecific_community/route.ts                 # GET  — Get single community
│   │   │   ├── getspecific_community_memebers/route.ts        # GET  — Get community member users
│   │   │   ├── get_specific_community_members_userprofile/route.ts # GET — Members' profiles + total land
│   │   │   ├── getcommunitycredit/route.ts                    # GET  — Community carbon credit count
│   │   │   ├── setcommunitymember/route.ts                    # POST — Add user to community
│   │   │   ├── list_on_market/route.ts                        # POST — List credits on Carbon Market
│   │   │   ├── get_community_aggregator_proposal/route.ts     # GET/POST — View/Accept/Reject deals
│   │   │   └── sale_transactions/route.ts                     # GET  — Community sale history (admin)
│   │   │
│   │   ├── aggregator/
│   │   │   ├── onboarding/route.ts          # POST — Register aggregator (DealerId)
│   │   │   ├── verifyaggregator/route.ts    # GET  — Check if user is aggregator
│   │   │   ├── aggregatordeal/route.ts      # POST — Propose deal to community
│   │   │   ├── get_marketplace_data/route.ts# GET  — Browse Carbon Market listings
│   │   │   ├── projects/route.ts            # GET/POST — View/Create bundled projects
│   │   │   ├── analytics/route.ts           # GET  — Aggregator dashboard analytics
│   │   │   └── sold_projects/route.ts       # GET  — Sold projects with payout breakdown
│   │   │
│   │   ├── company/
│   │   │   ├── marketplace/route.ts         # GET  — Browse open aggregator projects
│   │   │   ├── buy_project/route.ts         # POST — Purchase project (payment cascade)
│   │   │   └── totalaggregator/route.ts     # GET  — Company dashboard stats
│   │   │
│   │   ├── ai/
│   │   │   ├── suggestion/route.ts               # POST — AI farming suggestions (Gemini)
│   │   │   ├── getclimatehistory/route.ts         # POST — Climate report PDF (Gemini)
│   │   │   └── divide_community_crdits/route.ts   # POST — AI credit distribution
│   │   │
│   │   ├── transactions/
│   │   │   ├── all_transactions/route.ts     # GET — All transactions for an entity
│   │   │   └── specific_transactions/route.ts# GET — Single transaction by ID
│   │   │
│   │   └── auditlogs/route.ts               # GET — Fetch audit logs with chain verification
│   │
│   ├── models/                     # ── Mongoose Data Models (16 schemas) ──
│   │   ├── user.ts                 # User account (userId, email, phone, password)
│   │   ├── userprofile.ts          # Farmer profile (land, crops, soil, KYC docs)
│   │   ├── credit.ts              # Credit wallet (credit count + fiat balance)
│   │   ├── community.ts           # Community (members, admin, practices, location)
│   │   ├── communityadmin.ts      # Normalized link: userId ↔ community_id
│   │   ├── communitycarboncredits.ts # Community aggregate credit pool
│   │   ├── communityaggregatordeal.ts# Deal proposals from aggregators to communities
│   │   ├── carbonmarket.ts        # Global marketplace listing (community/individual)
│   │   ├── company.ts             # Company account (name, email, companyId)
│   │   ├── companydeals.ts        # Purchase records (company → aggregator project)
│   │   ├── aggregatorprofile.ts   # Aggregator profile (userId ↔ DealerId)
│   │   ├── aggregatordeals.ts     # Accepted deals ledger (community/individual)
│   │   ├── aggregatorproject.ts   # Bundled project for sale to companies
│   │   ├── transaction.ts         # Financial transactions (sale/purchase/transfer)
│   │   ├── auditlogs.ts          # SHA-256 chained audit trail
│   │   └── memberpayout.ts       # Per-member earnings from project sales
│   │
│   ├── lib/                        # ── Utilities ──
│   │   ├── db.ts                   # MongoDB connection (cached for HMR)
│   │   └── jwt.ts                  # JWT sign/verify helpers
│   │
│   ├── components/                 # ── Reusable Components ──
│   │   ├── LeafletMap.tsx          # Interactive map component
│   │   └── homecomponents/
│   │       ├── Navbar.tsx          # Navigation bar
│   │       ├── Footer.tsx          # Footer
│   │       ├── herosection.tsx     # Hero landing section
│   │       ├── aboutsection.tsx    # About section
│   │       ├── solutionsection.tsx # Solutions section
│   │       └── statesection.tsx    # Statistics section
│   │
│   ├── login/page.tsx              # Login page
│   ├── signup/page.tsx             # Registration page
│   ├── selectrole/page.tsx         # Role selection (after registration)
│   │
│   ├── user/                       # ── Farmer Pages ──
│   │   ├── dashboard/page.tsx      # Farmer dashboard
│   │   ├── onboarding/page.tsx     # Profile onboarding form
│   │   └── updateprofile/page.tsx  # Profile update form
│   │
│   ├── community/                  # ── Community Admin Pages ──
│   │   ├── dashboard/page.tsx      # Community dashboard
│   │   ├── onboarding/page.tsx     # Community creation form
│   │   ├── getcarboncredit/page.tsx# Credit generation (triggers AI distribution)
│   │   └── communitymarketplace/page.tsx # Marketplace view
│   │
│   ├── aggregator/                 # ── Aggregator Pages ──
│   │   ├── dashboard/page.tsx      # Aggregator dashboard with analytics
│   │   ├── onboarding/page.tsx     # Aggregator registration
│   │   ├── marketplace/page.tsx    # Browse Carbon Market to propose deals
│   │   └── project/page.tsx        # Create and manage bundled projects
│   │
│   └── company/                    # ── Company Pages ──
│       ├── dashboard/page.tsx      # Company dashboard with stats
│       └── marketplace/page.tsx    # Browse and purchase aggregator projects
│
├── scripts/
│   ├── migrate_credits.js          # Migration: credit → balance for existing records
│   └── inspect_credits.js          # Debug: inspect credit records
│
├── public/                         # Static assets (SVGs)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── postcss.config.mjs              # PostCSS (Tailwind)
├── eslint.config.mjs               # ESLint configuration
└── .env                            # Environment variables
```

---

## 🛠 Tech Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Framework   | **Next.js 16** (App Router, API Routes)        |
| Language    | **TypeScript**                                  |
| Database    | **MongoDB Atlas** via **Mongoose 9**            |
| Auth        | **JWT** (httpOnly cookies) + **bcryptjs**       |
| Validation  | **Zod** schema validation                       |
| AI          | **Google Gemini** (`@google/genai`)             |
| PDF         | **jsPDF** for climate report generation         |
| Maps        | **Leaflet** + **react-leaflet**                 |
| Animations  | **GSAP** + `@gsap/react`                        |
| Blockchain  | **ethers.js** + **bip39** (wallet primitives)   |
| Styling     | **Tailwind CSS 4**                              |
| Icons       | **lucide-react**                                |

---

## 🔐 Environment Variables

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| `MONGODB_URI`  | MongoDB Atlas connection string    |
| `JWT_SECRET`   | Secret key for JWT signing         |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`)     |
| `GEMINI_API_KEY` | Google Gemini API key for AI     |
| `NODE_ENV`     | `development` or `production`      |

---

## 👥 Roles & Workflows

### 1. Farmer / User

```
Register (organisation role) → Login → Select Role → Onboarding Form → Dashboard
```

- **Registration**: Creates a `User` document with hashed password. JWT token set as httpOnly cookie.
- **Onboarding** (`POST /api/users/onboarding`): Multipart form submission with:
  - KYC documents (Aadhaar, PAN, bank account, IFSC)
  - Land details (area, GPS coordinates, soil type)
  - Farming info (current/previous crops, urea usage, sustainable practices)
  - File uploads: climate land data & soil test report (stored as binary in MongoDB)
  - Entry status: **individual** or **community** (if community, auto-joins the selected community's member list)
- **Dashboard**: Displays credit count, fiat balance, AI-powered suggestions, climate history report, land map, and payout history.
- **Payouts**: When a company buys an aggregator project, earnings are **proportionally distributed** to each community member based on their individual credit contribution.

### 2. Community Admin

```
Register → Login → Community Onboarding → Dashboard
```

- **Community Onboarding** (`POST /api/communityadmin/onboarding`): Creates both a `Community` document and a `CommunityAdmin` link (normalized — admin is a User with an admin role assignment).
- **Dashboard**: View community members, their profiles, total land area, aggregated carbon credits, and deal proposals.
- **Credit Generation** (`POST /api/ai/divide_community_crdits`): Triggers **AI-powered** (Gemini) credit calculation based on total community land area and farming practices. Credits are distributed proportionally to each member's `Credit` wallet. A fallback formula (1.5 credits/acre) is used if AI is unavailable.
- **List on Market** (`POST /api/community/list_on_market`): Lists the community's carbon credits on the global `CarbonMarket` with a SHA-256 audit log entry.
- **Deal Management** (`GET/POST /api/community/get_community_aggregator_proposal`):
  - **View** incoming proposals from aggregators.
  - **Accept**: Creates an `AggregatorDeals` entry, deducts credits from the community pool, updates the Carbon Market listing.
  - **Reject**: Updates deal status without any credit movement.
- **Sale Transactions** (`GET /api/community/sale_transactions`): Aggregates `MemberPayout` records by project, showing total payout per sale, member details, and buyer information.

### 3. Aggregator

```
Register → Login → Aggregator Onboarding → Browse Marketplace → Propose Deals → Create Projects
```

- **Aggregator Onboarding** (`POST /api/aggregator/onboarding`): Creates an `AggregatorProfile` linking the authenticated user to a unique `DealerId`.
- **Browse Marketplace** (`GET /api/aggregator/get_marketplace_data`): Fetches all communities that have listed their credits on the Carbon Market.
- **Propose Deal** (`POST /api/aggregator/aggregatordeal`): Creates a `CommunityAggregatorDeal` with `pending` status. The community admin can then accept or reject this proposal.
- **Projects** (`GET/POST /api/aggregator/projects`):
  - **View**: Lists all projects with available credit inventory (purchased credits minus already-bundled credits).
  - **Create**: Bundles purchased credits into a named project with a price-per-credit for the company marketplace. Inventory is validated. A SHA-256 audit log is created.
- **Analytics** (`GET /api/aggregator/analytics`): Returns total deals, total credits, total value, active communities, and recent deals.
- **Sold Projects** (`GET /api/aggregator/sold_projects`): Returns sold projects enriched with company name, payout breakdowns, and aggregator profit calculations.

### 4. Company (Buyer)

```
Register (company role) → Login → Dashboard → Browse Projects → Buy Project
```

- **Registration**: Creates a `Company` document (name, email, companyId, phone, password).
- **Browse Marketplace** (`GET /api/company/marketplace`): Lists all `open` aggregator projects sorted by newest.
- **Buy Project** (`POST /api/company/buy_project`): **The most complex operation** — triggers a full payment cascade:
  1. Validates company session and finds the open project.
  2. Identifies source communities via `AggregatorDeals`.
  3. For each source community, loads all members and their `Credit` records.
  4. **Proportionally distributes** earnings to each farmer based on their credit contribution ratio.
  5. Updates each member's `Credit` record (decrements `credit`, increments `balance`).
  6. Creates `MemberPayout` records for each farmer.
  7. Creates per-member `Transaction` (transfer) and `AuditLog` entries.
  8. Calculates aggregator profit = totalPaid − communityTotalPayout.
  9. Marks project as `sold`, creates `CompanyDeals` record.
  10. Writes final SHA-256 chained audit logs for the purchase and sale completion.
- **Dashboard Stats** (`GET /api/company/totalaggregator`): Returns total registered aggregators, available projects, and credits bought by this company.

---

## 📊 Data Models

| Model                     | Purpose                                                  | Key Fields                                                           |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| `User`                    | User account (farmers, admins, aggregators)               | `userId`, `username`, `email`, `phone`, `password`                   |
| `UserProfile`             | Detailed farmer profile                                   | `userId` (ref), KYC docs, land info, crops, soil, practices          |
| `Credit`                  | Farmer credit wallet                                      | `userId`, `credit` (volume), `balance` (fiat earnings)               |
| `Community`               | Community group                                           | `community_id`, `community_name`, `community_members_id[]`, admin    |
| `CommunityAdmin`          | Normalized User ↔ Community link                          | `userId` (ref), `community_id`                                       |
| `CommunityCarbonCredits`  | Community aggregate credit pool                           | `community_id`, `community_carbon_credits`, `credits_sold`           |
| `CarbonMarket`            | Global marketplace listings                               | `communityCarbonMarket` / `individualCarbonMarket` subdocuments      |
| `CommunityAggregatorDeal` | Deal proposals from aggregator → community                | `community_id`, `aggregator_id`, `credits_offered`, `status`         |
| `Company`                 | Company buyer account                                     | `companyId`, `companyName`, `companyEmail`, `password`                |
| `CompanyDeals`            | Purchase records                                          | `companyId`, `projectId`, `creditAmount`, `totalValue`, `txHash`     |
| `AggregatorProfile`       | Aggregator registration                                   | `userId` (ref), `DealerId`                                           |
| `AggregatorDeals`         | Accepted deals ledger                                     | `aggregatorId`, `communityDealInfo` / `individualDealInfo`           |
| `AggregatorProject`       | Bundled project for company marketplace                   | `aggregatorId`, `projectName`, `totalCredits`, `pricePerCredit`      |
| `Transaction`             | Financial transaction record                              | `type` (sale/purchase/transfer), `fromId`, `toId`, `totalValue`      |
| `AuditLog`                | SHA-256 chained audit trail                               | `action`, `txHash`, `previousHash`, `metadata`                       |
| `MemberPayout`            | Per-member earnings from project sales                    | `userId`, `communityId`, `projectId`, `creditAmount`, `totalPayout`  |

---

## 📡 API Reference

### Authentication

| Method | Endpoint              | Description                                       | Auth |
| ------ | --------------------- | ------------------------------------------------- | ---- |
| POST   | `/api/auth/register`  | Register user (`organisation`) or `company`       | ✗    |
| POST   | `/api/auth/login`     | Login with email/userId + password                | ✗    |
| GET    | `/api/auth/me`        | Get current authenticated user from JWT cookie    | ✓    |
| POST   | `/api/auth/logout`    | Clear auth cookie                                 | ✗    |

**Auth Logic**: Passwords are hashed with `bcryptjs` (12 salt rounds). JWTs encode `{id, role, email}` and are stored as httpOnly, secure, sameSite-strict cookies with 7-day expiry. Login accepts both `email` and `userId`/`companyId` as identifier.

---

### User / Farmer APIs

| Method | Endpoint                  | Description                              | Auth |
| ------ | ------------------------- | ---------------------------------------- | ---- |
| POST   | `/api/users/onboarding`   | Create farmer profile (multipart form)   | ✓    |
| GET    | `/api/users/getprofile`   | Get profile + credits + balance          | ✓    |
| PATCH  | `/api/users/updateprofile`| Update profile fields/files              | ✓    |
| GET    | `/api/users/my_payouts`   | Get all payout records                   | ✓    |

---

### Community Admin APIs

| Method | Endpoint                                  | Description                          | Auth |
| ------ | ----------------------------------------- | ------------------------------------ | ---- |
| POST   | `/api/communityadmin/onboarding`          | Create community + admin link        | ✓    |
| GET    | `/api/communityadmin/getcommunityadmin`   | Get admin profile + community data   | ✓    |
| PATCH  | `/api/communityadmin/updatecommunitydata` | Update community (admin only)        | ✓    |
| GET    | `/api/communityadmin/verifycommunityadmin`| Check if user is community admin     | ✓    |

---

### Community Data APIs

| Method | Endpoint                                                    | Description                                    | Auth |
| ------ | ----------------------------------------------------------- | ---------------------------------------------- | ---- |
| GET    | `/api/community/getcommunity`                               | List all communities                           | ✗    |
| GET    | `/api/community/getspecific_community?community_id=`        | Get single community details                   | ✗    |
| GET    | `/api/community/getspecific_community_memebers?community_id=`| Get community member user records              | ✗    |
| GET    | `/api/community/get_specific_community_members_userprofile` | Get members' profiles + total land area        | ✗    |
| GET    | `/api/community/getcommunitycredit?community_id=`           | Get community credit count                     | ✗    |
| POST   | `/api/community/setcommunitymember`                         | Add user to community                          | ✗    |
| POST   | `/api/community/list_on_market`                             | List credits on Carbon Market + audit log      | ✗    |
| GET    | `/api/community/get_community_aggregator_proposal`          | Fetch deal proposals for community             | ✗    |
| POST   | `/api/community/get_community_aggregator_proposal`          | Accept/reject aggregator deal proposal         | ✗    |
| GET    | `/api/community/sale_transactions`                          | Community sale history (admin only)            | ✓    |

---

### Aggregator APIs

| Method | Endpoint                                  | Description                              | Auth |
| ------ | ----------------------------------------- | ---------------------------------------- | ---- |
| POST   | `/api/aggregator/onboarding`              | Register as aggregator with DealerId     | ✓    |
| GET    | `/api/aggregator/verifyaggregator`        | Check if user is aggregator              | ✓    |
| GET    | `/api/aggregator/get_marketplace_data`    | Browse Carbon Market community listings  | ✗    |
| POST   | `/api/aggregator/aggregatordeal`          | Propose deal to community                | ✗    |
| GET    | `/api/aggregator/projects`                | List projects + available credit inventory| ✓   |
| POST   | `/api/aggregator/projects`                | Create bundled project + audit log       | ✓    |
| GET    | `/api/aggregator/analytics`               | Dashboard analytics (deals, credits, value)| ✓  |
| GET    | `/api/aggregator/sold_projects`           | Sold projects with payout breakdowns     | ✓    |

---

### Company APIs

| Method | Endpoint                        | Description                                 | Auth |
| ------ | ------------------------------- | ------------------------------------------- | ---- |
| GET    | `/api/company/marketplace`      | Browse open aggregator projects             | ✗    |
| POST   | `/api/company/buy_project`      | Purchase project (full payment cascade)     | ✓    |
| GET    | `/api/company/totalaggregator`  | Dashboard stats (aggregators, projects, credits)| ✓ |

---

### AI-Powered APIs

| Method | Endpoint                              | Description                                  | Auth |
| ------ | ------------------------------------- | -------------------------------------------- | ---- |
| POST   | `/api/ai/suggestion`                  | AI farming/market suggestions (Gemini)       | ✗    |
| POST   | `/api/ai/getclimatehistory`           | Climate intelligence PDF report (Gemini)     | ✗    |
| POST   | `/api/ai/divide_community_crdits`     | AI-based credit calculation + distribution   | ✗    |

---

### Transaction & Audit APIs

| Method | Endpoint                                    | Description                              | Auth |
| ------ | ------------------------------------------- | ---------------------------------------- | ---- |
| GET    | `/api/transactions/all_transactions`        | All transactions for an entity           | ✓    |
| GET    | `/api/transactions/specific_transactions`   | Single transaction by ID                 | ✓    |
| GET    | `/api/auditlogs`                            | Fetch audit logs with chain integrity    | ✗    |

---

## ⚙ Core Business Logic

### Credit Distribution (AI)

**Endpoint**: `POST /api/ai/divide_community_crdits`

1. Receives `community_id`, `total_land_area`, and `profiles[]` (member data).
2. **Gemini AI** calculates total carbon credits based on community size and farming practices.
3. If AI fails, **fallback formula**: `1.5 credits/acre/year`.
4. Credits are distributed **proportionally by land area** — each member's `Credit.credit` is incremented.
5. Community aggregate `CommunityCarbonCredits` is updated with total generated credits.

### Payment Cascade (Buy Project)

**Endpoint**: `POST /api/company/buy_project`

This is the most complex workflow — a single company purchase triggers a full financial cascade:

```
Company pays totalPaid = totalCredits × pricePerCredit
       │
       ▼
For each source community in the project:
       │
       ├── Load all community members + their Credit records
       ├── Calculate each member's share = memberCredits / totalCommunityCredits
       ├── memberPayout = share × communityPayout
       │
       ├── Update Credit: credit -= memberCreditsIncluded, balance += memberPayout
       ├── Create MemberPayout record
       ├── Create per-member Transaction (transfer)
       └── Create per-member AuditLog (SHA-256 chained)
       │
       ▼
aggregatorProfit = totalPaid − sum(communityPayouts)
       │
       ▼
Mark project "sold" → Create CompanyDeals → Final AuditLog entries
```

### Blockchain-Style Audit Trail

Every significant action creates an `AuditLog` entry with:

- **SHA-256 hash chaining**: Each `txHash` = SHA-256(`previousHash` + action payload JSON). This creates an immutable, tamper-evident chain.
- **Actions tracked**: `credit_generated`, `credit_purchased`, `credit_verified`, `profile_updated`, `credit_listed`, `project_created`, `deal_accepted`, `transaction_completed`, `credit_distributed`, `aggregator_sale_completed`.
- **Chain verification**: The `GET /api/auditlogs` endpoint performs lightweight chain integrity validation on returned entries.

### AI Suggestions Engine

**Endpoint**: `POST /api/ai/suggestion`

- Sends farmer profile (crops, soil type, location, practices, urea usage) to **Gemini 2.0 Flash**.
- Returns 6 personalized suggestions of types: `opportunity`, `alert`, `practice`, `market`, `warning`.
- **Fallback**: If Gemini is unavailable, returns a weighted random selection from a 70+ entry curated suggestion bank covering soil health, water management, carbon optimization, crop management, climate resilience, market timing, biodiversity, and more.

### Climate Intelligence Report

**Endpoint**: `POST /api/ai/getclimatehistory`

- Uses Gemini to generate 4-year historical climate data for a GPS location.
- Falls back to deterministic mock data seeded from lat/lng.
- Builds a professional **PDF report** (jsPDF) with:
  - Temperature trends, rainfall, humidity, carbon sequestration estimates.
  - Monthly breakdown tables for each year.
  - Returns as base64-encoded PDF.

---

## 🖥 Frontend Pages

| Route                          | Component                        | Purpose                                      |
| ------------------------------ | -------------------------------- | -------------------------------------------- |
| `/`                            | Landing page                     | Hero, About, Stats, Solutions, Footer         |
| `/login`                       | Login form                       | Email/ID + password, role selection           |
| `/signup`                      | Registration form                | User or company registration                 |
| `/selectrole`                  | Role selection                   | Choose: Farmer, Community Admin, Aggregator   |
| `/user/dashboard`              | Farmer dashboard                 | Credits, balance, suggestions, climate report |
| `/user/onboarding`             | Farmer onboarding                | Profile form with file uploads and map        |
| `/user/updateprofile`          | Profile update                   | Edit existing profile data                    |
| `/community/dashboard`         | Community dashboard              | Members, credits, deals, sale transactions    |
| `/community/onboarding`        | Community creation               | Create community with practices               |
| `/community/getcarboncredit`   | Credit generation                | Trigger AI credit distribution                |
| `/community/communitymarketplace` | Community marketplace         | View/manage market listings                   |
| `/aggregator/dashboard`        | Aggregator dashboard             | Analytics, deals, project management          |
| `/aggregator/onboarding`       | Aggregator registration          | Register with Dealer ID                       |
| `/aggregator/marketplace`      | Market browsing                  | Browse community listings, propose deals      |
| `/aggregator/project`          | Project management               | Create/view bundled credit projects           |
| `/company/dashboard`           | Company dashboard                | Stats, purchased credits overview             |
| `/company/marketplace`         | Company marketplace              | Browse and buy aggregator projects            |

---

## 📜 Scripts

| Script                    | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `scripts/migrate_credits.js`  | Migrates `Credit` records: moves `credit` → `balance` for records with balance = 0 but credit > 0 |
| `scripts/inspect_credits.js`  | Debug utility to inspect credit records in the database           |

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd demowallet

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Gemini API key

# 4. Run development server
npm run dev

# 5. Open in browser
open http://localhost:3000
```

### Available Scripts

```bash
npm run dev    # Start development server with hot reload
npm run build  # Build production bundle
npm run start  # Start production server
npm run lint   # Run ESLint
```

---

## 📄 License

This project is private and not licensed for public distribution.
