# What Gets Saved to Supabase (Save Work)

When a user creates an account, **every input and decision** that goes through the project is stored. One row per user in the `projects` table; the `data` column holds the full project JSON. This doc lists every user-facing input and confirms it is persisted.

---

## When it saves

- **While signed in:** Every change that calls `updateProject()` is written to both localStorage and Supabase (no “Save” button required).
- **When they return:** On sign-in, the app loads their project from Supabase. If they had local data before signing in, that is migrated to Supabase once.

---

## Input-by-input audit

### Landing

| Input | Saved as | When |
|-------|----------|------|
| Address (hero autocomplete) | `property.address` | On “Get started” |
| Renovation budget (hero) | `onboarding.estimatedRenovationBudget` | On “Get started” |

### Onboarding

| Input | Saved as | When |
|-------|----------|------|
| First name | `homeowner.firstName` | On form submit |
| Email | `homeowner.email` | On form submit |
| Phone | `homeowner.phone` | On form submit |
| Address (autocomplete) | `property.address` | On form submit |
| Goal (More Space / Lifestyle / etc.) | `onboarding.goal` | On form submit |
| Timeline (ASAP / 3 mo / etc.) | `onboarding.timeline` | On form submit |
| Income (slider) | `onboarding.income` | On form submit |
| Mortgage rate | `onboarding.mortgageRate` | On form submit |
| Occupancy (Primary / Secondary / Investment) | `onboarding.occupancy` | On form submit |

### Property (Analysis – Your Property)

| Input | Saved as | When |
|-------|----------|------|
| Address (from API or display) | `property.address` | Auto when subject/address load |
| Beds, baths, sqft, year built, pool (from API) | `property.beds`, `.baths`, `.sqft`, `.yearBuilt`, `.pool` | Auto when subject loads |
| Manual edits (beds, baths, sqft, year built, pool) | Same | **Automatically on every change** (no “Done” required) |
| Current value, equity (from API) | `property.currentValue`, `property.equity` | Auto when subject loads |

### Wishlist (all categories)

| Input | Saved as | When |
|-------|----------|------|
| Bedroom count (+/−) | `wishlist.bedrooms` | On change (useEffect) |
| Bathroom count (+/−) | `wishlist.bathrooms` | On change |
| Each bedroom tile (Add / Renovate / Leave) | `wishlist.bedTiles` | On change |
| Each bathroom tile (Add / Renovate / Leave) | `wishlist.bathTiles` | On change |
| Bathroom scope (Full / Floors & fixtures / Cosmetic) | `wishlist.bathroomRenoScope` | On change |
| Kitchen level (Standard / Premium / Luxury) | `wishlist.kitchenLevel` | On change |
| Kitchen feature checkboxes | `wishlist.kitchenFeatures[]` | On change |
| Bathroom feature checkboxes | `wishlist.bathroomFeatures[]` | On change |
| Flooring (Hardwood / LVP / etc.) | `wishlist.flooring` | On change |
| Room features (Walk-in Closet, etc.) | `wishlist.roomFeatures[]` | On change |
| Interior details (Crown Molding, Fireplace, etc.) | `wishlist.interiorDetails[]` | On change |
| Home style (Modern / Traditional / etc.) | `wishlist.homeStyle` | On change |
| Exterior details (siding, windows, etc.) | `wishlist.exteriorDetails[]` | On change |
| Pool (None / In-ground / etc.) | `wishlist.pool` | On change |
| Outdoor features (patio, fire pit, etc.) | `wishlist.outdoorFeatures[]` | On change |
| Systems (HVAC, electrical, plumbing toggles) | `wishlist.systemsDetails[]` | On change |
| Special instructions (textarea) | `notes.specialInstructions` | On change |
| Derived totals from selections | `financial.totalCost`, `financial.totalValue` | On change (with wishlist) |

### Financial Analysis

| Input | Saved as | When |
|-------|----------|------|
| Monthly income | `financial.monthlyIncome` | On change (useEffect) |
| Monthly debts | `financial.monthlyDebts` | On change |
| Target budget | `financial.targetBudget` | On change |
| Current monthly payment (P&I) | `financial.currentMonthlyPayment` | On change |
| Down payment at purchase | `financial.downPaymentAtPurchase` | On change |
| Existing mortgage balance | `financial.existingMortgageBalance` | On change |
| Line item toggles (each scope item on/off) | `financial.enabledLineItemIds[]` | On change |
| “Extra $/month” slider | `financial.paymentSlider` | On change |
| Derived totals | `financial.totalCost`, `financial.totalValue` | On change |

### Feasibility

No separate form: it reads from `financial`, `onboarding`, `property`. All decisions there are the same line-item toggles and numbers persisted in Financial Analysis.

### Contractor Review

| Input | Saved as | When |
|-------|----------|------|
| Contractor name | `contractor.contractorName` | On submit |
| Company name | `contractor.companyName` | On submit |
| License number | `contractor.licenseNumber` | On submit |
| Bid amount | `contractor.bidAmount` | On submit |
| Estimated weeks | `contractor.estimatedWeeks` | On submit |
| Agreed timestamp | `contractor.agreedAt` | On submit |

---

## Optional / not-yet-entered values

- Any field the user never fills is simply absent or default in the saved JSON (e.g. `contractor` only exists after they complete Contractor Review). Loading from Supabase restores that same shape; the app uses defaults for missing keys.

---

## Summary

- **Landing:** 2 inputs → persisted on “Get started”.
- **Onboarding:** 9 inputs → persisted on form submit.
- **Property:** Address + API-derived fields auto-saved; manual edits (beds, baths, sqft, year built, pool) auto-saved on every change.
- **Wishlist:** All room counts, tiles, categories, feature arrays, and notes → persisted on change.
- **Financial:** All numeric inputs, line-item toggles, and payment slider → persisted on change.
- **Contractor:** All sign-off fields → persisted on submit.

So yes: every input and decision that exists in the app is stored in the project and synced to Supabase when the user is signed in, and is ready when they return.
