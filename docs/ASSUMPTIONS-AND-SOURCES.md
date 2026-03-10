# Assumptions, Sources, and How to Keep the Math Accurate

This doc explains where the app’s numbers come from, how key calculations work, and how to keep them consistent and defensible for contractor/lender tie-out.

---

## 1. Where the numbers came from (current state)

**Cost and ROI inputs are not from a single external source.** They are **built-in, directional estimates** hardcoded in:

| Location | What it defines | Use |
|----------|------------------|-----|
| `PropertyWishlist.tsx` | `calculateCosts()` (kitchen tiers, flooring, pool, beds/baths), `COMPONENT_ESTIMATES` (features, style) | Wishlist totals, value-add, ROI %, “Save $X/mo” |
| `FinancialAnalysis.tsx` | `DEFAULT_LINE_ITEMS`, `CURRENT_HOME_VALUE`, `RATE_ANNUAL` | Analysis totals, DTI, payment (separate from Wishlist) |
| `landing/ProjectBuilder.tsx` | Add/reno line items (e.g. kitchen 85k, pool 95k) | Landing budget min/max |
| `FeasibilityGrid.tsx` | Hardcoded monthly payment numbers | Feasibility summary |

So today:

- There is **no cited source** (e.g. Remodeling Cost vs. Value, RSMeans, local contractor data).
- **Different screens can use different constants** (e.g. `CURRENT_HOME_VALUE` 800k in Wishlist vs 2.7M in FinancialAnalysis), so **totals may not tie** across the app.

For lender/contractor tie-out you want **one source of truth** for:

- Current home value (from project/property or API)
- Renovation cost and value-add (from one set of cost/ROI tables or from contractor bid)
- Mortgage balance, rate, term
- Market rate for “comparable” comparison

---

## 2. Key formulas

### 2.1 Monthly “Save $X/mo vs. comparable home”

Used in **PropertyWishlist**:

- **Your payment after reno**  
  P&I on `(existing mortgage balance + total renovation cost)` at **your rate** (onboarding), 30-year term.

- **Comparable payment**  
  P&I on `80% of post-renovation value` at **market rate** (6.8% in code), 30-year term.

- **Monthly savings** = Comparable payment − Your payment.

So “savings” is: *“How much lower is your payment than someone who bought this same (post-reno) home at 80% LTV and today’s rate?”*

Important:

- In **Financial Analysis**, the user can enter their **current monthly mortgage payment (P&I)**; we derive existing balance from that plus their rate (onboarding) and 30-year term, for a more accurate “savings vs. comparable” number. They can optionally override with “Existing mortgage balance” or “Down payment at purchase” for context.
- If **existing mortgage balance** is missing and no current payment is given, the app uses an **estimated balance** (e.g. 75% LTV of current value) so the comparison is more realistic.
- The number is **very sensitive** to existing balance and your rate. Same reno can show very different “savings” for different users.

### 2.2 Post-renovation value

- `postRenovationValue = currentValue + totalValue`
- `totalValue` = sum over line items of `cost × ROI` (from the same cost/ROI tables used for `totalCost`).

### 2.3 Constants (as of this doc)

| Constant | Value | Where |
|----------|--------|--------|
| Term | 30 years | PropertyWishlist, FinancialAnalysis |
| Market rate (comparable) | 6.8% | PropertyWishlist |
| Default current home value | $800,000 | PropertyWishlist (when property API not used) |
| LTV for “comparable” | 80% | PropertyWishlist |

---

## 3. How to keep math up to date and accurate

1. **Single source of truth**
   - Prefer one shared module (e.g. `src/constants/renovationDefaults.ts` or `src/config/costsAndRoi.ts`) for:
     - Default current value, term, market rate, LTV
     - Cost and ROI by category (kitchen tier, flooring, pool, etc.) and by feature (component estimates).
   - Have Wishlist, Financial Analysis, and any landing calculators **read from that module** (and from project/API when available) so totals tie.

2. **Document and refresh sources**
   - In that module (or this doc), record:
     - **Source** for each cost/ROI (e.g. “Remodeling 2024 Cost vs. Value”, “Internal Phoenix-area averages”, “TBD”).
     - **Last updated** date.
   - Plan a refresh (e.g. yearly) and after major product changes; update the single source and redeploy.

3. **Prefer real inputs over defaults**
   - **Current value**: Use property API or user edit when possible; avoid different default values in different screens.
   - **Existing mortgage balance**: Collect in Financial (and optionally earlier). When missing, the app uses an **estimated** balance (see code) so “Save $X/mo” is not overstated.

4. **Tie-out checklist**
   - [ ] One place defines default home value, term, market rate, LTV.
   - [ ] One place (or one flow) defines cost and value-add per scope; Design Package and Contractor Review use the same scope and numbers.
   - [ ] Contractor bid can replace estimated cost when available; lender sees the same scope and bid.
   - [ ] “Monthly savings” uses the same existing balance, rate, and post-reno value as the rest of the analysis.

---

## 4. Confidence and caveats

- **Formulas**: The P&I and “comparable” logic are consistent; the main risk is **inputs** (balance, value, rate) and **wording** (“vs. comparable home” can be misread as “savings from doing the reno” instead of “vs. buying that same home at 80% LTV at today’s rate”).
- **Cost/ROI**: Until tied to a documented source (and optionally regional or contractor data), treat as **directional**. For loan decisions and contractor bids, replace with actual appraisal and bid when possible.
- **Tie-out**: Safe only if all screens and exports use the same constants and the same scope/cost/value (single source of truth above).

---

## 5. Where to change things in code

| Goal | File(s) to touch |
|------|-------------------|
| Change default home value, term, market rate, LTV | PropertyWishlist (summaryMetrics), and any shared constants you add |
| Change cost/ROI for kitchen, flooring, pool, etc. | PropertyWishlist `calculateCosts()` and `COMPONENT_ESTIMATES` |
| Align Financial Analysis totals with Wishlist | FinancialAnalysis: feed from same cost/ROI and project property value |
| Change “comparable” logic (e.g. LTV or rate) | PropertyWishlist `summaryMetrics` (comparableLoanAmount, comparablePayment) |
| Make “Save $X/mo” behave when balance unknown | PropertyWishlist: `existingBalance` fallback (see implementation) |

Adding a single `src/constants/` (or `config/`) module and importing it in these places will make future updates and tie-out much easier.
