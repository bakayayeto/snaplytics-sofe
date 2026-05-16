# How `svdpp_recommender_pipeline_dustin.svg` is built

Companion to [`svdpp_recommender_pipeline_dustin.svg`](svdpp_recommender_pipeline_dustin.svg). Step-by-step: SVG layout, animation, and how each number ties to `recommender/loader.py` plus the committed model.

---

## 1. Purpose

Shows two paths:

1. **Personalized:** bookings / ratings → **Surprise SVD++** → `recommend_for_user` → package ranking → **greedy addons** → ranked bundles (customer **235**, month **2026-03**).
2. **Fallback:** unknown user or no model → `_popularity_fallback`.

Numerics match **`recommender/models/surprise_model.pkl`** shipped in the repo (not a fresh random retrain).

---

## 2. File structure (how the SVG is assembled)

| Part | SVG element | Role |
|------|-------------|------|
| Canvas | `viewBox="0 0 920 1680"` | Tall page for five stacked sections + footer. |
| Styles | `<defs><style>` | `.t`, `.h`, `.s`, `.box`, `.hl` (highlight), `.fb` (fallback accent). |
| Arrow marker | `<marker id="marr">` | Same pattern as renewal SVG: vertical flow arrows. |
| Background | Full-size `<rect>` | Light gray-blue fill. |
| Title block | Two centered `<text>` | Title + subtitle (points at committed pickle + `train_ratings.csv`). |
| Sections 1–5 | Five `<g opacity="0">…</g>` | Each is one pipeline stage; inner `<animate>` fades group in. |
| Footer | One `<text>` | Replay / reproducibility note. |

---

## 3. Step-by-step: each `<g>` panel

### Section 1 — Bookings (concept + CSV)

- **Live path:** Django `Booking` + `BookingAddon`, statuses `Ongoing` / `BOOKED` (same constants as `recommender/service.py` / loader).
- **ETL path:** `recommender/data/merged_bookings.csv` and `booking_addons.csv`.
- **Explicit caveat:** shipped merged has **3** rows for customer **235**; your **five-session** story (incl. Mar 2026 Adore) is documented as not fully in that file. Month **2026-03** is still used for popularity tables so the diagram matches the “Adore in March 2026” scenario.

### Section 2 — Train SVD++

- Mirrors **`recommender/trainer.py`:** `Reader(rating_scale=(0,1))`, `Dataset.load_from_df`, `build_full_trainset()`, `SVDpp(...).fit`.
- **Prediction:** `algo.predict(u, i)` → **`loader.predict_est`**: raw items are package ids like `"2.0"` and addons as `"addon::7"`.
- **Trainset size** in subtitle (1397 users, 32 items): from loading the pickle once and reading `trainset.n_users` / `n_items` (approximate; diagram text is illustrative of “small item space”).

### Section 3 — `recommend_for_user`

- **`load_popularity_tables()`** → three CSV artifacts under `recommender/artifacts/`.
- **`prepare_month_tables_with_fallback("2026-03")`** → month-filtered package/addon/coocc tables; candidate package list for that month in the SVG.
- **`is_known_user(235)`** → True → personalized branch (not `_popularity_fallback`).
- **Package score0** = `predict_est(235, p) + get_user_package_history_pct(235, p)` (see `loader.py` loop before greedy).
- **Numbers** for score0: computed with the **committed** `surprise_model.pkl` and `merged_bookings.csv` for user 235 (e.g. Delight **2.0** ≈ **1.333333**, Ecstasy **1.0** ≈ **1.307336**, etc.).
- **Top-3 packages** passed to greedy: first three by that sort — **`["2.0","1.0","17.0"]`** for this scenario.

### Section 4 — Greedy + `subset_score_for_user`

- **Formula** copied from code:  
  `alpha * pkg_pred + (1-alpha) * sum(addon_preds) + 0.001 * cooc_sum - SIZE_PENALTY_MULT * n_addons + hist_pct`  
  with defaults `alpha=0.6`, `SIZE_PENALTY_MULT=0.25`.
- **Candidate list** for package **2.0**: from `candidates_for_package` (coocc first, then global addon popularity), order as in the SVG.
- **Greedy trace:** start empty subset score **0.933333**; each line is one accepted addon (marginal gain **> 0.01**), ending **1.536333…** with **`[2,7,8,6]`**.
- **Closed-form check** for final Delight bundle: `pkg_pred` and addon preds as shown, `cooc` sum **3**, penalty **1.0**, `hist` **1/3** → matches **1.5363333333333336**.
- **Other two packages** in top-3: Ecstasy and Adore lines list **their** greedy results and scores after the same pipeline.
- **Sort:** three `(package, addons)` tuples sorted by final subset score → Delight first.

### Section 5 — Popularity fallback

- **Condition:** `algo is None` **or** `not is_known_user(algo, user_id)` → `_popularity_fallback` in `loader.py`.
- **Example:** large fake `user_id` (**99999999**), same month → concrete list in SVG; scores are **package month counts** from the table (coarse, not SVD est).

---

## 4. How animation works (SMIL)

Each section `<g>` has its own:

`<animate attributeName="opacity" values="0;1" dur="..." fill="freeze" begin="..."/>`

| Section | `begin` | `dur` | Sequence |
|---------|---------|-------|----------|
| 1 Bookings | `0s` | `0.55s` | First |
| 2 SVD++ | `0.6s` | `0.55s` | Chain after 1 |
| 3 recommend_for_user | `1.2s` | `0.65s` | |
| 4 Greedy | `1.9s` | `0.7s` | Longest text |
| 5 Fallback | `2.6s` | `0.6s` | Last |

**Replay:** reload in browser. There is no `repeatCount` loop on these animates.

---

## 5. How to reproduce numbers locally

From repo root `Snaplytics/`:

```bash
python -m recommender.loader --user 235 --month 2026-03
```

Uses `load_model()`, `load_popularity_tables()`, and `recommend_for_user` as in production-style CLI.

If you **retrain** `surprise_model.pkl`, embeddings change → all `predict_est` and greedy results may drift; update the SVG + this MD after retrain.

---

## 6. Footnote in the SVG

The line under the top bundle states that greedy picks high `est` addons; numbers come from **committed** `surprise_model.pkl` (not a one-off retrain).
