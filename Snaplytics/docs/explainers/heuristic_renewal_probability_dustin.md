# How `heuristic_renewal_probability_dustin.svg` is built

Companion to [`heuristic_renewal_probability_dustin.svg`](heuristic_renewal_probability_dustin.svg). Step-by-step: what is inside the SVG, how it is structured, and how each number is produced.

---

## 1. Purpose

The SVG is a **static diagram with timed fades** (SMIL). It shows the pipeline:

`raw bookings` → `Renewal row fields` → `heuristic_renewal_probability()` → **final probability**.

Logic matches `Snaplytics/backend/renewal_utils.py` (`recompute_customer_renewal_profile` then `heuristic_renewal_probability`).

---

## 2. File structure (how the SVG is assembled)

| Order | Element | Role |
|--------|---------|------|
| Root | `<svg viewBox="0 0 900 1260">` | Canvas size; all coordinates are in user units. |
| `<defs>` | `<style>` | CSS classes: `.t` body, `.h` headings, `.s` small print, `.box` card, `.accent` for final result. |
| `<defs>` | `<marker id="arr">` | Arrowhead used on vertical connectors (`marker-end="url(#arr)"`). |
| Background | `<rect width="100%" height="100%">` | Full-bleed gray fill. |
| Title | Two `<text>` centered at x=450 | Title + subtitle (as-of date note). |
| Panels | Four `<g>` groups | Each panel is a logical “step”; starts at `opacity="0"` and fades in via `<animate>`. |

No external images or fonts: only system-ui stack in `font-family` on root `<svg>`.

---

## 3. Step-by-step: what each panel shows

### Panel `step1` (raw bookings)

- **Rounded box** (`class="box"`): visual container.
- **Five lines**: the Dustin scenario you specified (dates, package names, PHP totals).
- **Footer line** (`class="s"`): sum **3115**, **n = 5**, and that sorted unique dates yield at least one pair with gap **1..366** days → `renewed_within_366 = True` (same boolean rule as `recompute_customer_renewal_profile`).

### Panel `step2` (Renewal aggregates)

- **Arrow** from step1: `path` + `marker-end` → reads as “feeds into”.
- **Fields** mirror what `recompute_customer_renewal_profile` writes on `Renewal`:
  - `total_bookings = 5`
  - `avg_booking_value = 3115 / 5 = 623.0`
  - `booking_frequency`: count of session dates **≥ (as_of_date − 365 days)**. Subtitle fixes **as_of_date = 2026-05-16** → lower bound **2025-05-16** → only **2026-03-03** counts → **1**.
  - `renewed_within_366`: **True** (from step1).
  - `total_spent`, `preferred_package_type`: short notes (preferred type comes from mode of `package__category` in real code).

### Panel `step3` (heuristic formula)

- **Line-by-line** matches `heuristic_renewal_probability(renewal)`:

  - `base_prob = 0.05`
  - `+ min(booking_frequency / 8, 0.4)` → `min(1/8, 0.4) = 0.125`
  - `+ min(total_bookings / 10, 0.25)` → `min(0.5, 0.25) = 0.25`
  - `+ min(avg_booking_value / 15000, 0.15)` → `623/15000 ≈ 0.0415333…`
  - `+ 0.15` if `renewed_within_366`
  - **Raw sum** `0.6165333333333333`
  - **Final** `max(0, min(raw, 0.99))` → unchanged (below 0.99); **~0.6165** at 4 dp.

### Panel `bar` (contribution stack)

- **Five rectangles**: heights proportional to the five positive terms (0.05, 0.125, 0.25, ~0.042, 0.15). Labels under each bar.
- **Caption**: confirms sum &lt; 0.99 so clamp does not cut the value down.

---

## 4. How animation works (SMIL)

Each panel `<g>` contains:

```xml
<animate attributeName="opacity" values="0;1" dur="..." fill="freeze" begin="..."/>
```

| Group | `begin` | `dur` | Effect |
|--------|---------|-------|--------|
| `step1` | `0s` | `0.6s` | Fades in first. |
| `step2` | `0.7s` | `0.6s` | Starts after step1 finishes. |
| `step3` | `1.4s` | `0.8s` | Longer read for formula. |
| `bar` | `2.2s` | `0.5s` | Bar chart last. |

`fill="freeze"` keeps opacity at **1** after the animation. **Replay:** reload the file in a browser (SMIL does not loop here).

---

## 5. How to edit or verify numbers

1. Change dates/prices in **step1** → recompute sum, average, trailing-year count, and `renewed_within_366` by hand or with a small script.
2. Update **step2** fields to match.
3. Recompute **step3** terms from `renewal_utils.heuristic_renewal_probability` (or paste values from a Django shell after `recompute_customer_renewal_profile(customer)`).
4. Adjust **bar** rectangle heights if you want strict proportionality (optional visual tweak).

---

## 6. Production vs explainer

- **Production** `booking_frequency` uses `timezone.now().date() - timedelta(days=365)` (rolling “today”).
- **This SVG** pins **today = 2026-05-16** so the diagram stays stable in docs.

That is the only intentional deviation; the formula and caps are the same as in code.
