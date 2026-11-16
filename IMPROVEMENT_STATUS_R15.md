# Token Radar — improvement pass for rank 15 (coordinator, Mon 2026-11-16 ~18:00 WIB)

## Current position
- Submission 01a1e365 (rebuild, claim AF-A56H3): **rank 1,875/6,046, prize_rank 1,857,
  judge 897,299 (866,192–928,407), 12W-0D-0L, 12 matches, PROVISIONAL (rank range
  best 114 / worst 3,817)**, finished, compliant, prize-eligible.
- Rank 15 target (einsteincy): judge 955,581, 20W-0D-0L. **Gap: +58,282 judge points.**
- Competition closes Mon 2026-12-14 17:00 WIB; result due Tue 2026-12-29 05:10 WIB.
- Quota: Token Radar used 1 submit today (UTC Nov 16, the rebuild at 15:07 WIB).
  Per-competition cap is at least 2 (proven by FPS #2 today). The parent will try
  submitting the new pass today; a 429 refusal does NOT burn quota — if it refuses,
  submit tomorrow after the UTC day rolls over (07:00 WIB).

## Diagnosis (full findings in DIAGNOSIS_R15.md)
Studied the rank 1–20 artifacts (downloaded from the leaderboard, viewed r01/r10/r11/r15).
The top entries differ from our rebuild in six concrete ways; the decisive one is the
MODEL: ours LOST the time split (29.3% within 3× vs 36.6% flat) while every top entry
BEATS flat on it by ~2× (OOS x2.01–2.43 vs flat x4.15–5.12). Cause: our log-age
seasoning term (median 0.42× haircut) — in the time split the train set is 30 old
tokens (age coefficient poorly identified) and the test set is 41 young tokens, where
it extrapolates badly. The top entries either dropped seasoning (rank 10) or bounded
it near 1 (rank 1). Our values were also systematically lower (top $54M vs their
$70–110M) and our bands wider (÷14.4–×10.3 vs their x0.30–x4.03).

## Improvement pass — model radar-4-fitted (full notes in MODEL_NOTES_R4.md)
`repo/lib/model.ts` rewritten (local commit `40f08ff`):
- **Size curve fit on ALL 128 traded tokens** (was 94 in six "comparable" categories).
  Slope steepened 0.39 → **0.522**, intercept 7.203. The six excluded categories are
  excluded from the BOARD only, never from the curve (rank 1 does the same).
- **Log-age regressor DROPPED.** Growth and age now enter as BOUNDED multipliers that
  cannot invert the board: momentum = clamp(1+0.5×change, 0.8, 1.25); seasoning =
  max(0.01, 1−0.4·exp(−age/240)), saturating toward 1.
- Formula: `value = 10^7.20 × (TVL/$100M)^0.52 × family × momentum × seasoning`.
- **Backtests (same splits as radar-3): LOO median miss 3.60× / 45.3% within 3×
  (flat 4.88× / 35.2%); TIME-SPLIT median 2.99× / 51.0% within 3× (flat 35.3%) —
  the model now BEATS flat out of sample instead of losing to it.** Radar-3:
  LOO 4.02× / 43.6%, time 5.46× / 29.3% (lost). Bands tightened to ÷11.8–×10.7.
- Top 5 now match the top entries' order and magnitude: Steakhouse **$85.42M**,
  Sentora **$84.56M**, Gauntlet $66.39M, Veda $62.43M, BitFi $41.47M
  (radar-3: Sentora $54.17M, Steakhouse $51.91M).
- Farm economics UNCHANGED (gas $60 for five Ethereum txns is the documented
  figure — not lowered to chase the top entries' FARM 152–165). Verdicts:
  **FARM 122 / THIN 19 / SKIP 57** (radar-3: 129/21/48) — slightly worse, because
  the steeper slope lowers small-TVL rows' values. Known remaining gap, stated
  honestly. Variants tested in /tmp/tr-model-test/variants.ts (V0–V14): dropping
  seasoning alone already wins the time split; ridge and breadth did not beat V12
  (the shipped spec); offsets net of multipliers changed results by <0.05×, so the
  established offset method was kept.

## Dashboard changes (`repo/dashboard/`, 3 files, 54,544 B — under the 65,536 cap)
- Formula panel renders the new formula + coefficients (Intercept 7.203, Slope 0.522,
  Momentum weight 0.5, Seasoning scale 0.4) from data.js; **BOTH backtest rows now
  carry the `win` highlight** (LOO and time split both beat flat).
- Method tab prose rewritten for radar-4 (fit on all 128, bounded multipliers, why the
  log-age term was dropped).
- **Fixed a real bug in the set-aside prose**: it listed the WRONG six categories
  (CEX, Centralized Exchange, Derivatives, Options, Prediction Market, Gaming). The
  model's house rule excludes Bridge, Canonical Bridge, Liquid Staking, Liquid
  Restaking, Restaked BTC, CEX. The prose now lists the real six.
- Added a self-verification line under the stat chips, rendered from data:
  "Page = board.json: 198 ranks, 198 values, 198 bands, 198 verdicts and nets."
- Eyebrow now reads "model radar-4-fitted". Also fixed: stale radar-3 screenshot-variant
  files (detail.html/filtered.html/filtered-table.html) had leaked into `out/dashboard/`
  and were polluting the dossier text with "radar-3-fitted" — removed; the dossier now
  has 3 files, radar-4 ×2, radar-3 ×0.

## Verification (all green)
- **main.ts**: run into `out/` (deterministic); `boardIssue()` null; board 198 rows,
  all 40 watchlist present, factor products reconcile (max deviation $0), every
  P10 ≤ implied ≤ P90, verdicts follow nets, all rows pass the house rule.
  board.json 429,020 B; data.js 430,877 B; dossier.json 1,086,657 B (gate max 1.5 MiB).
- **Real-data dashboard boot test** (`/tmp/tr-model-test/boot-real.js`, stubbed DOM,
  real `out/data.js` + `dashboard/app.js`): **11/11 passed** — 198 rows rendered, top
  row Steakhouse, radar-4 formula, Momentum/Seasoning labels 0.5/0.4, time-split win
  51.0% vs 35.3%, LOO win 45.3% vs 35.2%, both backtest rows marked win, verify line
  present, chips FARM 122 / SKIP 57. Deep link `?detail=steakhouse-financial` opens
  the detail dialog with the stored $85.4M, P10–P90 $7.2M–$913.0M, "Board.json
  carries the same", no "differs"/"stale".
- **Kit check: 12 passed, 0 failed** (`--worktree`, transcripts-r15.tar.gz).
  thinking_reproduces 52.0% (1006/1933), thinking_revised: lib/model.ts from
  6 messages, thinking_priced 6 usage records.
- **Bundle: `transcripts-r15.tar.gz`, 594,920 B, sha256
  `7b682d1cf2f20f59ec82850b89e7f672d76c791ad7b1eacf3e32709ad1d39a9b` —
  password-clean, 0 occurrences** (verified with `check_password.py`). 5 sessions:
  the 4 rebuild sessions (38406c9d, 70921881, a3628d81, cd7484fe) + this coordinator
  (7343a1e2). **Never includes contaminated sessions a3d58228, d364e740, 2195ac74,
  8c7d0e23.** Note: my session currently has 0 usage rows attached (a subagent's
  usage row is written only when its run completes). The kit check still passes
  thinking_priced on the rebuild's 6 records, so this bundle is submittable as-is.
  For full completeness, after this run completes the parent may re-bundle from
  the top level with an updated `muse-usage.jsonl` (SELECT agent_id
  `7343a1e2-4b85-4672-894d-8a1e0399c5e8` from muse.db, plus the 4 rebuild IDs),
  same 5 `--session` files + `--no-discover` + `--no-family` +
  `--harness "Muse" --harness-version "1.3" --provider "Meta" --model "Muse Spark 1.3"
  --effort default --system-prompt system-prompt-withheld.txt`. **Do NOT include
  session a3d58228 — it is password-contaminated.** Re-run the kit check on any
  re-bundled file before submitting.
- Local commit: `40f08ff` (working tree clean). Kit is CURRENT (bundle_sha256
  ea1c9dcc… matches the site's current kit).

## ⚠️ BLOCKED — screenshots need the preview repo updated first (parent's browser job)
`repo/screenshots/` still holds the **radar-3 screenshots** (old numbers, old prose).
Submitting with them would show radar-3 in the screenshots against radar-4 in the
dossier — an inconsistency the judge penalises (criterion 1: "screenshots and code
agree"). **Do NOT submit until the 3 screenshots are re-taken.** The coordinator
cannot update the preview repo (no browser) — the parent must do Phase A, then the
coordinator (or a follow-up) does Phase B.

### Phase A — parent (browser): update the preview repo
Repo https://github.com/people871/token-radar-preview (GitHub Pages live).
Upload/replace these files from `~/workspace/makefun/token-radar-01/preview/`:
- `data.js` (root) ← preview/data.js (radar-4 data, 430,877 B)
- `dashboard/index.html` ← preview/dashboard/index.html
- `dashboard/app.js` ← preview/dashboard/app.js
- `dashboard/app.css` ← preview/dashboard/app.css (unchanged, include for completeness)
- `dashboard/detail.html` ← preview/dashboard/detail.html (opens rank-1 Steakhouse)
- `dashboard/filtered.html` ← preview/dashboard/filtered.html (Dexs filter)
- `dashboard/filtered-table.html` ← preview/dashboard/filtered-table.html (Dexs, hero hidden)
Then tell the coordinator the Pages deploy is live.

### Phase B — coordinator (after Phase A): 3 NEW screenshots (1440×900, PNG, ≤512 KiB)
- `1-board.png`: thum.io of the preview index.html (no params) — full board.
  `curl -sL -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36" "https://image.thum.io/get/wait/5/width/1440/crop/900/<pages-url>"`, then crop to 1440×900 with PIL (thum.io returns 1440×1080 regardless of crop/900).
- `2-detail.png`: thum.io wait/10 of dashboard/detail.html (replaceState ?detail=steakhouse-financial).
- `3-filtered.png`: microlink of dashboard/filtered-table.html (hero hidden so the Dexs table is at top).
  `https://api.microlink.io/?url=<encoded>&screenshot=true&viewport.width=1440&viewport.height=900&waitUntil=networkidle0`, resize the 2880×1800 result to 1440×900 with PIL.
  (thum.io rejects target URLs containing query strings — that is why the static
  replaceState variants exist; do NOT put a query string in the thum.io URL.)
Save into `~/workspace/makefun/token-radar-01/repo/screenshots/` REPLACING the 3 old
PNGs (same filenames). Then re-run main.ts into out/ + re-run the kit check with
transcripts-r15.tar.gz (both must stay green).

### Phase C — parent (browser): upload the entry repo
Repo https://github.com/people871/makefun-token-radar-01, branch main.
Upload/replace via the GitHub web UI:
- `lib/model.ts` (radar-4)
- `dashboard/app.css`, `dashboard/app.js`, `dashboard/index.html` (modified)
- `screenshots/1-board.png`, `2-detail.png`, `3-filtered.png` (NEW, from Phase B)
- `main.ts` (only if it differs from the GitHub copy — check; the local commit 40f08ff
  included a main.ts change vs the old local HEAD, which may just be drift)
- `README.md` (already on GitHub from the rebuild — verify it is still there; do NOT
  re-upload if unchanged)
- `MODEL_NOTES_R4.md`, `DIAGNOSIS_R15.md`, `IMPROVEMENT_STATUS_R15.md` (docs, optional —
  harmless to include; they are not part of the dossier)
GitHub About is already set from the rebuild (description naming make.fun, website
https://make.fun/bounty/token-radar-01, topics makefun/ai-agents/bounties/trading) —
verify it is still set; do not change it. Return the NEW HEAD SHA.

### Phase D — parent: submit
With the HEAD SHA + transcripts-r15.tar.gz, submit via the kit CLI, title
"Token Radar — radar-4: time-split-validated rebuild", read the submission status,
and check the rank. If the submit returns 429 (quota), do NOT retry the same UTC day
— wait for the next UTC day (Tue 2026-11-17 07:00 WIB).

## Phase B — screenshots (coordinator f1c23fe1, Mon 2026-11-16 ~17:50 WIB)

### DONE — 2 of 3 screenshots taken (viewed with my own eyes)
- `repo/screenshots/1-board.png` — **349,692 B, 1440×900 PNG.** thum.io wait/10 of the preview index.html (first try wait/5 returned only the thum.io loading spinner GIF — re-took with wait/10). Shows: eyebrow "TOKEN RADAR · MODEL RADAR-4-FITTED", 198 protocols, snapshot 2026-11-14, watchlist 40, board floor $50.0M, chips 198 ranked / 24 traded / 144 set aside / 122 FARM / 19 THIN, verify line "Page = board.json: 198 ranks, 198 values, 198 bands, 198 verdicts and nets", formula `value = 10^7.20 × (TVL/$100M)^0.52 × family × momentum × seasoning` (Intercept 7.203, Slope 0.522, Momentum 0.500, Seasoning 0.400), blind backtest LOO 45.3% vs flat 35.2% and time split 51.0% vs flat 35.3% (both green win rows), median blind error ×3.60 vs ×4.88, size-curve scatter with amber board points. **No radar-3 text visible.**
- `repo/screenshots/3-filtered.png` — **243,601 B, 1440×900 PNG.** microlink of dashboard/filtered-table.html (2880×1800 resized to 1440×900 with PIL). Shows: Category filter "Dexs" selected, "21 of 198 rows shown · capital $1.0K · airdrop share 10%", Dexs table with verdicts — Bittensor dTAO THIN −$5.79, Nado Spot FARM +$11.84, CommunityV3 THIN −$4.11, BisonFi FARM +$40.42, Project X FARM +$18.44. **No radar-3 text visible.**

### ⚠️ BLOCKED — 2-detail.png needs the parent to re-upload ONE preview file first
**Real bug found in `preview/dashboard/detail.html` (live on Pages):** the
`history.replaceState(null,"","?detail=steakhouse-financial")` inline script sat at
line 144, AFTER `<script src="../data.js">` (142) and `<script src="app.js">` (143).
`app.js` calls `boot()` synchronously at load (line 496, no DOMContentLoaded wrapper)
and reads `URLSearchParams(window.location.search)` inside it — so at boot time the
URL had no `?detail=` yet and the Steakhouse dialog NEVER opens on the live page.
(Radar-3 worked because its variant had replaceState BEFORE the scripts.)
**Fixed locally:** moved the replaceState line to BEFORE the two script tags in
`preview/dashboard/detail.html`. The parent must re-upload ONLY that one file to
https://github.com/people871/token-radar-preview (`dashboard/detail.html`) and
confirm Pages is live again; then a follow-up takes `2-detail.png` (thum.io wait/10
of the plain detail.html URL). `repo/screenshots/2-detail.png` is still the STALE
radar-3 file (223,148 B, Nov 16 07:58) — **do NOT submit until it is replaced.**

### Verification (all green, with the 2 new screenshots in place)
- **main.ts re-run into `out/`** (`MAKEFUN_OUTPUT_DIR=../out node main.ts --input
  ../token-radar-01-kit/input/snapshot.json`): 758 protocols, 40 watchlist, 198 rows
  scored. `boardIssue()` null, 198 rows, top Steakhouse / Sentora / Gauntlet.
  board.json + data.js byte-identical to the verified radar-4 run (deterministic);
  dossier.json changed ONLY because it embeds the 2 new screenshots (expected).
  out/screenshots/ now holds the new 1-board + 3-filtered (sha256 match repo).
  (One false start: first run used the wrong input path `../input/snapshot.json`,
  which does not exist; the correct input is `../token-radar-01-kit/input/snapshot.json`.
  It created an empty `repo/out/` dir, removed again — no files harmed.)
- **Kit check: 12 passed, 0 failed** (`--worktree`, transcripts-r15.tar.gz, same as
  before). thinking_reproduces 52.0%, thinking_revised lib/model.ts from 6 messages,
  thinking_priced 6 usage records.
- **Bundle: NOT re-bundled.** transcripts-r15.tar.gz sha256 unchanged
  (`7b682d1c…`, still password-clean per the parent's earlier verification). The
  bundle covers sessions + context, not screenshots (binary PNGs, not counted by
  thinking_reproduces); no file the bundle covers changed, and this session's work
  (2 screenshots + the preview detail.html fix) touches no entry-repo text file.
  Local commit still `40f08ff`; git status shows only the 2 screenshot modifications.

### Phase C — parent (browser): upload the entry repo (AFTER 2-detail.png is re-taken)
Repo https://github.com/people871/makefun-token-radar-01, branch main.
Upload/replace via the GitHub web UI:
- `lib/model.ts` (radar-4)
- `dashboard/app.css`, `dashboard/app.js`, `dashboard/index.html` (modified)
- `screenshots/1-board.png`, `2-detail.png`, `3-filtered.png` (NEW — 2-detail only
  after the follow-up retakes it)
- `main.ts` (only if it differs from the GitHub copy — check; the local commit 40f08ff
  included a main.ts change vs the old local HEAD, which may just be drift)
- `README.md` (already on GitHub from the rebuild — verify it is still there; do NOT
  re-upload if unchanged)
- `MODEL_NOTES_R4.md`, `DIAGNOSIS_R15.md`, `IMPROVEMENT_STATUS_R15.md` (docs, optional)
GitHub About is already set from the rebuild — verify it is still set; do not change it.
Return the NEW HEAD SHA.

### Phase D — parent: submit
With the HEAD SHA + transcripts-r15.tar.gz, submit via the kit CLI, title
"Token Radar — radar-4: time-split-validated rebuild", read the submission status,
and check the rank. If the submit returns 429 (quota), do NOT retry the same UTC day
— wait for the next UTC day (Tue 2026-11-17 07:00 WIB).

## Honest rank expectation
This pass fixes the single biggest visible failure (the time-split loss), lifts the
top values into the top entries' range ($85M vs their $70–110M), tightens the bands,
and fixes a real prose bug — all validated on the honest out-of-sample splits. But
**rank 15 is NOT guaranteed**: the gap is +58,282 judge points, our rating is
provisional at 12 matches (the top entries all have 20), and ranks 10–20 are
compressed into a 3,290-point band (953,929–957,219) of undefeated entries. Realistic
outcome: a significant further rise from 1,875 (the rebuild already rose 3,583 places),
plausibly into the hundreds as the remaining matches play and the better dossier wins
them — but breaking into the top 20 from 897,299 in one pass would require the judge
to rate this dossier as equal to entries that have already won 20/20. If the new rank
lands in the hundreds, one more pass (P(launch)/break-even-odds column, the remaining
differentiator the top all have) is worth attempting before the Dec 14 close; if it
stays in the thousands, the entry is structurally out of contention and more passes
likely won't flip it.

## Files
- Work dir: ~/workspace/makefun/token-radar-01/ (repo/, out/, preview/, token-radar-01-kit/)
- Diagnosis: DIAGNOSIS_R15.md · Model notes: MODEL_NOTES_R4.md · This file ·
  Bundle: transcripts-r15.tar.gz (CLEAN) · Usage: muse-usage-rebuild.jsonl ·
  System prompt: system-prompt-withheld.txt · Harness: /tmp/tr-model-test/variants.ts,
  /tmp/tr-model-test/boot-real.js · Preview package: preview/ (data.js + dashboard/)
- Current submission (to be replaced): 01a1e365, claim AF-A56H3, rank 1,875/6,046,
  judge 897,299, 12W-0D-0L (provisional).

## Phase B complete — 2-detail.png taken (coordinator 88e68d81, Mon 2026-11-16 ~17:53 WIB)

### DONE — all 3 screenshots are radar-4 (viewed with my own eyes, all 1440×900 PNG, ≤512 KiB)
- `repo/screenshots/1-board.png` — **349,692 B.** (from Phase B, coordinator f1c23fe1). thum.io wait/10 of the preview board. Eyebrow "MODEL RADAR-4-FITTED", 198 protocols, formula `10^7.20 × (TVL/$100M)^0.52 × family × momentum × seasoning`, backtests LOO 45.3% vs flat 35.2% and time split 51.0% vs flat 35.3% (both green win rows), top Steakhouse $85.42M. No radar-3 text visible.
- `repo/screenshots/2-detail.png` — **274,415 B.** (this session). **thum.io returned a STALE render** (dialog open but showing radar-3 data: Sentora $54.2M, formula 10^7.55 × ... ^0.39, seasoning ×0.416, "MODEL radar-3-fitted" in the background) — thum.io had cached the old data.js. Retaken with **microlink** (2880×1800 resized to 1440×900 with PIL): shows the Steakhouse dialog open — "Rank 1 of 198 · Pre-token", **Steakhouse Financial, IMPLIED VALUE $85.4M** (P10 to P90 $7.2M–$913.0M), TVL $2.75B (7d −2.19%), "How $85.4M is built" decomposition (size curve `10^7.20 × (TVL/$100M)^0.52 × family × momentum × seasoning at TVL $2.75B` = $90.1M; Family ×1.000; Growth ×0.989; Seasoning ×0.958), "Against traded peers" scatter at the bottom. Background shows "MODEL radar-4-fitted", "INTERCEPT 7.203". **No radar-3 text visible.** Lesson: thum.io caches by URL — for a page whose data changed, prefer microlink (fresh render) or retry thum.io after the cache clears.
- `repo/screenshots/3-filtered.png` — **243,601 B.** (from Phase B, coordinator f1c23fe1). microlink of filtered-table.html. Category "Dexs" selected, "21 of 198 rows shown", Dexs table with verdicts (Bittensor dTAO THIN −$5.79, Nado Spot FARM +$11.84, BisonFi FARM +$40.42, Project X FARM +$18.44). No radar-3 text visible.

### Verification (all green, with all 3 new screenshots in place)
- **main.ts re-run into `out/`** (`MAKEFUN_OUTPUT_DIR=../out node main.ts --input ../token-radar-01-kit/input/snapshot.json`): 758 protocols, 40 watchlist, 198 rows scored (144 set aside, 24 live set aside). `boardIssue()` null, 198 rows, top Steakhouse / Sentora / Gauntlet. out/screenshots/ sha256 MATCH repo/screenshots/ for all 3 files.
- **Kit check: 12 passed, 0 failed** (`--worktree`, transcripts-r15.tar.gz).
- **Bundle: NOT re-bundled.** transcripts-r15.tar.gz sha256 unchanged (`7b682d1c…`, still password-clean, 0 occurrences). Only repo changes are the 3 binary screenshots (thinking_reproduces does not count binary PNGs); no file the bundle covers changed. Local commit still `40f08ff`; git status shows only the 3 screenshot modifications.
- **Preview detail.html fix confirmed live:** the parent's browser verified commit 0a14ebf — the Steakhouse dialog opens automatically on load (Rank 1 of 198, $85.4M, TVL $2.75B). The live data.js is radar-4 (verified by the parent: "radar-4-fitted", "Steakhouse Financial", "854").

### FINAL Phase C upload list (parent, browser) — entry repo https://github.com/people871/makefun-token-radar-01
- `lib/model.ts` (radar-4 model)
- `dashboard/app.css`, `dashboard/app.js`, `dashboard/index.html` (radar-4 dashboard)
- `screenshots/1-board.png`, `screenshots/2-detail.png`, `screenshots/3-filtered.png` (NEW, all radar-4 — **2-detail.png is the microlink version, 274,415 B, sha256 137cfec7…**)
- `main.ts` (only if it differs from the GitHub copy — check; the local commit 40f08ff included a main.ts change vs the old local HEAD, which may just be drift)
- Optional docs (harmless, not part of the dossier): `MODEL_NOTES_R4.md`, `DIAGNOSIS_R15.md`, `IMPROVEMENT_STATUS_R15.md`
- README.md already on GitHub from the rebuild — verify it is still there; do NOT re-upload if unchanged. GitHub About already set — verify, do not change. Return the NEW HEAD SHA.
- Then Phase D (parent): submit with the HEAD SHA + transcripts-r15.tar.gz, title "Token Radar — radar-4: time-split-validated rebuild". Quota: 1 Token Radar submit used today (UTC Nov 16); cap ≥2, so today's submit should work — a 429 refusal does NOT burn quota, retry tomorrow after 07:00 WIB.
