# Homeowner Input Audit — Contractor, Lender, Architect

This document lists every input the app collects from the homeowner and how it is used for **contractor** (full SOW + stamp), **lender** (approval), and **architect** (design/CAD).

---

## 1. Landing

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| Property address | `property.address` | ✓ SOW, site | ✓ Collateral | ✓ Site |
| Estimated renovation budget | `onboarding.estimatedRenovationBudget` | ✓ Budget context | ✓ Affordability | ✓ Scope |

---

## 2. Onboarding

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| First name | `homeowner.firstName` | ✓ Contracts | ✓ Borrower | ✓ Client |
| Email (optional) | `homeowner.email` | ✓ Contact | ✓ Contact | ✓ Contact |
| Phone (optional) | `homeowner.phone` | ✓ Contact | ✓ Contact | ✓ Contact |
| Property address | `property.address` | ✓ SOW | ✓ Collateral | ✓ Site |
| Household income | `onboarding.income` | — | ✓ DTI | — |
| Current mortgage rate | `onboarding.mortgageRate` | — | ✓ Refi/terms | — |
| Goal (space / lifestyle / modern / major) | `onboarding.goal` | ✓ Scope intent | — | ✓ Design intent |
| Timeline (ASAP / 3 mo / 6+ / dreaming) | `onboarding.timeline` | ✓ Schedule | ✓ Draw schedule | ✓ Phasing |
| Occupancy (primary / secondary / investment) | `onboarding.occupancy` | — | ✓ Loan eligibility | — |

---

## 3. Analysis — Property

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| Beds, baths, sqft, year built, pool | `property.*` | ✓ SOW, dimensions | ✓ Valuation | ✓ As-built / scope |
| Current value / equity (from API or edit) | `property.currentValue`, `property.equity` | — | ✓ LTV, collateral | — |

---

## 4. Analysis — Wishlist (all persisted to `wishlist`)

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| Bedrooms count | `wishlist.bedrooms` | ✓ SOW | ✓ Scope | ✓ Program |
| Bathrooms count | `wishlist.bathrooms` | ✓ SOW | ✓ Scope | ✓ Program |
| Per-room: add / renovate / leave | `wishlist.bedTiles`, `bathTiles` | ✓ Room-by-room SOW | — | ✓ Room matrix |
| Bathroom reno scope (full / floors & fixtures / cosmetic) | `wishlist.bathroomRenoScope` | ✓ Materials & finishes | — | ✓ Specs |
| Kitchen level (Standard / Mid / Premium / Luxury) | `wishlist.kitchenLevel` | ✓ Materials & finishes | — | ✓ Specs |
| Kitchen appliances & features (checkboxes) | `wishlist.kitchenFeatures` | ✓ Materials & finishes | — | ✓ Specs |
| Bathroom fixtures, tile, features (checkboxes) | `wishlist.bathroomFeatures` | ✓ Materials & finishes | — | ✓ Specs |
| Flooring type | `wishlist.flooring` | ✓ Materials & finishes | — | ✓ Specs |
| Interior details (crown molding, etc.) (checkboxes) | `wishlist.interiorDetails` | ✓ Materials & finishes | — | ✓ Specs |
| Room features (walk-in closet, etc.) (checkboxes) | `wishlist.roomFeatures` | ✓ Materials & finishes | — | ✓ Program |
| Home style | `wishlist.homeStyle` | ✓ Exterior SOW | — | ✓ Design |
| Exterior siding, windows, doors (checkboxes) | `wishlist.exteriorDetails` | ✓ Materials & finishes | — | ✓ Specs |
| Pool (None / Basic / Standard / Luxury) | `wishlist.pool` | ✓ SOW | — | ✓ Site |
| Yard & landscaping (checkboxes) | `wishlist.outdoorFeatures` | ✓ SOW | — | ✓ Site |
| HVAC, electrical, plumbing (checkboxes) | `wishlist.systemsDetails` | ✓ SOW, MEP | — | ✓ MEP scope |
| Special instructions (free text) | `notes.specialInstructions` | ✓ SOW section 2b | — | ✓ Constraints |

---

## 5. Analysis — Financial

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| Monthly household income | `financial.monthlyIncome` | — | ✓ DTI | — |
| Current monthly debts | `financial.monthlyDebts` | — | ✓ DTI | — |
| Existing mortgage balance (optional) | `financial.existingMortgageBalance` | — | ✓ Eligibility | — |
| Target budget (optional) | `financial.targetBudget` | ✓ Budget context | ✓ Amount to fund | — |
| Line items enabled | `financial.enabledLineItemIds` | — | ✓ Scope value | — |
| Total cost / total value (derived) | `financial.totalCost`, `totalValue` | ✓ SOW value | ✓ Loan amount | ✓ Budget |

---

## 6. Contractor Review (contractor-filled)

| Input | Stored in project | Contractor | Lender | Architect |
|-------|-------------------|------------|--------|-----------|
| Total fixed-price bid | `contractor.bidAmount` | ✓ Contract | ✓ Amount to fund | — |
| Estimated weeks | `contractor.estimatedWeeks` | ✓ Schedule | ✓ Draw schedule | ✓ Phasing |
| Contractor name, company, license | `contractor.*` | ✓ Signature | ✓ Vendor | — |

---

## Downstream use

- **Contractor**  
  - SOW: scope summary + **Materials & Finishes** (from `wishlist` + `notes.specialInstructions`) + exclusions/allowances.  
  - Prefill bid from `financial.totalCost`.  
  - Stamp = agreement to SOW + fixed price + milestones.

- **Lender**  
  - Approved Project Plan (Golden Record): project ID, borrower (name, email, phone, occupancy), property, financial terms, contractor verification, signatures.  
  - Uses income, debts, occupancy, existing mortgage balance, and contractor bid for eligibility and loan amount.

- **Architect / CAD**  
  - Same project record: address, property dimensions, room counts and per-room intent, all wishlist selections (materials, features, systems), special instructions.  
  - Design Package and any CAD export can be driven from this single source of truth.

All inputs above are persisted to the single **project** (localStorage) and flow into Design Package, Contractor Review, and Approved Project Plan so contractor, lender, and architect have one defensible record.
