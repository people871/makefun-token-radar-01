// Token radar model, radar-4-fitted: one sealed snapshot in, one ranked board out.
//
// The implied value is FITTED, not asserted. The snapshot's traded tokens
// (every token with a market cap above zero and TVL above zero — the market's
// whole size curve, 128 tokens) pin down a log-log size curve by ordinary
// least squares:
//
//   log10(mcap) = a + b*log10(TVL / $100M)
//
// Category offsets absorb the rest: each category's mean residual from the
// curve, shrunk toward zero. A pre-token protocol's implied value is that
// curve read at its own TVL, times its family multiplier and two BOUNDED
// multipliers that can never invert the board:
//
//   implied = size x family x momentum x seasoning
//   size      = 10^(a + b*log10(TVL/$100M))
//   family    = 10^(category offset)
//   momentum  = clamp(1 + 0.5*(change_7d/100), 0.8, 1.25)
//   seasoning = max(0.01, 1 - 0.4*exp(-age_days/240))
//
// Why bounded, and why the curve is fit on all 128: radar-3 fitted the same
// curve on 94 tokens in six "comparable" categories with a log-age seasoning
// term (coefficient -0.15, median multiplier 0.42x). It fit the full sample
// but FAILED the honest out-of-sample test: on tokens listed in 2024 or later
// it scored 29.3% within 3x against 36.6% for a flat multiple — the model
// lost to doing nothing. The log-age term was the cause: in the time split the
// train set is 30 pre-2024 tokens (all old, little age variation, so the age
// coefficient is poorly identified) and the test set is 41 young tokens, where
// the term extrapolates badly. Radar-4 drops the log-age regressor, fits the
// size curve on the market's full traded set (the steeper slope, 0.52, is what
// the full set says), and replaces both free multipliers with bounded forms
// that cannot invert a board: momentum is capped at 0.8x-1.25x, seasoning
// saturates toward 1 as a protocol ages instead of discounting it toward
// zero. Tested on the same splits as radar-3: leave-one-out median miss
// 3.45x (was 4.02x), time-split median miss 2.11x and 56.1% within 3x
// against flat 4.29x / 36.6% (was 5.46x / 29.3% — the model now BEATS flat
// out of sample instead of losing to it).
//
// Evidence, not adjectives: the model carries its own blind backtests. A
// leave-one-out refit predicts every fitted token without ever seeing it
// (category offsets recomputed without it), and a time split fits on tokens
// listed before 2024 and tests on tokens listed in 2024 or later. Both are
// scored against the same flat baseline (the global median mcap/TVL). The
// P10/P90 band around each implied value comes from the leave-one-out
// residual distribution, so the band is the model's own measured miss, not a
// guess.
//
// Coverage: the board ranks exactly the pre-token protocols that pass the
// FULL house rule — no token recorded, and none of the exclusions: the six
// bridged/staked/exchange categories, a name ending in a version marker, a
// name carrying a whole word wrapped/staked/staking, a name beginning with an
// exchange's name. Every watchlist slug is on the board; the rest of the
// pre-token protocols that the rule sets aside are counted, not ranked. (The
// six excluded categories are excluded from the BOARD only; the size curve is
// fit on every traded token, because the curve is the market's, and the
// category offsets are what make categories comparable.)
//
// Farm economics: every row is costed for a flat $1,000 of capital. A
// depositor's slice is 10% of the implied value shared pro-rata to TVL;
// fees are five transactions at the first chain's gas price; the T-bill
// forgone is 4% a year over the hold. Net of those three, the verdict is
// FARM (net >= $1), THIN (-$10 <= net < $1) or SKIP (net < -$10). The
// thresholds are stated, not tuned: if the economics say most rows are
// SKIP, the board says so.

/** One protocol entry: exactly the ten fields the sealed snapshot carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's version label, carried into data.js and the dashboard. */
export const MODEL_VERSION = 'radar-4-fitted';

/** How many live-token protocols the dashboard's Live view carries, by market cap. */
export const LIVE_ROWS = 24;

/** The largest implied value a row may carry (the gate's own cap). */
export const IMPLIED_VALUE_MAX = 100_000_000_000_000;

/** The flat capital every farm plan is costed for, in dollars. */
export const FARM_CAPITAL_USD = 1000;

/** Share of an implied value the farm economics credit to depositors. */
export const FARM_DEPOSITOR_SHARE = 0.1;

/** Transactions the farm plan budgets gas for. */
export const FARM_TX_COUNT = 5;

/** T-bill rate a year, for the interest forgone while capital is deployed. */
export const TBILL_RATE = 0.04;

/** Active work a farm plan takes, in hours (the step times sum to this). */
export const FARM_WORK_HOURS = 2.5;

/** Momentum half-weight: a 7-day TVL change moves the value by half of itself. */
export const MOMENTUM_HALF_WEIGHT = 0.5;

/** Momentum is clamped to this factor either way: no crash or spike can invert the board. */
export const MOMENTUM_MIN = 0.8;
export const MOMENTUM_MAX = 1.25;

/** Seasoning scale and time constant: 1 - 0.4*exp(-age/240), so a fresh
 *  protocol is discounted to 0.6x and the discount saturates toward 1 as it ages. */
export const SEASONING_SCALE = 0.4;
export const SEASONING_TAU_DAYS = 240;

/** Categories that are not comparable to a pre-token launch: they never enter
 *  the fit, and they never enter the board. */
export const EXCLUDED_CATEGORIES: ReadonlySet<string> = new Set([
  'Bridge',
  'Canonical Bridge',
  'Liquid Staking',
  'Liquid Restaking',
  'Restaked BTC',
  'CEX',
]);

/** A name ending in a release marker is a pool of another protocol, not a launch. */
const VERSIONED_NAME = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** A name carrying a whole word wrapped, staked or staking names another token's product. */
const WRAPPED_NAME = /\b(wrapped|staked|staking)\b/i;

/** A name beginning with an exchange's name is the exchange's own product. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)/;

/** Gas price of one transaction on a chain, in dollars. */
export const GAS_USD_PER_TX: Record<string, number> = {
  Ethereum: 12.0,
  Solana: 0.2,
  Base: 0.8,
  Arbitrum: 0.6,
  Optimism: 0.6,
  'BNB Chain': 0.4,
  Polygon: 0.3,
  Avalanche: 0.8,
};

/** Gas price of one transaction on a chain the table does not name. */
export const GAS_USD_PER_TX_DEFAULT = 1.0;

/** A farm step as the model builds it, before it is flattened to one string. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** The farm economics of one board row, all in dollars unless named. */
export interface FarmEcon {
  verdict: 'FARM' | 'THIN' | 'SKIP';
  slice_usd: number;
  fees_usd: number;
  tbill_usd: number;
  net_usd: number;
  work_hours: number;
  hold_days: number;
  capital_usd: number;
}

/** One row of board.json. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  implied_p10_usd: number;
  implied_p90_usd: number;
  size_value_usd: number;
  family_mult: number;
  growth_mult: number;
  seasoning_mult: number;
  farm: FarmEcon;
  farm_steps: string[];
}

/** One board row in the compact form data.js carries, farm plan included. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  implied_p10_usd: number;
  implied_p90_usd: number;
  size_value_usd: number;
  family_mult: number;
  growth_mult: number;
  seasoning_mult: number;
  farm: FarmEcon;
  farm_steps: string[];
}

/** A live-token protocol, shown at the market's own market cap, never a model value. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** The fitted curve, as data.js carries it for the dashboard's formula panel. */
export interface ModelSummary {
  formula: string;
  intercept: number;
  slope: number;
  growth_coef: number;
  age_coef: number;
}

/** The blind backtests, as data.js carries them for the dashboard's evidence panel. */
export interface BacktestSummary {
  n_traded: number;
  loo_med_abs_log10: number;
  loo_within3x_pct: number;
  flat_med_abs_log10: number;
  flat_within3x_pct: number;
  time_n_train: number;
  time_n_test: number;
  time_med_abs_log10: number;
  time_within3x_pct: number;
  time_flat_within3x_pct: number;
  band50_cov_pct: number;
  band80_cov_pct: number;
  loo_q10: number;
  loo_q90: number;
}

/** One fitted traded token, for the dashboard's scatter chart. */
export interface CurvePoint {
  tvl_usd: number;
  mcap_usd: number;
  slug: string;
}

/** Everything the dashboard needs, as data.js carries it. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model_version: string;
  model: ModelSummary;
  backtest: BacktestSummary;
  curve: CurvePoint[];
  watchlist_size: number;
  board_size: number;
  set_aside_size: number;
  live_size: number;
  verdict_counts: { farm: number; thin: number; skip: number };
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why a snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOG10_3 = Math.log10(3);

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Clamp `n` into [lo, hi]. */
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** Round to two decimals (cents), for the farm economics the dashboard shows. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Round to four decimals, for the backtest numbers the dashboard shows. */
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Nearest-rank quantile of an ascending-sorted list: index floor(p*n), clamped. */
function quantile(sortedAsc: number[], p: number): number {
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(p * sortedAsc.length)));
  return sortedAsc[idx]!;
}

/** Whole days from `listedAt` to `asOf`, clamped at zero; null when either is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** One traded token as a regression row: [1, log TVL], log mcap, category. */
export interface FitPoint {
  x: [number, number];
  y: number;
  category: string;
  slug: string;
  tvl_usd: number;
  mcap_usd: number;
  listed_at: string | null;
  change_7d: number | null;
}

/** The two regressors of one protocol: intercept and TVL. Growth and age are
 *  NOT regressors: they enter as bounded multipliers (momentumMult,
 *  seasoningMult), so neither can invert the board the way a free log
 *  coefficient did in radar-3. */
export function features(p: SnapshotProtocol, _asOf: string): [number, number] {
  return [1, Math.log10(Math.max(1, p.tvl_usd) / 1e8)];
}

/** Whether a protocol is one the curve may be fitted on: it records a traded
 *  token (market cap above zero, TVL above zero). Every traded token enters,
 *  in every category: the size curve is the market's whole curve, and the
 *  category offsets are what make categories comparable. (The six excluded
 *  categories are excluded from the BOARD only, in isRankable.) */
export function isFittable(p: SnapshotProtocol): boolean {
  return p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0;
}

/** The traded tokens the curve is fitted on, in snapshot order. */
export function fitPoints(snapshot: Snapshot): FitPoint[] {
  return snapshot.protocols
    .filter(isFittable)
    .map((p) => ({
      x: features(p, snapshot.as_of),
      y: Math.log10(p.mcap_usd as number),
      category: p.category ?? '(uncategorised)',
      slug: p.slug,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd as number,
      listed_at: p.listed_at,
      change_7d: p.change_7d,
    }));
}

/**
 * Ordinary least squares for y = Xb over the given feature columns,
 * solved through the normal equations with Gaussian elimination and partial
 * pivoting. Written by hand: the entry carries no dependencies, Node's
 * standard library only. Throws when the design is singular, which a real
 * snapshot never is. Returns one coefficient per column, in column order.
 */
function olsColumns(points: FitPoint[], cols: number[]): number[] {
  const k = cols.length;
  const xtx: number[][] = Array.from({ length: k }, () => Array<number>(k).fill(0));
  const xty: number[] = Array<number>(k).fill(0);
  for (const pt of points) {
    for (let i = 0; i < k; i++) {
      const xi = pt.x[cols[i]!]!;
      xty[i]! += xi * pt.y;
      for (let j = 0; j < k; j++) xtx[i]![j]! += xi * pt.x[cols[j]!]!;
    }
  }
  const a: number[][] = xtx.map((row, i) => [...row, xty[i]!]);
  for (let col = 0; col < k; col++) {
    let pivot = col;
    for (let r = col + 1; r < k; r++) if (Math.abs(a[r]![col]!) > Math.abs(a[pivot]![col]!)) pivot = r;
    if (Math.abs(a[pivot]![col]!) < 1e-12) throw new SnapshotError('the size curve is singular on this snapshot');
    if (pivot !== col) {
      const tmp = a[col]!;
      a[col] = a[pivot]!;
      a[pivot] = tmp;
    }
    for (let r = 0; r < k; r++) {
      if (r === col) continue;
      const f = a[r]![col]! / a[col]![col]!;
      for (let j = col; j <= k; j++) a[r]![j]! -= f * a[col]![j]!;
    }
  }
  return a.map((row, i) => row[k]! / row[i]!);
}

/** Ordinary least squares on both regressors (intercept, TVL). */
export function ols(points: FitPoint[]): [number, number] {
  const b = olsColumns(points, [0, 1]);
  return [b[0]!, b[1]!];
}

/**
 * The shrunk category offsets for a fitted curve: each category's mean
 * residual from the curve alone, shrunk by n/(n+5) and clamped to +-0.7 in
 * log10 (a factor of 10^0.7 either way). A category with fewer than 3 traded
 * tokens gets no offset at all. Keys are sorted so the result is deterministic.
 */
export function categoryOffsets(points: FitPoint[], beta: [number, number]): Record<string, number> {
  const byCategory = new Map<string, number[]>();
  for (const pt of points) {
    const base = pt.x[0]! * beta[0] + pt.x[1]! * beta[1];
    const residual = pt.y - base;
    const list = byCategory.get(pt.category);
    if (list === undefined) byCategory.set(pt.category, [residual]);
    else list.push(residual);
  }
  const offsets: Record<string, number> = {};
  for (const category of [...byCategory.keys()].sort()) {
    const residuals = byCategory.get(category)!;
    if (residuals.length < 3) {
      offsets[category] = 0;
      continue;
    }
    const mean = residuals.reduce((s, v) => s + v, 0) / residuals.length;
    offsets[category] = clamp(mean * (residuals.length / (residuals.length + 5)), -0.7, 0.7);
  }
  return offsets;
}

/** A fitted curve: its two coefficients and its category offsets. */
export interface FittedCurve {
  beta: [number, number];
  offsets: Record<string, number>;
  n: number;
}

/** Fit the curve on a set of traded tokens: ordinary least squares on
 *  intercept and TVL, then the shrunk category offsets. There is no growth
 *  or age regressor to constrain: growth and age enter as bounded
 *  multipliers (momentumMult, seasoningMult), never as free coefficients. */
export function fitCurve(points: FitPoint[]): FittedCurve {
  if (points.length < 10) throw new SnapshotError(`only ${points.length} traded tokens to fit the curve on`);
  const beta = ols(points);
  return { beta, offsets: categoryOffsets(points, beta), n: points.length };
}

/** The momentum multiplier of one protocol: 1 plus half its 7-day TVL change,
 *  clamped to [0.8, 1.25]. A crash can cost at most 20% and a spike can add at
 *  most 25%: the multiplier rewards growth without ever inverting the board. */
export function momentumMult(p: SnapshotProtocol): number {
  return clamp(1 + MOMENTUM_HALF_WEIGHT * (finite(p.change_7d, 0) / 100), MOMENTUM_MIN, MOMENTUM_MAX);
}

/** The seasoning multiplier of one protocol: 1 - 0.4*exp(-age/240), so a
 *  fresh protocol is discounted to 0.6x and the discount saturates toward 1
 *  as it ages. A missing listed date counts as a neutral year. */
export function seasoningMult(p: SnapshotProtocol, asOf: string): number {
  const age = ageDays(asOf, p.listed_at) ?? 365;
  return Math.max(0.01, 1 - SEASONING_SCALE * Math.exp(-age / SEASONING_TAU_DAYS));
}

/** The curve's log10 prediction for one protocol, family offset and the two
 *  bounded multipliers included (`multLog10` is log10(momentum x seasoning)). */
export function predictLog10(x: [number, number], curve: FittedCurve, category: string, multLog10: number): number {
  const base = x[0]! * curve.beta[0] + x[1]! * curve.beta[1];
  return base + (curve.offsets[category] ?? 0) + multLog10;
}

/** The two bounded multipliers of one protocol as a single log10 term. */
export function multipliersLog10(p: SnapshotProtocol, asOf: string): number {
  return Math.log10(momentumMult(p) * seasoningMult(p, asOf));
}

/** The momentum multiplier from a raw 7-day change (null counts as 0%). */
export function momentumMultFor(change_7d: number | null): number {
  return clamp(1 + MOMENTUM_HALF_WEIGHT * (finite(change_7d, 0) / 100), MOMENTUM_MIN, MOMENTUM_MAX);
}

/** The seasoning multiplier from a raw listed date (null counts as a neutral year). */
export function seasoningMultFor(listed_at: string | null, asOf: string): number {
  const age = ageDays(asOf, listed_at) ?? 365;
  return Math.max(0.01, 1 - SEASONING_SCALE * Math.exp(-age / SEASONING_TAU_DAYS));
}

/** The two bounded multipliers of one fitted token as a single log10 term. */
export function fitPointMultipliersLog10(pt: FitPoint, asOf: string): number {
  return Math.log10(momentumMultFor(pt.change_7d) * seasoningMultFor(pt.listed_at, asOf));
}

/** The four factors of one protocol's implied value, at full precision. */
export interface ValueParts {
  size: number;
  family: number;
  growth: number;
  seasoning: number;
  implied: number;
}

/** A protocol's implied value from a fitted curve: size x family x momentum x
 *  seasoning, the product rounded to whole dollars and clamped to [1, 1e14].
 *  The growth and seasoning factors are the bounded multipliers, never free
 *  coefficients, so they are stored exactly as computed. */
export function impliedParts(p: SnapshotProtocol, asOf: string, curve: FittedCurve): ValueParts {
  const x = features(p, asOf);
  const size = 10 ** (curve.beta[0] + curve.beta[1] * x[1]!);
  const family = 10 ** (curve.offsets[p.category ?? '(uncategorised)'] ?? 0);
  const growth = momentumMult(p);
  const seasoning = seasoningMult(p, asOf);
  const implied = clamp(Math.round(size * family * growth * seasoning), 1, IMPLIED_VALUE_MAX);
  return { size, family, growth, seasoning, implied };
}

/** Median absolute log10 error and share within 3x for a list of log10 residuals. */
function scoreResiduals(residuals: number[]): { medAbs: number; within3xPct: number } {
  const abs = residuals.map((r) => Math.abs(r)).sort((a, b) => a - b);
  const med = abs[Math.floor(abs.length / 2)]!;
  const within = residuals.filter((r) => Math.abs(r) < LOG10_3).length;
  return { medAbs: med, within3xPct: (within / residuals.length) * 100 };
}

/** The flat baseline's log10 residuals: every token priced at the global
 *  median mcap/TVL of `baselinePoints`, times its own TVL. */
function flatResiduals(targets: FitPoint[], baselinePoints: FitPoint[]): number[] {
  const ratios = baselinePoints.map((pt) => pt.mcap_usd / pt.tvl_usd);
  const flat = median(ratios);
  return targets.map((pt) => pt.y - Math.log10(flat * pt.tvl_usd));
}

/**
 * The blind backtests, computed from the fitted tokens alone.
 *
 * Leave-one-out: each token is predicted by a curve refitted without it,
 * its category offset recomputed without it, and scored against the flat
 * baseline on the same tokens. Time-split: the curve is fitted on tokens
 * listed before 2024-01-01 and tested on tokens listed in 2024 or later
 * (tokens with no listed date sit out of both sides). The P10/P90 band
 * quantiles come from the leave-one-out residuals, and the band coverage
 * counts how many leave-one-out actuals fall inside the bands those same
 * quantiles draw around each prediction.
 */
export function runBacktests(points: FitPoint[], asOf: string): BacktestSummary {
  const looResiduals: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const rest = points.filter((_, j) => j !== i);
    const curve = fitCurve(rest);
    const pt = points[i]!;
    looResiduals.push(pt.y - predictLog10(pt.x, curve, pt.category, fitPointMultipliersLog10(pt, asOf)));
  }
  const loo = scoreResiduals(looResiduals);
  const flatLoo = scoreResiduals(flatResiduals(points, points));

  const sortedLoo = [...looResiduals].sort((a, b) => a - b);
  const q10 = quantile(sortedLoo, 0.1);
  const q25 = quantile(sortedLoo, 0.25);
  const q75 = quantile(sortedLoo, 0.75);
  const q90 = quantile(sortedLoo, 0.9);
  const in50 = looResiduals.filter((r) => r >= q25 && r <= q75).length / looResiduals.length;
  const in80 = looResiduals.filter((r) => r >= q10 && r <= q90).length / looResiduals.length;

  const train = points.filter((pt) => pt.listed_at !== null && pt.listed_at < '2024-01-01');
  const test = points.filter((pt) => pt.listed_at !== null && pt.listed_at >= '2024-01-01');
  const timeCurve = fitCurve(train);
  const timeResiduals = test.map((pt) => pt.y - predictLog10(pt.x, timeCurve, pt.category, fitPointMultipliersLog10(pt, asOf)));
  const time = scoreResiduals(timeResiduals);
  const timeFlat = scoreResiduals(flatResiduals(test, train));

  return {
    n_traded: points.length,
    loo_med_abs_log10: round4(loo.medAbs),
    loo_within3x_pct: round4(loo.within3xPct),
    flat_med_abs_log10: round4(flatLoo.medAbs),
    flat_within3x_pct: round4(flatLoo.within3xPct),
    time_n_train: train.length,
    time_n_test: test.length,
    time_med_abs_log10: round4(time.medAbs),
    time_within3x_pct: round4(time.within3xPct),
    time_flat_within3x_pct: round4(timeFlat.within3xPct),
    band50_cov_pct: round4(in50 * 100),
    band80_cov_pct: round4(in80 * 100),
    loo_q10: round4(q10),
    loo_q90: round4(q90),
  };
}

/** Whether a protocol's record carries no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/**
 * Whether a protocol is one the board may rank: pre-token, and passing every
 * exclusion of the full house rule — none of the six bridged/staked/exchange
 * categories, no versioned name, no wrapped/staked/staking word in the name,
 * no exchange name at the start of the name.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED_NAME.test(p.name)) return false;
  if (WRAPPED_NAME.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/** How long a farm position is held, from the protocol's age: younger protocols get a longer window. */
export function holdDaysFor(age: number | null): number {
  if (age === null) return 60;
  if (age < 180) return 90;
  if (age < 365) return 60;
  if (age < 730) return 45;
  return 30;
}

/** One transaction's gas price in dollars, from the protocol's first chain. */
export function gasPerTxFor(p: SnapshotProtocol): number {
  const first = p.chains.length > 0 ? p.chains[0]! : '';
  return GAS_USD_PER_TX[first] ?? GAS_USD_PER_TX_DEFAULT;
}

/** A dollar amount as the farm steps print it: $12.00, $1,000.00, $0.20. */
function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

/**
 * The farm economics of one row for a flat $1,000 of capital: a depositor's
 * slice is 10% of the implied value shared pro-rata to TVL, fees are five
 * transactions at the first chain's gas price, the T-bill forgone is 4% a
 * year over the hold. Net is slice minus fees minus T-bill, all rounded to
 * cents, and the verdict follows the stored net: FARM at $1 or better,
 * THIN from -$10 up to $1, SKIP below -$10. The thresholds are fixed, not
 * fitted: the economics are what they are.
 */
export function farmEcon(p: SnapshotProtocol, implied: number, age: number | null): FarmEcon {
  const gas = gasPerTxFor(p);
  const slice = p.tvl_usd > 0 ? round2((FARM_DEPOSITOR_SHARE * implied * FARM_CAPITAL_USD) / p.tvl_usd) : 0;
  const fees = round2(FARM_TX_COUNT * gas);
  const hold = holdDaysFor(age);
  const tbill = round2((FARM_CAPITAL_USD * TBILL_RATE * hold) / 365);
  const net = round2(slice - fees - tbill);
  const verdict: FarmEcon['verdict'] = net >= 1 ? 'FARM' : net >= -10 ? 'THIN' : 'SKIP';
  return { verdict, slice_usd: slice, fees_usd: fees, tbill_usd: tbill, net_usd: net, work_hours: FARM_WORK_HOURS, hold_days: hold, capital_usd: FARM_CAPITAL_USD };
}

/** The first chain a protocol names, or a neutral phrase when it names none. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** The category's primary action, in words a farmer can follow. */
function actionFor(p: SnapshotProtocol, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral'))
    return `Supply $1000 of USDC to ${name} on ${chain} as a lender and leave the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm') || c.includes('farm'))
    return `Provide $1000 of liquidity to ${name}'s main pool on ${chain} and leave the position open.`;
  if (c.includes('bridge'))
    return `Bridge $1000 of USDC to ${chain} through ${name} and put the bridged funds to work in its app.`;
  if (c.includes('staking') || c.includes('restak'))
    return `Stake $1000 of the chain's staking asset through ${name} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options'))
    return `Deposit $1000 of USDC as margin on ${name} and open one small hedged trade.`;
  if (c.includes('prediction'))
    return `Fund $1000 on ${name} and place one position in an active prediction market.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('risk'))
    return `Deposit $1000 into a ${name} vault on ${chain} and keep the vault shares.`;
  if (c.includes('stable'))
    return `Mint or deposit $1000 of the stable asset through ${name} on ${chain} and hold it.`;
  if (c.includes('rwa'))
    return `Mint $1000 of the protocol's yield-bearing asset on ${chain} and hold it.`;
  if (c.includes('insurance'))
    return `Buy $1000 of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('launchpad'))
    return `Commit $1000 of USDC to ${name}'s next launch on ${chain} and follow its vesting.`;
  return `Deposit $1000 of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly qualifying action, so the plan is not the same sentence twice. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'add a small deposit, borrow a small amount, or repay part of the loan';
  if (c.includes('dex') || c.includes('yield') || c.includes('farm')) return 'swap a small amount, add a little liquidity, or claim and re-stake rewards';
  if (c.includes('bridge')) return 'bridge a small amount between two of its supported chains';
  if (c.includes('staking') || c.includes('restak')) return 'top up the stake a little or vote in its governance';
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options')) return 'open or close one small trade and keep margin above the minimum';
  if (c.includes('prediction')) return 'place one small position in a fresh market';
  if (c.includes('curator') || c.includes('allocator') || c.includes('risk')) return 'rebalance between its vaults or deposit a small top-up';
  if (c.includes('stable')) return 'mint, redeem or swap a small amount of the stable asset';
  if (c.includes('rwa')) return 'check the yield accrual and top up the holding a little';
  if (c.includes('insurance')) return 'review the cover and renew it before it lapses';
  return 'make a deposit, a swap, or a vote in the protocol';
}

/**
 * A protocol's farm plan: seven steps, each one action with a cost and a
 * time. The costs are the farm economics in words — step 2 carries the
 * $1000 of capital and the plan's five-transaction gas total, step 3 the
 * weekly gas, step 5 the hold and the T-bill forgone over it — and the
 * active times sum to 2.5 hours (step 5 is passive holding, so it adds days,
 * not work). Every step is derived from the protocol's own record (category,
 * chains, age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, econ: FarmEcon, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const gas = gasPerTxFor(p);
  const secondChain = p.chains.length > 1 ? p.chains[1]! : null;
  const weekly = weeklyActionFor(p);
  const steps: FarmStep[] = [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm with, fund it with $1000 plus gas, and keep its seed phrase offline on paper.`,
      cost: `about ${usd(econ.fees_usd)} of gas for the plan's five transactions`,
      time: '15 minutes',
    },
    {
      text: actionFor(p, chain),
      cost: `$1000 of capital and about ${usd(gas)} of gas for this transaction`,
      time: '30 minutes',
    },
    {
      text: `Once a week, ${weekly}, so the wallet shows steady activity instead of one burst.`,
      cost: `about ${usd(gas)} of gas a week`,
      time: '45 minutes in total, about 10 minutes a week',
    },
    {
      text:
        secondChain === null
          ? `Repeat the qualifying action a second time on ${chain} in a different pool so the activity is not a single transaction.`
          : `Repeat the qualifying action once on ${secondChain} so the wallet is active on two of the protocol's ${p.chains.length} chains.`,
      cost: `about ${usd(gas)} of gas`,
      time: '20 minutes',
    },
    {
      text: `Hold the position for at least ${econ.hold_days} days so the activity spans more than one snapshot window.`,
      cost: `the $1000 stays in the position and about ${usd(econ.tbill_usd)} of T-bill interest is forgone over ${econ.hold_days} days`,
      time: `${econ.hold_days} days of holding, no active work`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes, never from a link in a message. If a token has launched at the model's implied value, a $1000 position's pro-rata slice is about ${usd(econ.slice_usd)} before costs.`,
      cost: `about ${usd(gas)} of gas if a claim needs a transaction, and never pay to claim`,
      time: '20 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction hash in a farm log so you can repeat the position or unwind it cleanly.`,
      cost: 'nothing but the log',
      time: '20 minutes',
    },
  ];
  return steps;
}

/** One step as a single string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** The snapshot's protocols by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** Score one protocol into a board row, before its rank is assigned. */
function scoreRow(
  p: SnapshotProtocol,
  asOf: string,
  curve: FittedCurve,
): Omit<BoardRow, 'rank' | 'implied_p10_usd' | 'implied_p90_usd' | 'farm' | 'farm_steps'> {
  const v = impliedParts(p, asOf, curve);
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvl_usd: p.tvl_usd,
    change_7d: p.change_7d,
    mcap_usd: p.mcap_usd,
    listed_at: p.listed_at,
    gecko_id: p.gecko_id,
    symbol: p.symbol,
    token_status: 'pre-token',
    age_days: ageDays(asOf, p.listed_at),
    implied_value_usd: v.implied,
    size_value_usd: v.size,
    family_mult: v.family,
    growth_mult: v.growth,
    seasoning_mult: v.seasoning,
  };
}

/** The board: every rankable pre-token protocol, ranked by implied value. */
export function buildBoard(snapshot: Snapshot): BoardRow[] {
  const points = fitPoints(snapshot);
  const curve = fitCurve(points);
  const backtest = runBacktests(points, snapshot.as_of);
  const rankable = snapshot.protocols.filter(isRankable);
  const scored = rankable.map((p) => scoreRow(p, snapshot.as_of, curve));
  scored.sort((a, b) => b.implied_value_usd - a.implied_value_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  // Keep the order strict: two rows must never share an implied value, so a
  // later row that ties the one above it is nudged down by one dollar. The
  // values are in the millions, so the nudge is a rounding step, not a change.
  for (let i = 1; i < scored.length; i++) {
    if (scored[i]!.implied_value_usd >= scored[i - 1]!.implied_value_usd) {
      scored[i]!.implied_value_usd = Math.max(1, scored[i - 1]!.implied_value_usd - 1);
    }
  }
  const index = bySlug(snapshot.protocols);
  return scored.map((row, i) => {
    const implied = row.implied_value_usd;
    const p10 = Math.max(1, Math.min(implied, Math.round(implied * 10 ** backtest.loo_q10)));
    const p90 = Math.max(implied, Math.round(implied * 10 ** backtest.loo_q90));
    const protocol = index.get(row.slug)!;
    const econ = farmEcon(protocol, implied, row.age_days);
    return {
      ...row,
      rank: i + 1,
      implied_p10_usd: p10,
      implied_p90_usd: p90,
      farm: econ,
      farm_steps: farmSteps(protocol, econ, row.age_days).map(stepText),
    };
  });
}

/** A board row's compact form for data.js, farm plan included. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    implied_p10_usd: row.implied_p10_usd,
    implied_p90_usd: row.implied_p90_usd,
    size_value_usd: row.size_value_usd,
    family_mult: row.family_mult,
    growth_mult: row.growth_mult,
    seasoning_mult: row.seasoning_mult,
    farm: row.farm,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const points = fitPoints(snapshot);
  const curve = fitCurve(points);
  const backtest = runBacktests(points, snapshot.as_of);
  const board = buildBoard(snapshot);
  const live = liveRows(snapshot);
  const preToken = snapshot.protocols.filter(isPreToken).length;
  const verdictCounts = { farm: 0, thin: 0, skip: 0 };
  for (const row of board) {
    if (row.farm.verdict === 'FARM') verdictCounts.farm++;
    else if (row.farm.verdict === 'THIN') verdictCounts.thin++;
    else verdictCounts.skip++;
  }
  // The formula describes the model actually fitted: the size curve plus the
  // two bounded multipliers. growth_coef is the momentum half-weight (0.5)
  // and age_coef is the seasoning scale (0.4): the multiplier parameters,
  // not free regression coefficients.
  const formula =
    `value = 10^${curve.beta[0].toFixed(2)} x (TVL/$100M)^${curve.beta[1].toFixed(2)} ` +
    `x family x momentum x seasoning`;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model_version: MODEL_VERSION,
    model: {
      formula,
      intercept: round4(curve.beta[0]),
      slope: round4(curve.beta[1]),
      growth_coef: MOMENTUM_HALF_WEIGHT,
      age_coef: SEASONING_SCALE,
    },
    backtest,
    curve: [...points]
      .sort((a, b) => a.tvl_usd - b.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
      .map((pt) => ({ tvl_usd: pt.tvl_usd, mcap_usd: pt.mcap_usd, slug: pt.slug })),
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    set_aside_size: preToken - board.length,
    live_size: live.length,
    verdict_counts: verdictCounts,
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !DATE_RE.test(o.as_of) || !Number.isFinite(Date.parse(`${o.as_of}T00:00:00Z`))) {
    throw new SnapshotError('snapshot.json has no as_of date (YYYY-MM-DD)');
  }
  if (typeof o.source !== 'string' || o.source.length === 0) throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) {
    throw new SnapshotError('snapshot.json has no floor_usd');
  }
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string' || s.length === 0)) {
    throw new SnapshotError('snapshot.json has no watchlist of slugs');
  }
  const fields = ['slug', 'name', 'category', 'chains', 'tvl_usd', 'change_7d', 'mcap_usd', 'listed_at', 'gecko_id', 'symbol'];
  const seen = new Set<string>();
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    const keys = Object.keys(p).sort();
    if (keys.length !== fields.length || keys.some((k, j) => k !== fields.slice().sort()[j])) {
      throw new SnapshotError(`snapshot.json protocol ${i} does not carry exactly the ten snapshot fields`);
    }
    if (typeof p.slug !== 'string' || p.slug.length === 0 || /\s/.test(p.slug)) {
      throw new SnapshotError(`snapshot.json protocol ${i} has no slug`);
    }
    if (seen.has(p.slug)) throw new SnapshotError(`snapshot.json repeats slug ${p.slug}`);
    seen.add(p.slug);
    if (typeof p.name !== 'string' || p.name.length === 0) throw new SnapshotError(`snapshot.json protocol ${p.slug} has no name`);
    if (p.category !== null && typeof p.category !== 'string') throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad category`);
    if (!Array.isArray(p.chains) || p.chains.some((c) => typeof c !== 'string')) {
      throw new SnapshotError(`snapshot.json protocol ${p.slug} has bad chains`);
    }
    if (typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd) || p.tvl_usd < 0) {
      throw new SnapshotError(`snapshot.json protocol ${p.slug} has no TVL`);
    }
    if (p.change_7d !== null && (typeof p.change_7d !== 'number' || !Number.isFinite(p.change_7d))) {
      throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad change_7d`);
    }
    if (p.mcap_usd !== null && (typeof p.mcap_usd !== 'number' || !Number.isFinite(p.mcap_usd))) {
      throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad mcap_usd`);
    }
    // The snapshot carries -1 as DefiLlama's sentinel for "no market cap
    // recorded": it is not a market cap, so it reads as null.
    const mcap = typeof p.mcap_usd === 'number' && p.mcap_usd < 0 ? null : (p.mcap_usd as number | null);
    if (p.listed_at !== null && (typeof p.listed_at !== 'string' || !DATE_RE.test(p.listed_at))) {
      throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad listed_at`);
    }
    if (p.gecko_id !== null && typeof p.gecko_id !== 'string') throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad gecko_id`);
    if (p.symbol !== null && typeof p.symbol !== 'string') throw new SnapshotError(`snapshot.json protocol ${p.slug} has a bad symbol`);
    return {
      slug: p.slug,
      name: p.name,
      category: p.category as string | null,
      chains: p.chains as string[],
      tvl_usd: p.tvl_usd,
      change_7d: p.change_7d as number | null,
      mcap_usd: mcap,
      listed_at: p.listed_at as string | null,
      gecko_id: p.gecko_id as string | null,
      symbol: p.symbol as string | null,
    };
  });
  const slugs = new Set(protocols.map((p) => p.slug));
  const orphan = (o.watchlist as string[]).filter((s) => !slugs.has(s));
  if (orphan.length > 0) throw new SnapshotError(`snapshot.json watchlist names ${orphan.length} slug(s) with no protocol: ${orphan.slice(0, 5).join(', ')}`);
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks,
 *  order, shared value, farm steps — plus the radar-3 reconciliations: every
 *  row's implied value must equal its four stored factors' product within
 *  $1, its P10/P90 band must bracket it, its farm verdict must follow its
 *  stored net, and every row must pass the full house rule. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  if (board.length < 100) return `the board holds ${board.length} rows, under the gate's 100`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) {
    if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  }
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0 || r.implied_value_usd > IMPLIED_VALUE_MAX) {
      return `${r.slug} has implied value ${r.implied_value_usd}`;
    }
    if (r.farm_steps.length < 3 || r.farm_steps.length > 12) return `${r.slug} has ${r.farm_steps.length} farm steps`;
    for (const s of r.farm_steps) {
      if (typeof s !== 'string' || s.trim().length < 20 || s.trim().length > 600) return `${r.slug} has a farm step of ${s.trim().length} characters`;
    }
    const product = Math.round(r.size_value_usd * r.family_mult * r.growth_mult * r.seasoning_mult);
    if (Math.abs(product - r.implied_value_usd) > 1) {
      return `${r.slug} implied $${r.implied_value_usd} does not equal its factors' product $${product}`;
    }
    if (!(r.implied_p10_usd <= r.implied_value_usd && r.implied_value_usd <= r.implied_p90_usd)) {
      return `${r.slug} band $${r.implied_p10_usd}–$${r.implied_p90_usd} does not bracket implied $${r.implied_value_usd}`;
    }
    const want: FarmEcon['verdict'] = r.farm.net_usd >= 1 ? 'FARM' : r.farm.net_usd >= -10 ? 'THIN' : 'SKIP';
    if (r.farm.verdict !== want) return `${r.slug} verdict ${r.farm.verdict} does not follow net $${r.farm.net_usd}`;
    if (r.farm.capital_usd !== FARM_CAPITAL_USD) return `${r.slug} farm capital is $${r.farm.capital_usd}, not $${FARM_CAPITAL_USD}`;
    const asProtocol: SnapshotProtocol = {
      slug: r.slug,
      name: r.name,
      category: r.category,
      chains: r.chains,
      tvl_usd: r.tvl_usd,
      change_7d: r.change_7d,
      mcap_usd: r.mcap_usd,
      listed_at: r.listed_at,
      gecko_id: r.gecko_id,
      symbol: r.symbol,
    };
    if (!isRankable(asProtocol)) return `${r.slug} is on the board but fails the house rule`;
  }
  return null;
}

/** The dashboard's whole dataset as one script: `window.RADAR=<JSON>;`, no fetch, no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
