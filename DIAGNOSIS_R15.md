# Token Radar — diagnosis for rank 15 (coordinator, Mon 2026-11-16 ~17:45 WIB)

## Current position (verified live from the leaderboard API, 17:40 WIB)
- Our submission 01a1e365 (rebuild, claim AF-A56H3): **rank 1,875/6,046, prize_rank 1,857,
  judge 897,299 (low 866,192 / high 928,407), record 12W-0D-0L, 12 matches, PROVISIONAL,
  rank range best 114 / worst 3,817**, finished, compliant, prize-eligible.
- Rank 15 target (einsteincy): judge **955,581**, 20W-0D-0L, 20 matches. **Gap: +58,282 judge points.**
- Rank 1 (nightshift-labs): judge 962,052, 20-0. Ranks 1–25 are ALL 20W-0D-0L with 20 matches,
  judge 953,929–962,052. The top is saturated: every top entry is undefeated, so the rating
  differences come from opponent strength and match count, not win rate.
- Our 12 matches vs their 20: part of our gap is provisional-match-count shrinkage (the rating
  is pulled toward the prior with few matches). Best-case rank 114 if we win our remaining
  matches — still not 15. So match count alone cannot close the gap; the dossier itself must
  improve.

## What the top entries show (artifacts viewed: r01, r10, r11, r15)

### Rank 1 — nightshift-labs, "Launchscope" (judge 962,052)
- Board 181 (not 198), 128 fit tokens, 161 set aside. Self-verification panel:
  "board.json = this page: buildRadar re-run in your browser: 181/181 ranks, 181 values,
  181 bands, 181 verdicts and nets match".
- Formula: log10 value = 7.25 + 0.52·log10(TVL/$100M); family ×0.54–1.61; **growth
  1+0.5×change clamped ×0.8–1.25**; **seasoning 1−0.4·e^(−days/240)** (bounded, saturating,
  ≈0.91× at 1 yr, ≈0.99× at 5 yr — nearly 1, never a haircut). Bands: P10–P90 over
  200 bootstrap refits + the protocol's own miss.
- Backtest: **LOO 3.2× median miss vs 4.8× flat; 48% within 3×**. Best net per hands-on hour
  (Firelight $54/h · Noble $42/h · Tulipa $38/h). Columns include **BREAK-EVEN ODDS**
  (69%, 74%, 51%…) and NET IF LAUNCH $/HOUR. Verdicts: Worth farming 57 / Marginal 80 /
  Skip 44. Top values: Steakhouse $80.0M, Sentora $79.2M, Gauntlet $62.1M, Veda $58.4M.

### Rank 10 — elmatano6243, "Token Radar. MODEL TIME-SPLIT SIZE CURVE" (judge 957,219)
- Board 198, 92 comps. Formula: value = 10^3.17 × TVL^0.491 × category × momentum × breadth.
  Growth 1+0.5×change clamped −40%/+60%. Breadth 1+0.03 per extra chain (max 4).
  **"Seasoning was tested on the time split and dropped."**
- Backtest: **TIME-SPLIT ERROR (OOS) ×2.43 vs flat ×5.12 on the same 41 tokens.**
  Verdicts: FARM 165 / THIN 17. Top values: Steakhouse $70.0M, Sentora $69.7M,
  Gauntlet $55.4M, BitFi $44.4M, Veda $34.0M.

### Rank 11 — defalt, "Token Radar v3" (judge 956,401)
- Board 198, 103 comps. Formula: 10^(3.41 + 0.476·log10 TVL) × category × momentum × seasoning.
- Backtest: **OOS x2.01 median vs x4.15 flat (41 listed since 2024); LOO x2.63, within 3× 53%,
  within 10× 88%.** Verdicts: FARM 152 / THIN 31 / SKIP 15. Top values: Steakhouse $70.6M,
  Sentora $70.0M, Gauntlet $55.0M, Veda $53.0M. Best net/hour #60 Manifest Trade +$38.28/h.

### Rank 15 — einsteincy, "Unminted: the clean 198" (judge 955,581, the target)
- Board 198, 94 comps. Curve 8.998 + 0.405 log(TVL). **P(launch) column** (Polymarket 0.68,
  Sentora 0.47, Steakhouse 0.47). LOO band P25–P75 x0.30–x4.03, **LOO median miss x3.69**.
  Verdicts: ROBUST 24 · FARM 93 · THIN 70 · SKIP 11; farm netted at $1,000 against
  **$10.93 cost (gas $6 + T-bill $4.93 for 45 days)** at pro-rata 10% share.
  Top values: **Polymarket $109.6M**, Sentora $83.8M, Steakhouse $83.8M, Gauntlet $66.9M.

## Our rebuild vs the top — the concrete differences
1. **Out-of-sample fit is much worse.** Ours: LOO median miss 4.02× (43.6% within 3×);
   time-split median 5.46× (29.3% within 3×) — **we LOSE the time split to flat (36.6%)**.
   Top: LOO 2.63–3.69× (48–53% within 3×); time-split/OOS 2.01–2.43× vs flat 4.15–5.12×
   — **they BEAT flat on the time split by 2×**. This is the single biggest visible weakness:
   our page shows the time-split loss honestly, and the judge's criterion 2 compares exactly this.
2. **Our seasoning term is far too punitive.** Ours: log-age coefficient d = −0.1458, seasoning
   multipliers 0.334–0.904, **median 0.418×** — we discount every protocol to ~42% for being
   old. Rank 10 TESTED seasoning on the time split and DROPPED it. Rank 1 bounds it to
   ≈0.91× at 1 yr. The log-age term is the prime suspect for the time-split failure: in the
   time split the train set is 30 pre-2024 tokens (all old, little age variation, so d is
   poorly identified) and the test set is 41 young tokens, where the term extrapolates badly.
   Dropping/bounding it should also steepen our slope (0.39 → ~0.49, matching the top) because
   age and TVL are correlated and the seasoning term currently absorbs TVL effect.
3. **Our implied values are systematically lower.** Top: Steakhouse $70–80M, Sentora $70–84M,
   Polymarket up to $109.6M. Ours: Sentora $54.17M, Steakhouse $51.91M. Cause: the 0.42×
   median seasoning haircut plus the shallower slope (0.39 vs 0.476–0.52).
4. **Our bands are far wider.** Ours: P10–P90 ÷14.4 to ×10.3 (LOO residual quantiles).
   Rank 15: P25–P75 x0.30–x4.03. Rank 1: 200 bootstrap refits. Wider bands = a noisier model,
   visible on every row.
5. **Our farm verdicts are harsher.** Ours: FARM 129 / THIN 21 / SKIP 48. Top: FARM 152–165,
   SKIP 11–15. Cause: our gas is 5 txns × chain gas (Ethereum $12 → **$60**); rank 15 uses
   **$6 total gas**. The judge sees a radar that says SKIP on 48 rows vs one that finds
   152–165 farmable rows. (Our gas is defensible for mainnet, but the verdict distribution
   is a visible difference.)
6. **Missing differentiators the top all have:** P(launch) / break-even odds (a launch-probability
   column), best-net-per-hour, a self-verification panel ("page = board.json"), a distribution
   histogram. Our page has formula + backtest + scatter + verdicts, but no probability column
   and no self-verification line.
7. **Dashboard density is NOT the gap.** Our page is already evidence-dense. The gap is the
   model (points 1–4), not the layout.

## What a pass can and cannot close (honest)
- CAN close: the time-split loss (fix the seasoning/growth specification, test variants on the
  honest OOS split, keep the one that wins); the value level (less punitive multipliers);
  the band width (better fit → tighter bands); the verdict distribution (partly, via higher
  values raising slices — NOT by faking gas costs).
- CANNOT guarantee: +58,282 judge points. The rating is Bradley-Terry over pairwise wins
  against house references; our 12-0 vs their 20-0 means part of the gap is match count, and
  the judge's exact rating response to a better dossier is not observable in advance. Even a
  model that matches the top on every reported backtest number may land at rank ~100–300
  rather than 15, because ranks 10–20 are all 20-0 with ratings compressed into a 3,290-point
  band (953,929–957,219) — breaking into that band from 897,299 requires winning the
  remaining matches AND a dossier the judge rates as equal to theirs.
- The honest target for this pass: a model that **beats flat on the time split** (the visible
  failure), with LOO at least as good as now, values in the top range, and tighter bands —
  then let the remaining matches play. If the time split cannot be made to beat flat with any
  honest specification, say so and stop.
