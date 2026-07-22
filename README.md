<div align="center">
  <img src="public/Logo dark.png" alt="DIM logo" width="96" />

  # Direct Inventory Manager (DIM)

  **A web-based pharmacy inventory, expiry risk, and stock transfer management system**
  built for Direct Pharmacy's Adenta and Haatso branches.
</div>

---

## About

Direct Pharmacy currently tracks stock by hand across its Adenta and Haatso branches.
That makes it hard to know what's actually on the shelf, easy to lose track of medicines
nearing expiry, and error-prone whenever stock moves between branches. DIM replaces the
manual process with a single system both branches share, so stock levels, expiry risk,
and transfers are visible in one place instead of two notebooks.

This repo is the **frontend** — a Next.js + TypeScript + Tailwind CSS application. It talks
to the [DIMS_BACKEND](https://github.com/Direct-Pharm-Inventory-Manaement/DIMS_BACKEND) API,
which owns the database and business logic.

## Core features

| Module | What it does |
|---|---|
| **Inventory Management** | Add, update, and remove medicines; view live stock levels per branch |
| **Expiry Risk Monitoring** | Flags medicines approaching expiration; dashboard of at-risk stock |
| **Stock Transfers** | Create, approve, or reject transfer requests between Adenta and Haatso; stock updates automatically on confirmation |
| **Transfer History** | Full audit log of every transfer — source, destination, quantities, timestamps |
| **Low-Stock Prediction** | Estimates when a product will run out based on recent usage/sales |
| **Reporting Dashboard** | Total stock, low-stock items, expiring items, pending transfers, at-a-glance summaries |
| **User Management** | Administrator and pharmacy staff roles with role-based access control |

Out of scope by design: online sales, payment processing, and integration with external
pharmacy/supplier software — this is an internal operations tool, not a storefront.

## Tech stack

- **Frontend** (this repo): Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Express, TypeScript ([DIMS_BACKEND](https://github.com/Direct-Pharm-Inventory-Manaement/DIMS_BACKEND))
- **Icons**: real icon set (Lucide), no emoji/placeholder glyphs
- **Auth**: role-based access control (Administrator / Pharmacy Staff)

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app expects the backend running
and reachable at `NEXT_PUBLIC_API_URL` (see `.env.local.example`) — start
[DIMS_BACKEND](https://github.com/Direct-Pharm-Inventory-Manaement/DIMS_BACKEND) alongside it.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — lint the codebase

## Status

Early build-out. Both repos are scaffolded and wired to talk to each other; feature
modules (inventory, transfers, expiry dashboard, reporting, auth) are being built against
the project proposal and UI designs as they come in — nothing above is live yet.

## Engineering conventions

- Real icon libraries, not inline emoji or placeholder SVGs
- Purposeful loading states — skeletons for content, scoped spinners for in-flight
  actions, disabled/pending button states — not a single global spinner
- Typed API layer shared between frontend and backend; no implicit `any`
- Design tokens (color, spacing, type) sourced from the UI designs, not improvised per component
