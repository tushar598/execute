<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-.Execute-blueviolet?style=for-the-badge&logo=hackthebox&logoColor=white" alt="Hackathon Badge" />
  <img src="https://img.shields.io/badge/Duration-36%20Hours-orange?style=for-the-badge" alt="Duration" />
  <img src="https://img.shields.io/badge/Status-Completed-brightgreen?style=for-the-badge" alt="Status" />
</p>

<h1 align="center">🌿 EcoTrade — Renewable Energy Marketplace Portal</h1>

<p align="center">
  <b>India's first dual-marketplace platform for peer-to-peer green energy trading and verified carbon credit exchange — connecting renewable energy producers, sustainable farmers, consumers, and corporations.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Gemini%20AI-Integrated-4285F4?logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss" alt="TailwindCSS" />
</p>

---

## 👥 Team Details

| | Name | Role |
|---|---|---|
| 🏆 | **Tushar Singh Chouhan** | Team Lead |
| 👩‍💻 | **Sheetal Pandey** | Team Member |
| 👨‍💻 | **Karan Verma** | Team Member |

**Team Name:** `Hustlers`
**Hackathon:** `.Execute` — 36 Hours
**Problem Statement:** Renewable Energy Marketplace Portal

---

## 📖 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution — EcoTrade](#-our-solution--ecotrade)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema-21-models)
- [API Routes](#-api-routes-47-endpoints)
- [User Roles & Flows](#-user-roles--flows)
- [AI Integration](#-ai-integration-gemini)
- [Security & Audit](#-security--audit)
- [Pages & UI](#-pages--ui)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Use Cases](#-use-cases)
- [Screenshots](#-screenshots)
- [Future Scope](#-future-scope)

---

## 🎯 Problem Statement

> **Design a web platform that connects renewable energy producers (solar rooftop owners, biogas plants, wind farms) with consumers or investors.**

### Objectives

| Objective | How EcoTrade Solves It |
|---|---|
| Promote decentralized energy exchange | Sun Token marketplace enables P2P solar energy trading with geo-located listings |
| Enable peer-to-peer green energy trading | Direct producer-to-consumer transactions without intermediary dependency |
| Encourage community-based sustainability | Community system lets farmer groups collectively pool, verify, and sell carbon credits |

---

## 💡 Our Solution — EcoTrade

**EcoTrade** is a full-stack, production-grade web platform that operates **two interconnected marketplaces** on a single unified portal:

### 1. ☀️ Sun Token Marketplace (Energy Trading)
Solar rooftop owners register their installations, track energy production vs. consumption, and tokenize **surplus energy** into **Sun Tokens**. These tokens are listed on a geo-located marketplace where consumers and companies can purchase clean energy peer-to-peer. Transactions go through a simulated government review pipeline and include SHA-256 audit hashing.

### 2. 🌱 Carbon Credit Marketplace (Carbon Offsetting)
Smallholder farmers and farming communities register their land, practices, and crops. **Google Gemini AI** calculates their carbon sequestration, minting verified carbon credits. These credits can be sold individually on the marketplace or aggregated into larger project bundles for corporate buyers. Every transaction produces a blockchain-style audit trail with immutable hash chaining.

---

## ✨ Key Features

### Energy Trading (Sun Tokens)
- 🔋 **Solar Onboarding** — KYC-verified producer registration with digital meter, coordinates, and bank details
- ⚡ **Tokenization Engine** — Converts leftover kWh into Sun Tokens (1 kWh = 1 Token)
- 🗺️ **Geo-Located Marketplace** — Interactive Leaflet.js map showing nearby energy listings
- 🛒 **P2P Purchasing** — Buyer purchases with multi-step government processing pipeline (`processing → govt_review → delivered → payment_sent → completed`)
- 💰 **Direct Seller Payouts** — Revenue flows directly to the seller's registered bank account

### Carbon Credit Trading
- 🧑‍🌾 **Farmer Onboarding** — Detailed land profiling (soil type, crops, practices, Aadhar/PAN, GIS coordinates)
- 🤖 **AI-Powered Credit Estimation** — Google Gemini estimates CO₂ sequestration based on land area, soil, practices, and crops
- 👥 **Community Pooling** — Community admins manage farmer groups, collectively generate and distribute credits
- 🏢 **Aggregator System** — Aggregators bundle community credits into project proposals for corporate buyers
- 🏭 **Corporate Buyer Dashboard** — Companies browse aggregated projects, purchase credits, and track ESG offset progress
- 📊 **Individual Marketplace** — Farmers can also list and sell credits directly to consumers

### Platform-Wide
- 🔐 **JWT Authentication** — Secure login for Individuals, Community Admins, Companies, with role-based routing
- 🔗 **SHA-256 Audit Chain** — Every action (credit generated, listed, purchased, sold) creates an immutable audit log with `txHash` and `previousHash`
- 📄 **AI Climate Reports** — Gemini generates 5-year climate history PDFs with monthly breakdowns for any lat/lng
- 💡 **AI Smart Suggestions** — Personalized farming recommendations powered by Gemini (70+ fallback suggestions)
- 🎫 **Referral System** — Users generate unique 20-character referral codes to invite others
- 🗺️ **Interactive Maps** — Leaflet.js integration for land visualization and energy listing locations
- 🎬 **GSAP Animations** — Smooth, cinematic landing page with scroll-triggered animations

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EcoTrade Platform                               │
├──────────────────────────────┬──────────────────────────────────────────┤
│     ☀️ Sun Token Marketplace  │    🌱 Carbon Credit Marketplace          │
│                              │                                          │
│  Solar Seller ──→ Tokenize   │  Farmer ──→ AI Verify ──→ Mint Credits   │
│       ↓                      │       ↓                                  │
│  List on Market (Geo-Map)    │  Individual List OR Community Pool        │
│       ↓                      │       ↓                    ↓              │
│  Buyer Purchase (P2P)        │  Direct P2P Sale    Aggregator Bundle     │
│       ↓                      │       ↓                    ↓              │
│  Govt Review Pipeline        │  Audit Log Chain    Company Purchase      │
│       ↓                      │       ↓                    ↓              │
│  Seller Payout               │  Farmer Payout      Member Payouts       │
├──────────────────────────────┴──────────────────────────────────────────┤
│                        Shared Infrastructure                            │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐  │
│  │ Auth   │ │ Audit    │ │ Referral │ │ AI     │ │ Transactions     │  │
│  │ (JWT)  │ │ (SHA256) │ │ System   │ │(Gemini)│ │ (Indexed Logs)   │  │
│  └────────┘ └──────────┘ └──────────┘ └────────┘ └──────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                     MongoDB (Mongoose ODM)                              │
│          21 Collections  •  Indexed Queries  •  Cached Connection       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript 5 | Type-safe development |
| **Frontend** | React 19 | Component-based UI |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Animations** | GSAP 3.14 + @gsap/react | Cinematic scroll-triggered animations |
| **Icons** | Lucide React | Consistent icon library |
| **Maps** | Leaflet.js + React-Leaflet 5 | Interactive geo-located listings |
| **Database** | MongoDB + Mongoose 9 | NoSQL document store with ODM |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Secure token-based authentication |
| **AI** | Google Gemini AI (@google/genai) | Carbon credit estimation & smart suggestions |
| **PDF** | jsPDF | Climate history report generation |
| **Crypto** | Ethers.js 6 + bip39 | Blockchain-style hash generation |
| **Validation** | Zod 4 | Runtime schema validation |
| **Fonts** | Geist + Geist Mono | Modern typography |

---

## 📁 Project Structure

```
newproject/
├── app/
│   ├── page.tsx                        # Landing page (Hero + About + Stats + Solutions + Footer)
│   ├── layout.tsx                      # Root layout with Geist fonts & metadata
│   ├── globals.css                     # Global styles
│   ├── favicon.ico
│   │
│   ├── login/page.tsx                  # Login page (Individual + Company toggle)
│   ├── signup/page.tsx                 # Registration page (Individual + Company toggle)
│   │
│   ├── components/
│   │   ├── LeafletMap.tsx              # Reusable interactive map component
│   │   └── homecomponents/
│   │       ├── Navbar.tsx              # Responsive navbar with scroll effect
│   │       ├── herosection.tsx         # Hero with video background & GSAP
│   │       ├── aboutsection.tsx        # How-it-works section
│   │       ├── statesection.tsx        # Animated impact statistics
│   │       ├── solutionsection.tsx     # Platform features showcase
│   │       └── Footer.tsx              # Site footer
│   │
│   ├── user/                           # 👤 Individual Farmer Dashboard
│   │   ├── dashboard/page.tsx          #    Main dashboard (profile, credits, audit logs, suggestions, referrals)
│   │   ├── onboarding/page.tsx         #    Farmer onboarding (land, practices, KYC)
│   │   ├── getcarboncredit/page.tsx    #    Request AI carbon credit estimation
│   │   ├── marketplace/page.tsx        #    Browse & sell credits on marketplace
│   │   └── updateprofile/page.tsx      #    Edit profile information
│   │
│   ├── community/                      # 👥 Community Admin Dashboard
│   │   ├── dashboard/page.tsx          #    Community overview (members, credits, sales, audit)
│   │   ├── onboarding/page.tsx         #    Register new community
│   │   ├── getcarboncredit/page.tsx    #    AI-powered community credit distribution
│   │   └── communitymarketplace/page.tsx  # Community credit marketplace
│   │
│   ├── aggregator/                     # 🔗 Aggregator Dashboard
│   │   ├── dashboard/page.tsx          #    Analytics, deals, projects overview
│   │   ├── onboarding/page.tsx         #    Aggregator registration
│   │   ├── marketplace/page.tsx        #    Browse community listings
│   │   └── project/page.tsx            #    Create & manage project bundles
│   │
│   ├── company/                        # 🏢 Corporate Buyer Dashboard
│   │   ├── dashboard/page.tsx          #    ESG progress, audit trail, purchases
│   │   └── marketplace/page.tsx        #    Browse & buy aggregated projects
│   │
│   ├── solar/                          # ☀️ Sun Token Module
│   │   ├── seller/
│   │   │   ├── dashboard/page.tsx      #    Energy stats, token balance, sales history
│   │   │   ├── onboarding/page.tsx     #    Solar installation registration
│   │   │   ├── get-token/page.tsx      #    Log energy & generate tokens
│   │   │   └── sell-token/page.tsx     #    List tokens on marketplace
│   │   └── buyer/
│   │       ├── dashboard/page.tsx      #    Purchase history, audit trail
│   │       ├── onboarding/page.tsx     #    Buyer registration
│   │       └── marketplace/page.tsx    #    Browse & buy Sun Tokens (with map)
│   │
│   ├── api/                            # 🔌 Backend API Routes (47 endpoints)
│   │   ├── auth/                       #    Authentication (login, register, logout, me)
│   │   ├── users/                      #    User CRUD (profile, marketplace, payouts, onboarding)
│   │   ├── ai/                         #    AI endpoints (suggestions, credit calc, climate history)
│   │   ├── community/                  #    Community management (9 endpoints)
│   │   ├── communityadmin/             #    Admin management (4 endpoints)
│   │   ├── aggregator/                 #    Aggregator operations (7 endpoints)
│   │   ├── company/                    #    Company operations (3 endpoints)
│   │   ├── solar/                      #    Sun Token operations (5 endpoints)
│   │   ├── transactions/               #    Transaction queries (2 endpoints)
│   │   ├── auditlogs/                  #    Audit log queries (1 endpoint)
│   │   └── refferal/                   #    Referral code generation (1 endpoint)
│   │
│   ├── models/                         # 📊 Mongoose Data Models (21 models)
│   │   ├── user.ts                     #    Base user model
│   │   ├── userprofile.ts              #    Extended farmer profile
│   │   ├── company.ts                  #    Corporate entity model
│   │   ├── community.ts                #    Farming community model
│   │   ├── communityadmin.ts           #    Community-admin link
│   │   ├── communitycarboncredits.ts   #    Pooled community credits
│   │   ├── communityaggregatordeal.ts  #    Proposals between aggregators & communities
│   │   ├── aggregatorprofile.ts        #    Aggregator registration
│   │   ├── aggregatorproject.ts        #    Bundled credit projects
│   │   ├── aggregatordeals.ts          #    Purchase deals log
│   │   ├── companydeals.ts             #    Company purchase records
│   │   ├── credit.ts                   #    Individual credit balance
│   │   ├── carbonmarket.ts             #    Marketplace listings
│   │   ├── transaction.ts              #    Financial transaction records
│   │   ├── memberpayout.ts             #    Farmer payout records
│   │   ├── solarprofile.ts             #    Solar installation profile
│   │   ├── suntoken.ts                 #    Token balance & energy tracking
│   │   ├── suntokenmarketlisting.ts    #    Token marketplace listings
│   │   ├── suntokentransaction.ts      #    Token purchase transactions
│   │   ├── auditlogs.ts                #    Immutable audit chain
│   │   └── refferaldata.ts             #    Referral code tracking
│   │
│   └── lib/                            # 🔧 Shared Utilities
│       ├── db.ts                       #    Cached MongoDB connection
│       ├── jwt.ts                      #    Token sign & verify helpers
│       └── constants.ts                #    Platform constants (prices, rates, reasons)
│
├── public/                             # Static assets
│   ├── farm.mp4                        #    Hero background video
│   ├── farm.jpg                        #    Fallback image
│   ├── greensignin.jpg                 #    Login page background
│   └── greensignup.jpg                 #    Signup page background
│
├── scripts/                            # Database utilities
│   ├── migrate_credits.js              #    Credit migration script
│   └── inspect_credits.js              #    Credit inspection tool
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 📊 Database Schema (21 Models)

### Core Identity Models

| Model | Key Fields | Purpose |
|---|---|---|
| `User` | `userId`, `username`, `email`, `phone`, `password`, `role` | Base authentication (roles: `individual`, `communityadmin`) |
| `Company` | `companyName`, `companyEmail`, `companyId`, `companyPhone`, `password` | Corporate buyer entity |
| `UserProfile` | `userId`, `communityId`, `practices[]`, `soil_type`, `landarea`, `landlocation`, `current_crop[]`, `previous_crop[]`, `aadhar_card_no`, `pan_card_no`, `bank_account_no` | Extended farmer profile with full KYC and land data |
| `SolarProfile` | `userId`, `userType`, `address`, `coordinates`, `digitalMeterNumber`, `electricityBill`, `bankAccountNo`, `aadharCardNo`, `panCardNo` | Solar installation registration with KYC |

### Community & Aggregation Models

| Model | Key Fields | Purpose |
|---|---|---|
| `Community` | `community_name`, `community_id`, `community_district`, `community_state`, `community_admin`, `community_practices[]`, `community_members_id[]` | Farming community group |
| `CommunityAdmin` | `userId` (→ User), `community_id` | Admin-community link |
| `CommunityCarbonCredits` | `community_id`, `community_carbon_credits`, `total_credits_generated`, `credits_sold` | Pooled community credit balance |
| `CommunityAggregatorDeal` | `community_id`, `aggregator_id`, `credits_offered`, `price_per_credit`, `status` | Aggregator proposals to communities |
| `AggregatorProfile` | `userId` (→ User), `DealerId` | Aggregator identity |
| `AggregatorProject` | `aggregatorId`, `projectName`, `projectDescription`, `sourceCommunityIds[]`, `totalCredits`, `pricePerCredit`, `status`, `buyerCompanyId` | Bundled credit projects for corporate market |
| `AggregatorDeals` | `aggregatorId`, `communityDealInfo`, `individualDealInfo` | Deal records (community or individual) |

### Marketplace & Financial Models

| Model | Key Fields | Purpose |
|---|---|---|
| `Credit` | `userId`, `credit`, `balance` | Individual credit & balance tracker |
| `CarbonMarket` | `communityCarbonMarket`, `individualCarbonMarket` | Carbon credit marketplace listings |
| `CompanyDeals` | `companyId`, `projectId`, `creditAmount`, `pricePerCredit`, `totalValue`, `transactionHash` | Company purchase records |
| `Transaction` | `type`, `fromId`, `toId`, `creditAmount`, `pricePerCredit`, `totalValue`, `status` | General financial transaction log |
| `MemberPayout` | `userId`, `communityId`, `projectId`, `creditAmount`, `pricePerCredit`, `totalPayout`, `transactionId` | Farmer payout per project sale |

### Sun Token Models

| Model | Key Fields | Purpose |
|---|---|---|
| `SunToken` | `userId`, `totalEnergyProduced`, `totalEnergyConsumed`, `leftoverEnergy`, `tokensGenerated`, `tokensAvailable`, `tokensSold`, `balance` | Energy & token balance tracker |
| `SunTokenMarketListing` | `sellerId`, `sellerName`, `tokens`, `pricePerToken`, `totalValue`, `location`, `status` | Geo-located token listings |
| `SunTokenTransaction` | `buyerId`, `sellerId`, `listingId`, `tokenAmount`, `totalAmount`, `status`, `txHash` | Multi-step purchase pipeline |

### System Models

| Model | Key Fields | Purpose |
|---|---|---|
| `AuditLog` | `action`, `entityType`, `entityId`, `userId`, `metadata`, `txHash`, `previousHash`, `timestamp` | Immutable SHA-256 hash chain (16 action types) |
| `ReferralData` | `ownerId`, `code`, `referredCount` | Unique referral code tracker |

---

## 🔌 API Routes (47 Endpoints)

### 🔐 Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user (Individual / Company) |
| `POST` | `/api/auth/login` | Login with email/password, returns JWT cookie |
| `POST` | `/api/auth/logout` | Clear authentication cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |

### 👤 User Management (`/api/users/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/onboarding` | Complete farmer profile (land, practices, KYC) |
| `GET` | `/api/users/getprofile` | Fetch user's extended profile |
| `PUT` | `/api/users/updateprofile` | Update profile information |
| `POST` | `/api/users/list_on_market` | List credits on the individual marketplace |
| `GET` | `/api/users/marketplace` | Browse individual marketplace listings |
| `GET` | `/api/users/my_payouts` | Fetch user's payout history |

### 🤖 AI Endpoints (`/api/ai/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/individual_credits` | AI calculates & mints credits for single farmer |
| `POST` | `/api/ai/divide_community_crdits` | AI distributes credits across community members |
| `POST` | `/api/ai/suggestion` | Generate personalized farming/market suggestions |
| `POST` | `/api/ai/getclimatehistory` | Generate 5-year climate history PDF |

### 👥 Community (`/api/community/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/community/getcommunity` | List all communities |
| `GET` | `/api/community/getspecific_community` | Get single community details |
| `GET` | `/api/community/getspecific_community_memebers` | List community members |
| `GET` | `/api/community/get_specific_community_members_userprofile` | Get member profiles with user data |
| `GET` | `/api/community/getcommunitycredit` | Get community credit balance |
| `POST` | `/api/community/setcommunitymember` | Add member to community |
| `POST` | `/api/community/list_on_market` | List community credits on marketplace |
| `GET` | `/api/community/sale_transactions` | Fetch community sale records |
| `GET` | `/api/community/get_community_aggregator_proposal` | View incoming aggregator proposals |

### 🏛 Community Admin (`/api/communityadmin/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/communityadmin/onboarding` | Register new community |
| `GET` | `/api/communityadmin/getcommunityadmin` | Get admin profile |
| `PUT` | `/api/communityadmin/updatecommunitydata` | Update community information |
| `GET` | `/api/communityadmin/verifycommunityadmin` | Verify admin status |

### 🔗 Aggregator (`/api/aggregator/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/aggregator/onboarding` | Register as aggregator |
| `GET` | `/api/aggregator/verifyaggregator` | Verify aggregator status |
| `GET` | `/api/aggregator/get_marketplace_data` | Browse available community listings |
| `POST` | `/api/aggregator/aggregatordeal` | Create deal with community/individual |
| `POST` | `/api/aggregator/projects` | Create project bundle from deals |
| `GET` | `/api/aggregator/sold_projects` | View sold project history |
| `GET` | `/api/aggregator/analytics` | Get aggregator dashboard analytics |

### 🏢 Company (`/api/company/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/company/marketplace` | Browse aggregated projects |
| `POST` | `/api/company/buy_project` | Purchase a project (triggers payout cascade) |
| `GET` | `/api/company/totalaggregator` | List all aggregators  |

### ☀️ Solar / Sun Token (`/api/solar/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/solar/onboarding` | Register solar installation |
| `GET` | `/api/solar/profile` | Get solar profile |
| `POST` | `/api/solar/get-tokens` | Log energy production & generate tokens |
| `POST` | `/api/solar/list-tokens` | List tokens on marketplace |
| `GET` | `/api/solar/buyer/marketplace` | Browse available token listings (with geo data) |
| `POST` | `/api/solar/buyer/buy-token` | Purchase tokens (triggers multi-step pipeline) |

### 📋 Transactions & Audit (`/api/transactions/`, `/api/auditlogs/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions/all_transactions` | All platform transactions |
| `GET` | `/api/transactions/specific_transactions` | User-specific transactions |
| `GET` | `/api/auditlogs` | Query audit logs (filterable by userId) |

### 🎟 Referral (`/api/refferal/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/refferal` | Generate unique referral code |

---

## 🔄 User Roles & Flows

### Flow 1: Individual Farmer (Carbon Credits)

```
Register → Login → Onboarding (Land + KYC) → AI Credit Estimation
    ↓
Dashboard (View Credits, Audit Logs, AI Suggestions, Payouts)
    ↓
Option A: List credits on Individual Marketplace → Consumer buys P2P
Option B: Join a Community → Credits pooled → Aggregator bundles → Company buys
    ↓
Payout received → Balance updated → Audit log created
```

### Flow 2: Community Admin (Carbon Credits)

```
Register (role: communityadmin) → Login → Community Onboarding
    ↓
Dashboard (Members, Credits, Sales, Audit Logs)
    ↓
Add Members → Request AI Credit Distribution (per member land area)
    ↓
List credits on Community Marketplace → Review Aggregator Proposals
    ↓
Accept Deal → Aggregator bundles into Project → Company purchases
    ↓
Member Payouts auto-distributed → Audit chain updated
```

### Flow 3: Aggregator (Credit Bundling)

```
Register → Login → Aggregator Onboarding
    ↓
Dashboard (Analytics, Deals, Projects, Audit)
    ↓
Browse Community/Individual Marketplace → Send Deal Proposals
    ↓
Bundle accepted deals into Project → Set price per credit
    ↓
List Project on Corporate Marketplace → Company purchases
    ↓
Revenue distributed to community members (MemberPayout)
```

### Flow 4: Corporate Buyer (Carbon Credits)

```
Register (as Company) → Login
    ↓
Dashboard (ESG Progress, Purchase History, Audit Trail)
    ↓
Browse Aggregated Projects → Purchase Project
    ↓
Credits offset against footprint → Transaction recorded
    ↓
SHA-256 audit hash created → Payout cascade triggered
```

### Flow 5: Solar Seller (Sun Tokens)

```
Register → Login → Solar Onboarding (Address, Meter, KYC, Coordinates)
    ↓
Dashboard (Energy Stats, Token Balance, Sales, Audit)
    ↓
Log Energy Production → Tokens Minted (1 kWh = 1 Token)
    ↓
List Tokens on Geo-Marketplace (with price & location)
    ↓
Buyer purchases → Government Review Pipeline → Seller Payout
```

### Flow 6: Solar Buyer (Sun Tokens)

```
Register → Login → Solar Onboarding
    ↓
Dashboard (Purchase History, Spending, Audit)
    ↓
Browse Geo-Map Marketplace → Buy Tokens from nearby sellers
    ↓
Transaction created → Multi-step processing pipeline
```

---

## 🤖 AI Integration (Gemini)

EcoTrade uses **Google Gemini AI** (`gemini-1.5-pro`) for four core features, each with a deterministic fallback:

| Feature | Endpoint | How It Works | Fallback |
|---|---|---|---|
| **Individual Credit Estimation** | `/api/ai/individual_credits` | Gemini analyzes land area, soil type, farming practices, and crops to estimate CO₂ sequestration in tonnes | `1.5 credits/acre` + organic/regenerative bonus |
| **Community Credit Distribution** | `/api/ai/divide_community_crdits` | Gemini calculates total community credits, then distributes proportionally by member's land area | `1.5 credits/acre` flat rate |
| **Smart Suggestions** | `/api/ai/suggestion` | Gemini generates personalized farming recommendations based on user's profile, practices, and local conditions | 70+ curated suggestion bank across soil health, water management, biodiversity, market timing, and more |
| **Climate History Reports** | `/api/ai/getclimatehistory` | Gemini generates 5-year monthly climate data (temperature, rainfall, humidity, carbon sequestration) for any lat/lng, compiled into a downloadable PDF | Mock data generated with latitude-based climate modeling |

---

## 🔒 Security & Audit

### Authentication
- **JWT Tokens** stored as HTTP-only cookies (7-day expiry)
- **bcryptjs** password hashing with salt rounds
- Role-based access control across all API routes
- Token verification middleware on every protected endpoint

### SHA-256 Blockchain-Style Audit Trail
Every significant action creates an `AuditLog` entry with:
- **`txHash`** — SHA-256 hash of the current action's metadata
- **`previousHash`** — Hash of the last audit entry (creating an immutable chain)
- **16 tracked action types:** `credit_generated`, `credit_purchased`, `credit_verified`, `profile_updated`, `score_calculated`, `credit_listed`, `project_created`, `deal_accepted`, `transaction_completed`, `credit_distributed`, `aggregator_sale_completed`, `credit_sold_direct`, `individual_credit_listed`, `individual_credit_purchased`, `sun_token_listed`, `sun_token_purchased`

### Data Validation
- **Zod 4** for runtime request validation
- Mongoose schema-level validation with custom error messages
- Email regex validation, unique constraints, and enum enforcement

---

## 🖥 Pages & UI

| Page Route | Description |
|---|---|
| `/` | Landing page — Hero (video bg), About (how it works), Stats (animated counters), Solutions (features), Footer |
| `/login` | Login page with Individual/Company toggle, animated UI with GSAP |
| `/signup` | Registration with role selection, password visibility toggle |
| `/user/dashboard` | Full farmer dashboard — profile card with map, credit stats, audit logs, AI suggestions, referral system, payout history |
| `/user/onboarding` | Multi-field onboarding — land coordinates, soil type, crops, practices, KYC documents |
| `/user/getcarboncredit` | Trigger AI credit estimation and view results |
| `/user/marketplace` | Browse and list credits on individual marketplace |
| `/user/updateprofile` | Edit profile fields |
| `/community/dashboard` | Community overview — member list, credit balance, sales history, audit logs |
| `/community/onboarding` | Create new community with district, state, and practices |
| `/community/getcarboncredit` | AI-powered credit distribution across community members |
| `/community/communitymarketplace` | Community credit marketplace |
| `/aggregator/dashboard` | Analytics dashboard — deal count, total credits, value, active communities |
| `/aggregator/onboarding` | Aggregator registration |
| `/aggregator/marketplace` | Browse community/individual listings for deals |
| `/aggregator/project` | Create and manage bundled projects |
| `/company/dashboard` | Corporate dashboard — ESG offset progress, purchase history, audit trail |
| `/company/marketplace` | Browse and purchase aggregated projects |
| `/solar/seller/dashboard` | Energy production stats, token balance, sales history, audit |
| `/solar/seller/onboarding` | Solar installation registration with digital meter and coordinates |
| `/solar/seller/get-token` | Log energy production and mint Sun Tokens |
| `/solar/seller/sell-token` | List tokens on marketplace with pricing |
| `/solar/buyer/dashboard` | Purchase history, total spending, audit log |
| `/solar/buyer/onboarding` | Buyer registration for energy purchases |
| `/solar/buyer/marketplace` | Geo-located marketplace with Leaflet map to browse nearby token listings |

---

## 🔧 Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>

# Authentication
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or local MongoDB instance)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tushar598/newproject.git
cd newproject

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI, JWT secret, and Gemini API key

# 4. Run the development server
npm run dev

# 5. Open in browser
# Navigate to http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📋 Use Cases

### Use Case 1: Farmer Earning from Carbon Credits
> **Ramu**, a smallholder farmer in Madhya Pradesh, registers on EcoTrade. He completes onboarding with his 5-acre land details, documents organic farming practices, and uploads his soil test report. The AI estimates his carbon sequestration at **7.5 tonnes CO₂/year**, minting 7.5 credits. He lists them at ₹350/credit on the marketplace. A corporation purchases them — **₹2,625 is directly deposited** into Ramu's bank account.

### Use Case 2: Community Pooling for Corporate Deal
> **Sita**, a community admin, registers her 15-member farming group in Rajasthan. Each member completes onboarding. She triggers AI-powered community credit distribution — the AI analyzes the total 80 acres and distributes **120 credits** proportionally. An aggregator proposes to bundle these credits into a "Rajasthan Sustainable Agriculture" project at ₹400/credit. A multinational corporation purchases the project — **₹48,000 is distributed** to 15 farmers based on their individual contributions.

### Use Case 3: Solar Rooftop Owner Trading Energy
> **Vikram** installed a 5kW solar panel on his rooftop in Pune. He registers on EcoTrade's Sun Token marketplace, entering his digital meter number and installation coordinates. His panels generate 25 kWh/day; he consumes 18 kWh. The remaining **7 kWh becomes 7 Sun Tokens**. He lists them at ₹7.50/token. A nearby consumer buys them through the geo-map — the transaction goes through government review and Vikram receives **₹52.50 directly**.

### Use Case 4: Corporation Offsetting Carbon Footprint
> **GreenCorp Ltd.**, with an annual carbon footprint of 5,000 tonnes CO₂e, registers on EcoTrade. They browse aggregated projects and purchase 500 credits from the "Maharashtra Community Farming" project. Their dashboard shows they've offset **10% of their footprint**. Every purchase is SHA-256 hashed, creating a verifiable ESG compliance trail for regulatory reporting.

### Use Case 5: Consumer Buying Green Energy
> **Priya**, an environmentally conscious consumer in Delhi, wants to support local solar energy. She browses the Sun Token marketplace map, finds nearby sellers, and purchases 50 tokens (50 kWh equivalent). The multi-step government pipeline processes the energy transfer, and Priya receives confirmation that her purchase supports **50 kWh of renewable energy generation**.

---

## 🖼 Screenshots

> *The landing page features a full-screen video background with GSAP-animated headlines, feature cards, and scroll-triggered statistics. Dashboards feature real-time data cards, interactive maps, and comprehensive audit trail tables.*

---

## 🔮 Future Scope

- 📱 **Mobile App** — React Native version for on-the-go farmer access
- 🌐 **Blockchain Integration** — Move from SHA-256 hash chains to Ethereum/Polygon smart contracts
- 📡 **IoT Integration** — Direct smart meter API feeds for automated energy logging
- 🛰️ **Satellite Verification** — NDVI/satellite imagery for automated land practice verification
- 🏛️ **Government API** — Direct DISCOM integration for energy transfer approvals
- 📊 **ESG Reporting** — Automated ESG compliance report generation for corporates
- 🌍 **Multi-Language** — Hindi, Tamil, Telugu, and other regional language support
- 💳 **Payment Gateway** — Razorpay/UPI integration for real money transactions
- 🤝 **Biogas & Wind** — Extend Sun Token model to biogas plants and wind farms

---

## 📄 License

This project was built during the **.Execute Hackathon** (36-hour sprint) and is for educational/demonstration purposes.

---

<p align="center">
  <b>Built with 💚 by Team Hustlers at .Execute Hackathon</b><br/>
  <i>Tushar Singh Chouhan • Sheetal Pandey • Karan Verma</i>
</p>