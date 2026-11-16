# Token Radar — top-15 references for rank 15 (researcher, Mon 2026-11-16 ~18:05 WIB)

## Method

- Fresh leaderboard fetch 2026-11-16 ~18:05 WIB: **6,088 entries** (was 6,046 at 17:40).
  Top 15 UNCHANGED (same handles, same judge scores). All top 20 are 20W-0D-0L.
- All 15 artifacts downloaded from `https://make.fun/api/submissions/<id>/artifact.webp?phase=dev&v=<hash>`
  and **viewed with my own eyes**. Files kept at `top-radar/r01-…r15-*.webp`
  (workspace, not /tmp — /tmp was wiped by a VM replacement mid-task; re-downloads
  were byte-identical, so the observations below are from the same artifacts).
- Our side: radar-4 (submission 01a1e400, submitted 17:57 WIB, NOT graded yet).
  Rebuild 01a1e365: rank 1,875, judge 897,299, 12W-0D-0L provisional.
  Read: DIAGNOSIS_R15.md, MODEL_NOTES_R4.md, IMPROVEMENT_STATUS_R15.md,
  `repo/screenshots/1-board.png` (viewed), `repo/dashboard/index.html`.
- Note: the artifact is the dossier screenshot (the board page). The judge compares
  entries pairwise on screenshots + source outline, so everything below is about
  what the BOARD shows, not about hidden code.

## The headline finding: value level, verdicts, gas and board size do NOT drive rank

Across the top 15, the numbers that "should" matter vary wildly with no pattern:

| thing | range across top 15 | ours (radar-4) |
|---|---|---|
| Steakhouse implied value | **$31.2M (r06) – $126M (r03)** | $85.4M |
| Sentora implied value | $41.4M (r06) – $117M (r03) | $84.6M |
| top-row verdicts | all SKIP (r06, r13) to all FARM (r14) | THIN/SKIP on top rows |
| FARM count | 60 (r14) – 165 (r10) | 122 |
| SKIP count | 8 (r03) – 65 (r14) | 57 |
| gas/fees | ~$1.50 total (r03) – $48 Ethereum (r08) | $60 Ethereum (5 txns) |
| board rows | 165 (r04) – 198 (r03, r06, r08, …) | 198 |
| LOO median miss | **x2.63 (r11) – x4.08 (r13)** | x3.60 |
| time-split within-3× | 43% (r13 LOO) – 56% (r13 time-split) | 51.0% |
| theme | dark (r02, r04, r07, r12, r13, r14) and light (r01, r03, r05, …) | dark |

Two entries make the point sharply:

- **Rank 13 (boge) has a WORSE LOO than our radar-4** (x4.08 / 43% vs ours x3.60 /
  45.3%) and top rows that are all SKIP at −$20.55, yet it is rank 13 while our
  rebuild is 1,875. Its time split is better (x2.45 / 56% vs ours x2.99 / 51.0%),
  but the point stands: the rating is NOT a function of any single reported number.
- **Rank 7 (sudhan) has Steakhouse at $31.8M and Gauntlet at $25.3M** — the lowest
  top values in the top 15 — and is still rank 7. Value level is not the driver.

Conclusion: radar-4 closed the MODEL gap (its reported backtests are now mid-pack
among the top 15). What remains is **dossier completeness** — the extra columns,
verdict tiers, and honesty features the top entries show and we don't — plus
**match count** (we are 12-0 provisional; they are all 20-0, so part of our gap is
rating shrinkage toward the prior, not dossier quality).

## Per-entry notes

### Rank 1 — nightshift-labs, "Launchscope" (judge 962,052, 20-0)
- Board **181** (not 198), 128 fit tokens, 161 set aside. Light theme.
- Self-verification panel (green): "✓ board.json = this page — buildRadar re-run in
  your browser: 181/181 ranks, 181 values, 181 bands, 181 verdicts and nets match".
- Formula: log10 value = 7.25 + 0.52·log10(TVL/$100M); family ×0.54–1.61;
  growth 1+0.5×change clamped ×0.8–1.25; seasoning 1−0.4·e^(−days/240)
  (≈0.91× at 1 yr, ≈0.99× at 5 yr — nearly 1, never a haircut).
  Bands: **P25–P75 over 200 bootstrap refits** + the protocol's own miss.
- Backtest: LOO 3.2× median miss vs 4.8× flat; 48% within 3×; rank corr. 0.38.
  "The tilts move 104 of 181 ranked 5+ places."
- **BREAK-EVEN ODDS column** (69%, 74%, 51%, 48%, 19%, 56%, 25%, 59%) +
  **NET IF LAUNCH $/HOUR** column ($4.55, $3.67, $9.72, $9.67, $60, $9.11, $72, $35).
- Verdicts: Worth farming 57 / Marginal 80 / Skip 44 — top rows mostly Skip/Marginal.
- Best net per hands-on hour: Firelight $54/h · Noble $42/h · Tulipa $38/h.
- **Traded anchors as reference rows in the board** ("22 traded anchors · sorted by
  implied value"; a row "Portal · trades — Bridge · reference, not ranked — market
  cap $66.6M — market 0.05× TVL · our curve would say $105M").
- Category filter chips with counts (Lending & CDP 26, Trading 30, Vaults & yield 87…).
- Top values: Steakhouse $80.0M (P25–P75 $21.2M–$232M), Sentora $79.2M,
  Gauntlet $62.1M, Veda $58.4M, Polymarket $47.3M.
- **Copy:** break-even odds column; P25–P75 bands; best-per-hour hero line;
  self-verification panel (we already have a verify line — theirs is more specific).

### Rank 2 — calm-owl-82, "Launch Radar" (judge 962,052, 20-0, tied rank 1)
- Board **192**, 101 traded tokens (comps), 150 set aside. Dark theme.
- Formula: value = 10^7.18 × (TVL/$100M)^0.550 × family × growth × seasoning × **sibling**.
- Backtest: blind miss x3.16 vs x4.89 flat; time split (fit pre-2024, test 66 newer)
  x3.43 vs x4.84 flat; within 3× 49% vs 37% flat; inside blind 50%/80% band 50%/78%.
- Best net per hands-on hour: Tori Finance +$4.35/h · Axis +$4.08/h · Firelight +$1.52/h.
- Board columns: #, PROTOCOL, TVL, 7D, NO TOKEN FOR, IMPLIED VALUE · P10 TO P90,
  $1.0K SLICE, NET OF ALL COSTS, FARM · FEES · HOLD.
- Farm plan text per row: "SKIP -$14.96 · never beats a T-bill · $4.48 fees · 120d
  hold · 2.5h work".
- Verdicts: FARM 119 / THIN 60 / SKIP 13. Top values: Sentora $73.6M, Steakhouse
  $71.5M, Polymarket $58.4M, Gauntlet $57.3M, Veda $49.4M.
- **Copy:** sibling factor (see §"sibling/kinship"); per-row farm-plan sentence
  (we have the same data, ours is shown as separate columns, not a sentence).

### Rank 3 — ronigrv, "Launch Radar" (judge 961,255, 20-0)
- Board 198, 119 traded tokens, 144 set aside. Light theme.
- Formula: value = 10^3.38 × TVL^0.472 × category × momentum(7d) × seasoning(days
  with no token) × **sibling**.
- Scatter with band ±/6.5; LOO within 3× 45%, within 10× 78%; OOS median miss x3.8
  vs x5.0 flat; within 3× 43% vs 34%.
- Best per hands-on hour: Tulipa Capital +$25.93/h · Clearstar +$10.71/h ·
  K3 Capital +$8.58/h.
- Verdicts: **FARM 152 / THIN 38 / SKIP 8** — the most generous distribution in
  the top 15. Fees ~$1.50 total (very low gas model).
- **Top values are the HIGHEST in the top 15: Steakhouse $126M, Sentora $117M,
  Gauntlet $101M**, Polymarket $59.2M. (Level does not drive rank — see rank 7.)
- Chips: "128 traded token families kept apart, they price the curve; 144 set aside
  wrapped, staked, bridged, exchange or versioned".
- Filters include "All / Watchlist / Early / **Sibling-linked**".
- **Copy:** sibling factor; the "best per hour" hero (ours lacks a hero per-hour line).

### Rank 4 — tidy-meteor-25, "Launch Radar" (judge 961,255, 20-0)
- Board **165** (40 watchlist + 125 found beside it) + **Early finds 37** (off list;
  new ≤180d or rising). 416 tokened, 177 set aside. Dark theme.
- Hero: "Worth farming at plan size 71 (the drop beats the gas by $5 an hour)".
- Formula: 10^3.2737 × TVL^0.452 × peers (category gap, shrunk) × momentum
  1+0.5×7-day change ±40% × record 0.70–1.00 over 2 yr × breadth +3% a chain (up
  to 10) × **kin ×0.5 if its kin's token trades**.
- Backtest: OOS median miss x2.93 vs x4.51 flat; "Shrinkage 20 pseudo-peers: the
  least miss of 3, 5, 8, 12, 20, 40" — shrinkage tuning shown.
- **"FARM NEXT" sidebar** — best farm opportunities ranked by net/hour:
  Theo Network +$50.58 ($16.86/h), FstSwap +$43.44 ($16.29/h), Qearn +$42.28,
  Estate Protocol +$39.60. An answer-first list.
- Board: "Drop / $1k" column ($2.40–$11.35); verdicts "skip -$4.12 · Base · $1,000 ·
  8 wk" (chain + capital + hold weeks inline).
- Top values (LOW): Steakhouse $66.2M, Gauntlet $52.5M, Veda $50.7M, USDD $36.9M.
- Honesty line: "This radar's own claim: not make fun's, and no forecast for a
  launch. 'Records no token' is DefiLlama's record, not proof that none exists."
- **Copy:** FARM NEXT list (same data as our best-per-hour line, but as a ranked
  sidebar); kin factor; breadth factor (already tested by us, did not beat V12).

### Rank 5 — sprydd, "Launch Ledger" (judge 958,843, 20-0)
- Board **192**, 152 early finds, 416 tokened, 150 set aside. Light theme.
- Formula framed as TVL × multiple: "compsMultiple: log mcap/TVL of the 128 snapshot
  protocols whose token trades, fitted as a level (×0.165 at $100M), a size slope
  (−0.045 per decade of TVL) and family/category effects shrunk to their parent with
  4 pseudo comps. growthFactor: 1+0.75×7-day change (clamped −40% to +60%).
  ageFactor: 0.55 rising to 1.00 after 730 days. **No name is special-cased.**"
- Tabs: Pre-token board 192 / Token already trades 128 / Set aside 150 /
  Model & calibration 128.
- Board columns: #, PROTOCOL, TIER, TVL, 7D TVL, NO TOKEN FOR, **COMPS ×**,
  IMPLIED VALUE · P25–P75, AIRDROP / $1K, **FARM ON**.
- **COMPS × column** (0.35×, 0.035×, 0.044×, 0.27×…) — the fitted mcap/TVL multiple
  per row. **FARM ON column** (Polygon, Base, Solana, BSquared, Binance, Arc) —
  the chain to farm on.
- TIER badges: ABOVE FLOOR / WATCHLIST. "Early finds 152 off the watchlist,
  138 below $50M".
- Top values: Polymarket $112.0M, Steakhouse $83.2M, Sentora $78.0M, Gauntlet $64.7M.
- **Copy:** COMPS × column (trivial: implied/TVL); FARM ON column (cheapest chain
  per row — we have per-chain gas, we can pick the min); early-finds tab.

### Rank 6 — fikril07, "Unminted" (judge 958,033, 20-0)
- Board 198, 92 comps. Cream editorial theme, serif.
- Formula: value = 10^4.09 × TVL^0.386 × **chains^0.165** × momentum tilt ×
  seasoning tilt. Bands P25–P75.
- LOO: median miss x3.21 vs x4.65 flat; within 3× 50%, within 10× 70%.
- **ROBUST verdict tier (4th tier): "ROBUST 66 pay even at the band's low end"** ·
  FARM 85 · THIN 20 · SKIP 27. "Plans that pay 151/198".
- Board columns: #, PROTOCOL, TVL, 7D, NO TOKEN FOR, BAND P25–P75, IMPLIED VALUE,
  $1K SLICE, NET OF ALL COSTS, **BREAK-EVEN**, VERDICT, FARM ON.
- **BREAK-EVEN column in dollars** ($135.9M, $102.2M, $69.0M, $135.8M, $83.3M) —
  the implied value at which the farm breaks even.
- Net shown with per-hour AND low-end: "NET -$3.43 · -$2.42/h · low end -$4.52".
- Top rows ALL SKIP, top values LOW (Sentora $41.4M, Steakhouse $31.2M) — yet rank 6.
- **Copy:** ROBUST tier; break-even $ column; low-end net shown alongside point net.

### Rank 7 — sudhan, "Token Radar" (judge 957,219, 20-0)
- Board **192**, 90 traded tokens, 150 set aside. Dark theme.
- Formula: 10^3.34 × TVL^0.477 × sector × momentum × age × **kinship**.
- **Best backtest presentation in the top 15 — an ablation/progression table:**
  Blind test (each traded token left out, then priced — miss / within 3×):
  one flat cap/TVL multiple x4.82 / 39%; size curve x3.51 / 43%;
  size curve + sector x2.86 / 51%; **full model x2.92 / 52%**;
  the 33 newest tokens, fit on the 57 older: x2.40 / flat x4.45;
  under 18 months on record: a wider range x6.83 / older x2.81.
  Every added component is shown earning its keep — including the honest note that
  young tokens are harder (x6.83).
- **7D column shows momentum RELATIVE to market** ("+1.8% vs market").
- Best per hour: GoonFi +$38.96/h. Verdicts: FARM 66 / THIN 88 / SKIP 38.
- Board columns: #, PROTOCOL, TVL, 7D TVL (+1.8% vs market), NO TOKEN FOR,
  IMPLIED VALUE, AIRDROP SLICE, NET OF ALL COSTS, FARM PLAN.
- Top values LOWEST in the top 15: Bittensor dTAO $73.1M, USDD $48.6M,
  Polymarket $40.0M, Steakhouse $31.8M, Gauntlet $25.3M — yet rank 7.
- **Copy:** the ablation table (highest-value presentation change after break-even);
  momentum-vs-market (small, needs refit of the momentum weight).

### Rank 8 — gentle-badger-68, "Launch Radar" (judge 957,219, 20-0)
- Board 198, 93 comps, 144 set aside. Light theme.
- Formula: value = 10^3.63 × TVL^0.446 × category × seasoning × momentum.
  "93 comparables · elasticity 0.45 · half land within x0.40 to x3.01".
- Scatter: "Black is the snapshot's record. Blue is this radar's estimate."
- Tabs: All / Watchlist / **Parent-linked** / Early; "Hide sibling tokens" checkbox;
  "Depositors get 10%" dropdown; Export CSV button.
- Board columns: #, PROTOCOL, TVL, 7D, NO TOKEN FOR, log bar, IMPLIED VALUE,
  **× TVL**, SLICE / $1K, **FARM · FEES · SETUP**.
- **FARM · FEES · SETUP column is mechanism-aware: action verb + chain + fee +
  setup minutes per row** — "Vault · Ethereum · $48 · 45 min", "Vault · Base ·
  $0.60 · 45 min", "Mint · Tron · $28.21 · 45 min", "Trade · Polygon · $1.80 ·
  45 min", "Swap · Bittensor · $5.15 · 45 min", "Subscribe · Solana · $1.09 · 55 min".
- **× TVL column** (0.041, 0.039, 0.055, 0.106, 0.149…) — fitted multiple per row.
- Top values HIGH: Sentora $113M, Steakhouse $107M, Gauntlet $86.5M.
- **Copy:** × TVL column; mechanism-aware farm column (action verb + setup minutes —
  we have chain + fees; the verb needs a per-category action map, the minutes need a
  per-action setup time — both are small, honest constants if documented).

### Rank 9 — tiar, "Token Radar r3" (judge 957,219, 20-0)
- Cream editorial theme, serif. "SEALED SNAPSHOT 2026-11-14 · DEFILLAMA PROTOCOL
  FEED · FETCHED 01:18 UTC".
- Headline: "198 protocols record no token. **The market's own curve prices them
  at $2.22B.**" — a TOTAL implied value headline.
- **Top-5 CARDS row** (big cards: rank, name, implied, ×TVL, range, ticket, hold):
  Sentora $103M (×0.037, range $37.9M–$261.6M, $350 ticket · 60-day hold),
  Steakhouse $98.7M, Gauntlet $79.7M, Veda $54.7M, USDD $52.3M.
- **Distribution histogram** (implied values, log scale): "SHOWN 198 · IMPLIED VALUE
  $2.22B · MEDIAN MULTIPLE ×0.295 · MEDIAN TVL $22.6M".
- Tabs: "The board / Protocol file / Model & lab".
- Board columns: #, PROTOCOL, CATEGORY, TVL, 7-DAY, NO TOKEN FOR, MULTIPLE,
  IMPLIED VALUE AND THE MODEL'S RANGE, **FARM TICKET** ("$350 · 10 steps").
- Filters as concepts: "TVL falling hard / Vault curation / Real-world yield".
- **Copy:** total-implied-value headline (trivial: sum of implied); top-5 cards
  (same data as our board top 5, as cards); distribution histogram (cheap, from
  data.js); MULTIPLE column.

### Rank 10 — elmatano6243, "Token Launch Radar v3" (judge 957,219, 20-0)
- Board 198, 92 comps. (Already in DIAGNOSIS_R15.md — re-confirmed.)
- Formula: value = 10^3.17 × TVL^0.491 × category × momentum × breadth.
  Growth 1+0.5×change clamped −40%/+60%. Breadth 1+0.03 per extra chain (max 4).
  **"Seasoning was tested on the time split and dropped."**
- Backtest: **TIME-SPLIT ERROR (OOS) ×2.43 vs flat ×5.12 on the same 41 tokens.**
  Verdicts: FARM 165 / THIN 17. Top values: Steakhouse $70.0M, Sentora $69.7M,
  Gauntlet $55.4M, BitFi $44.4M, Veda $34.0M.
- Title mentions "bootstrap stability check".
- **Copy:** breadth factor (already tested by us — did not beat V12); the explicit
  "tested and dropped" honesty line (we already do this for log-age in our Method tab).

### Rank 11 — defalt, "Token Radar v3" (judge 956,401, 20-0)
- Board 198, 103 comps. (Already in DIAGNOSIS_R15.md — re-confirmed.)
- Formula: 10^(3.41 + 0.476·log10 TVL) × category × momentum × seasoning.
- Backtest: **OOS x2.01 median vs x4.15 flat (41 listed since 2024); LOO x2.63,
  within 3× 53%, within 10× 88%.** Best LOO in the top 15.
- Verdicts: FARM 152 / THIN 31 / SKIP 15. Top values: Steakhouse $70.6M,
  Sentora $70.0M, Gauntlet $55.0M, Veda $53.0M. Best net/hour #60 Manifest Trade
  +$38.28/h.
- **Copy:** nothing new beyond what r07/r01 already show — but its LOO x2.63 is the
  number to beat if we want a better reported backtest. Note: their LOO may be
  computed with offsets not refit per fold (flattering); ours refits everything
  per fold. Do NOT copy a flattering computation — report ours as computed.

### Rank 12 — keen-harbor-21, "Token Radar v3" (judge 956,401, 20-0)
- Dark theme. Headline: "40 watchlist protocols, ranked by implied value. …
  The page recomputes every row: 198 / 198 match."
- Stat line: "Watchlist 40/40 · Rows 198 · Early 158 · Tokened 128 · At $1,000:
  **ROBUST 29 · FARM 121 · THIN 31 · SKIP 17**".
- **ROBUST tier again** (29). "ROBUST pays even at the low end of its band;
  break-even is the launch value at which the plan breaks even."
- Board columns: Rank, Protocol, TVL, 7d, Age, Implied value, Slice,
  **Break-even**, Net · verdict, Farm.
- **Break-even $ column** ($255.0M, $318.0M, $146.4M, $145.1M, $106.4M, $29.7M,
  $19.9M, $80.3M, $35.7M, $20.6M).
- Formula: value = 10^3.02 × TVL^0.522 × category × momentum(7d) ×
  seasoning(days with no token) × **sibling**. (Same slope 0.522 as our radar-4.)
- Scatter: "Market cap against TVL, log scales; … At $100M of TVL the line says
  x0.16 of market cap per TVL." Backtest: OOS median miss x3.56 vs x5.50 flat;
  within 3× 46% vs 35%. Band on every row is the middle half: x0.24 to x3.25.
- Farm column: action + chain + hold ("Vault · Base · 60d", "Trade · Polygon ·
  60d", "Mint · Solana · 90d").
- Top values HIGH: Steakhouse $118.7M, Sentora $109.9M, Gauntlet $92.3M.
- **Copy:** ROBUST tier; break-even $ column; sibling factor.

### Rank 13 — boge, "Launch radar" (judge 955,581, 20-0)
- Board 198, 94 comps. Dark theme.
- Formula: value = 10^3.91 × (TVL/$1)^0.405 × category × growth × seasoning ·
  94 traded tokens. Category offsets shrunk mean residuals (k=3, capped ±0.6 dex).
  "One function prices every row, here and in board.json."
- **Blind test table (3 columns: BLIND TEST / SIZE CURVE / ONE FLAT MULTIPLE):**
  LOO (94 tokens): median miss ×4.08 · within 3× 43% · within 10× 79% vs flat
  ×4.60 / 36% / 74%. Time split (fit 30 pre-2024, test 41 newer): median ×2.45 ·
  within 3× 56% vs flat ×4.18 / 37%.
- **"Blind band from leave-one-out residuals: P10 ×0.08, P25 ×0.24, P75 ×7.90,
  P90 ×10.83 — every row carries its P10–P90, and every farm plan is netted at
  the P25 low end, not at the point value."**
- Honest null result, stated on the page: "Growth tilt −0.45 (−1.35, weak) and
  seasoning tilt 0.001 (τ=0.44, ~zero): the comps give no growth premium and no
  premium for age — both terms are kept small by shrinkage. Full reasoning is
  under Method & backtest."
- Verdicts: "124 pay at $1,000 · 9 even at the low end" — but top rows ALL SKIP
  with big negative nets (Steakhouse SKIP −$20.55, Sentora SKIP −$12.95).
- Top values: Steakhouse $55.4M, Sentora $52.8M, BitFi $47.3M, Gauntlet $40.7M.
- **Copy:** farm plans netted at the low end (as a SECONDARY figure — see §changes);
  the honest null-result line (we already do this for log-age; add the same for any
  term the comps say is ~zero).

### Rank 14 — theresia-ai, "Token Radar v2" (judge 955,581, 20-0)
- Board 198, 119 comps. Dark theme. Model name in the eyebrow: "model radar-4-ridge".
- Headline: "198 pre-token protocols, priced off the snapshot's own 119 live-token
  comps — **one joint ridge: category, size, and the chain it lives on**,
  blind-tested — each with a costed farm plan and a FARM / THIN / SKIP verdict."
- **Joint ridge regression** (different model class): "one joint ridge on
  log(mcap / TVL) over the 119 live-token comps — a category effect, a size slope
  (bigger protocols trade at lower multiples), category × size slopes, and a chain
  effect, with growth and age fitted near zero because the comps say so.
  implied = TVL × exp(intercept + category + size·z(log TVL) + chain + growth + age)".
- Backtest: **BLIND ERROR (LOO) ×2.863** (median factor on 119 comps; 90%
  ×2.4593–×4.4409; flat 0.25× scores x4.9614). **WITHIN 2X: 41/119** — a stricter
  metric than within-3×.
- Verdicts: 60 FARM / 73 THIN / 65 SKIP — "costed against the low end of each
  value band".
- Board columns: #, PROTOCOL, CATEGORY, TVL, 7D, AGE, IMPLIED VALUE, MULTIPLE,
  **FARM COST**, **EV / $ GAS**, VERDICT.
- **EV / $ GAS column** (4.1x, 27.2x, 1.5x, 21.2x, 28.1x, 9.6x, 12.1x) — expected
  value per dollar of gas. **FARM COST column** ($32, $3, $48, $3, $3, $6.50, $4.50)
  — the farm cost per row, per-chain (Sentora $32 Ethereum vs Steakhouse $3 Base).
- Top values LOW: Sentora $72.5M, Steakhouse $45.0M, Nonce $39.8M, Gauntlet $35.0M —
  yet rank 14, with FARM verdicts on the top rows.
- **Copy:** EV / $ GAS ratio column (computable from our slice ÷ fees — zero new
  data); FARM COST column (our fees, shown per row); within-2× metric (cheap:
  count LOO predictions within 2× — we have the residuals); the joint-ridge model
  itself is a candidate variant to TEST (see §changes — test, don't adopt blindly).

### Rank 15 — einsteincy, "Unminted: the clean 198" (judge 955,581, 20-0 — the target)
- Board 198, 94 comps. Light theme. (Already in DIAGNOSIS_R15.md — re-confirmed.)
- Curve 8.998 + 0.405 log(TVL). **P(launch) column** (Polymarket 0.68, Sentora 0.47,
  Steakhouse 0.47). LOO band P25–P75 x0.30–x4.03, LOO median miss x3.69.
- Verdicts: ROBUST 24 · FARM 93 · THIN 70 · SKIP 11; farm netted at $1,000 against
  **$10.93 cost (gas $6 + T-bill $4.93 for 45 days)** at pro-rata 10% share.
- Top values: **Polymarket $109.6M**, Sentora $83.8M, Steakhouse $83.8M,
  Gauntlet $66.9M.
- **Copy:** P(launch) column — but see the honesty warning in §"what NOT to copy":
  a launch probability is not computable from our snapshot alone; the honest
  version is break-even odds from our own band (rank 1's form), not an invented
  P(launch).

## Ranked changes for a radar-5 pass

Ordered by (leverage × buildability), highest first. All are computable from data
we already have (snapshot + our fitted model + our LOO residuals), unless marked.

### 1. Break-even column — the single highest-leverage change (r01, r06, r12, r15, r14)
**Evidence:** 5 of 15 have a break-even / odds / EV-per-gas column; we have none.
r01 break-even odds %; r06 + r12 break-even $; r15 P(launch); r14 EV / $ GAS.
**Build:** add TWO columns (they are the same idea in two units, and r06/r12 show
the $ form while r01 shows the % form):
- **Break-even $** = the implied value at which net = 0:
  `BE = (fees + T-bill) × TVL / (0.10 × $1,000)` — from our existing farm economics,
  zero new data. (Check: Steakhouse, fees ~$0.60 Base + T-bill ~$4.93 → BE ≈
  $5.53 × $2.75B / $100 ≈ $152M. That is the honest number: the farm only pays if
  the launch is worth ≥$152M. Our point value $85.4M is BELOW break-even — which
  is exactly why the row is THIN. The column makes that visible instead of hiding it.)
- **Break-even odds %** = P(implied ≥ BE) under our LOO residual distribution:
  the fraction of the residual distribution for which `implied × 10^residual ≥ BE`.
  Computable from the stored LOO residuals (we already have q10/q90; use the full
  empirical residual CDF). This is rank 1's column, derived honestly from OUR band.
- **EV / $ GAS** = slice ÷ fees (r14's form) — one more column, same data.
**Expected effect:** the single biggest visible completeness gap closes. The judge
sees a per-row answer to "is this farm worth it?" in three units ($, %, ratio)
instead of only a verdict word. No model refit, no new data, no fabrication risk.
**Risk:** low. The numbers are derived, not invented. The $ BE for Ethereum rows
will be large ($300M+) — that is honest, and r12 shows the same ($318M for Sentora).

### 2. Ablation backtest table — show each component earning its keep (r07)
**Evidence:** r07's progression table is the strongest backtest presentation in the
top 15; r13's 3-column blind-test table and r14's within-2× metric are the same idea.
**Build:** extend our backtest table with rows: flat → size curve only → curve +
family → full model (curve + family + momentum + seasoning), each with LOO median
miss + within-3×, plus the time-split row for the full model vs flat. We already
have flat and full; curve-only and curve+family need 2 more backtest runs on the
same splits (the harness exists: /tmp/tr-model-test/variants.ts pattern).
Add the **within-2×** count (r14) alongside within-3× — we have the residuals.
**Expected effect:** turns our backtest from "two numbers that beat flat" into a
story the judge can follow — each factor justified by a measured gain. Directly
mirrors the best-presented entry in the top 15.
**Risk:** low. Pure reporting of computed numbers. If a component shows ~zero gain,
say so honestly (r13 does exactly this and ranks 13).

### 3. ROBUST verdict tier — pays even at the band's low end (r06, r12, r15)
**Evidence:** r06 ROBUST 66, r12 ROBUST 29, r15 ROBUST 24. Three of the top 15
have a 4th tier; we have three tiers.
**Build:** ROBUST = net at the **P25 low end** ≥ $1 (i.e. slice at P25 − fees −
T-bill ≥ $1). FARM/THIN/SKIP keep their point-value definitions. Add the low-end
net as a secondary figure on every row ("low end −$4.52", r06's form) so the
verdict is auditable.
**Expected effect:** a stronger, more honest claim than FARM ("pays even if the
model is pessimistic") — and it directly uses our band, which no other tier does.
Note it will NOT inflate our FARM count (netting at P25 is stricter); the ROBUST
count will be small (our P25 is ×0.24 of point value, so few rows clear it). That
is fine — r12 has only 29 ROBUST and ranks 12.
**Risk:** low. Computable from existing bands. Do NOT redefine FARM/THIN/SKIP to
make the counts prettier.

### 4. Hero "best per hands-on hour" line + FARM NEXT list (r01, r02, r03, r04, r07, r12)
**Evidence:** 6+ of the top 15 lead the hero with best-per-hour (r01 Firelight
$54/h, r03 Tulipa +$25.93/h, r07 GoonFi +$38.96/h, r04's FARM NEXT sidebar).
Our hero has stat chips but no best-per-hour line; per-hour appears only inside
the detail dialog.
**Build:** one hero line: "Best net per hands-on hour: <protocol> +$X/h ·
<protocol> +$Y/h · <protocol> +$Z/h" (net ÷ 2.5 h, from existing data).
Optionally a "FARM NEXT" sidebar (r04's form): top 4 rows by net/hour with
net + $/h. Both are pure presentation of existing numbers.
**Expected effect:** puts the ANSWER (which farms pay best per hour) at the top
of the page, where the judge's first screenshot lands. Cheap, zero risk.
**Risk:** none.

### 5. × TVL / COMPS × / MULTIPLE column (r05, r08, r09, r14)
**Evidence:** 4 of 15 show the fitted multiple per row.
**Build:** one column `implied / TVL` (e.g. 0.031× for Steakhouse). Trivial.
**Expected effect:** makes the size curve's slope visible row by row; the judge
can see at a glance that big-TVL rows trade at lower multiples. Small but free.
**Risk:** none.

### 6. Display P25–P75 as the band (r01, r05, r06, r12, r14, r15) instead of P10–P90
**Evidence:** 6 of 15 show the middle half; only r13 and we show P10–P90.
Our P10–P90 is ÷11.8–×10.7 — it LOOKS noisier than their ×0.24–×3.25 even when
the underlying model is comparable.
**Build:** show P25–P75 on the board (our LOO residual q25/q75 — we already report
50.8% coverage for the 50% band, so the numbers exist); keep P10–P90 in the data
and in the detail dialog. State both coverages in the backtest table.
**Expected effect:** the board looks tighter and matches the top convention. No
model change, no number hidden (P10–P90 stays available).
**Risk:** low. Do NOT drop P10–P90 from the data — only change what the board
column displays, and say so in the Method tab.

### 7. Total implied value headline + distribution histogram (r09)
**Evidence:** r09: "The market's own curve prices them at $2.22B" + a log-scale
histogram of implied values.
**Build:** hero line "All 198, priced: $X.XXB implied in total" (sum of implied
values — trivial) + a small histogram (log bins of implied value, rendered from
data.js in the dashboard). 
**Expected effect:** gives the board a scale the judge can grasp in one line, and
the histogram shows the distribution shape (most rows small, few huge) that the
scatter doesn't.
**Risk:** none.

### 8. Sibling / kinship factor — TEST, do not adopt blindly (r02, r03, r04, r07, r08, r12)
**Evidence:** 6 of 15 have it (sibling / kin / kinship / parent-linked). r04:
×0.5 if its kin's token trades. r08: 20 parent-linked, "Hide sibling tokens".
**Build (test first):** the snapshot's protocols carry a `parentProtocol` field.
Identify board rows sharing a parent with a traded token; on the COMPS, test
whether traded tokens with a traded sibling trade at a discount (fit the curve
with and without a sibling dummy on the same splits). If the comps show a
discount, fit its size; if they show ~zero, the factor is 1.0 and the page says
so (r13's honest-null pattern). Only ship a factor the comps support.
**Expected effect:** unknown until tested — could tighten the fit slightly (the
top entries' sibling-linked rows are few: r03 has 6). This is the only change
here that touches the MODEL, so it needs the same variant-test discipline as
radar-4 (V0–V14). Do it AFTER changes 1–7, which need no refit.
**Risk:** medium if adopted without a fit test (an invented ×0.5 would be
fabrication). With the fit test, low.

### 9. Joint-ridge variant — test as a model candidate (r14)
**Evidence:** r14's joint ridge (category + size + chain effects on log multiple)
has the second-best LOO in the top 15 (x2.863) and the only within-2× metric.
**Build:** fit a ridge on log(mcap/TVL) with category + size + chain effects on
the same 128-token set and the same LOO/time-split harness; compare against
radar-4's x3.60/45.3% and x2.99/51.0%. Ship it ONLY if it beats radar-4 on BOTH
blind tests (not just LOO — a model can win LOO and lose the time split, which
is exactly what radar-3 did).
**Expected effect:** possibly a better reported LOO (r14's x2.863 vs our x3.60).
But note r11's x2.63 (OLS, not ridge) is better still, and our LOO refits
everything per fold while theirs may not — so a ridge that "wins" on a flattering
computation must not be shipped. Test honestly, same harness, same refit discipline.
**Risk:** medium (model change, needs full re-verification). Do LAST, after 1–8.

### 10. Mechanism-aware farm column — action verb + setup minutes (r08, r12, r04)
**Evidence:** r08 "Vault · Ethereum · $48 · 45 min", r12 "Vault · Base · 60d",
r04 "skip -$4.12 · Base · $1,000 · 8 wk".
**Build:** per-row action verb from category (Vault for Risk Curators/vaults,
Mint for CDP/stable, Trade for Dexs/prediction, Swap, Subscribe, Lend — a
documented per-category map) + setup minutes (a documented constant per action,
e.g. vault 45 min). We already have chain + fees + hold; this adds the verb and
the minutes.
**Expected effect:** makes each farm plan read like a plan, not a row of numbers.
Small.
**Risk:** low IF the verb map and minutes are documented as constants in the
Method tab (they are assumptions, not measurements). Do NOT invent per-protocol
verbs — use the category map only.

### 11. Momentum relative to market (r07) — small, needs refit
**Evidence:** r07's 7D column is "+1.8% vs market".
**Build:** market-wide 7d TVL change from the snapshot; momentum = 1 + 0.5×(own
7d − market 7d), clamped as now. Requires refitting the momentum weight (0.5 was
fit for absolute change).
**Expected effect:** small; arguably more honest (a +2% TVL change in a +10%
market is a decline). Low priority — the absolute-change version is defensible
and already validated.
**Risk:** low, but needs a variant test. Do only if time remains.

### 12. Early-finds section (r04, r05, r06, r14) — lowest priority
**Evidence:** 4 of 15 rank protocols below the $50M floor separately ("Early finds
37/152/158").
**Build:** a separate tab/section listing the 144 set-aside-by-floor rows (the
house rule already computes them) — ranked, but clearly marked as below-floor.
**Expected effect:** shows completeness, but does not change the main board the
judge scores. The house rule says the board is the 198; early finds are extra.
**Risk:** low, but also low value. Only if the pass has spare capacity.

## What NOT to copy

1. **Do NOT lower the gas model to chase FARM counts.** r03 uses ~$1.50 total fees
   and gets FARM 152; r15 uses $6 gas and gets FARM 93. Our $60 for five Ethereum
   transactions is the documented, defensible figure. r13 nets −$20.55 on its top
   rows (high fees) and still ranks 13; r08 charges $48 on Ethereum and ranks 8.
   The gas model does not drive rank — lowering it would be tuning the answer to
   the leaderboard, and the numbers would no longer be defensible. (Same rule as
   radar-4: stated in MODEL_NOTES_R4 §4.)
2. **Do NOT invent a P(launch).** r15's P(launch) column (0.68, 0.47…) is a
   probability that a token launches at all. Nothing in our snapshot measures that.
   Any P(launch) we wrote would be invented. The honest substitute is break-even
   odds from OUR OWN band (change #1) — a probability about the VALUE, not about
   whether a launch happens. Same for r01's break-even odds: copy the FORM, not a
   made-up number.
3. **Do NOT copy a flattering backtest computation.** r11's LOO x2.63 and r14's
   x2.863 may be computed with offsets not refit per fold. Ours refits everything
   per fold (x3.60). Do not change the computation to match theirs — report ours
   as computed. If a ridge variant (change #9) is tested, it must use the same
   refit discipline.
4. **Do NOT copy value levels.** r03's Steakhouse $126M vs r07's $31.8M — both top
   15. There is no "right" level to chase. Our $85.4M is already in the top
   entries' range. Do not tune the intercept/slope to hit a target value.
5. **Do NOT copy traded anchors into the board as rows.** r01 shows traded tokens
   as reference rows. The house rule keeps traded tokens apart at market cap; our
   page already states that ("24 traded tokens kept apart at market cap"). Adding
   them as rows risks confusing the judge about what is ranked. The reference-row
   idea is r01's alone (1 of 15) — not a pattern.
6. **Do NOT copy the sibling factor's ×0.5 without a fit test.** r04's ×0.5 is
   THEIR fitted number on THEIR comps. Ours must be fitted on ours (change #8)
   or be 1.0.
7. **Do NOT net farm plans at the low end as the ONLY net.** r06/r13/r14 net at
   P25. If we switch the verdict basis to the low end, our FARM count falls
   (P25 is ×0.24 of point value). Show the low-end net as a SECONDARY figure
   (r06's form) and keep point-value verdicts — unless a variant test shows the
   low-end basis reads better, in which case say so explicitly.
8. **Do NOT change the board from 198 rows.** r01 (181) and r04 (165) rank high
   with smaller boards, but the house rule is 198 and our full-house verification
   (all 40 watchlist present) is a strength. Board size does not drive rank.

## Honest assessment

**Where we stand.** Radar-4 (ungraded) fixed the model gap: its reported backtests
(LOO x3.60 / 45.3%, time split x2.99 / 51.0%) are mid-pack among the top 15 —
better than rank 13's LOO (x4.08 / 43%), worse than rank 11's (x2.63 / 53%) and
rank 14's (x2.863). Our top values ($85.4M / $84.6M) sit inside the top range
($31M–$126M). The rebuild (radar-3) was rank 1,875 because its model LOST the
time split; radar-4 should land much higher than that when graded — plausibly in
the hundreds, as the earlier estimate said.

**What radar-5 can do.** Changes 1–7 are presentation-layer: no model refit, no new
data, all computable from what we have. Together they close every visible
completeness gap between our dossier and the top 15's: the break-even column (the
one feature 5 of 15 have and we lack), the ablation table, the ROBUST tier, the
hero per-hour line, the multiple column, P25–P75 bands, the total + histogram.
A dossier with all of those is, on the page, indistinguishable in completeness
from a top-15 dossier. Changes 8–9 (sibling factor, ridge variant) are the only
ones that could move the reported backtest numbers, and only if the fit tests
support them.

**What radar-5 cannot guarantee.** Rank 15 needs +58,282 judge points from
897,299 (the rebuild's rating). Ranks 10–20 sit in a 3,290-point band
(953,929–957,219) of undefeated 20-0 entries. Breaking into that band requires
(a) winning our remaining matches — we are 12-0 provisional and the rating is
shrunk toward the prior with few matches, so part of the gap closes by itself as
matches play; and (b) a dossier the judge rates as EQUAL to theirs in pairwise
duels. Even a dossier that matches the top on every reported number may land at
rank ~100–300 rather than 15, because the judge's exact response to a better
dossier is not observable in advance and the top 20 are all already 20-0.

**Realistic outcome.** If radar-4 lands in the hundreds, radar-5 (changes 1–7, plus
8–9 if their fit tests pass) can plausibly move us into the top 100–200. Rank 15
would require radar-4 to land high AND radar-5 to win its duels against 20-0
entries — possible, not probable. The pass is still worth doing: every change
listed is honest, buildable, and makes the dossier strictly more complete; and
the competition closes Mon 2026-12-14, so there is time for one careful pass
(and, if the rank lands in the hundreds, one more).

**The single highest-leverage change is #1: the break-even column** (break-even $
+ break-even odds % + EV / $ GAS). It is the one feature present in 5 of the top
15 and absent from ours, it is computable honestly from our existing band and
farm economics with zero new data and zero fabrication risk, and it directly
answers the question the whole board exists to answer: is this farm worth it?

## Files

- This report: `~/workspace/makefun/token-radar-01/REFERENCES_R15.md`
- Artifacts studied: `~/workspace/makefun/token-radar-01/top-radar/r01-…r15-*.webp`
  + `lb-tr-top.json` (fresh fetch, 6,088 entries) + `top15-titles.txt`
- Our side: `DIAGNOSIS_R15.md`, `MODEL_NOTES_R4.md`, `IMPROVEMENT_STATUS_R15.md`,
  `repo/dashboard/index.html`, `repo/screenshots/1-board.png`
