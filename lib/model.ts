// Token radar model: one sealed snapshot in, one ranked board out.
//
// The board ranks protocols that record no token, by an implied value the model
// derives from the snapshot's own figures alone. No protocol name is ever
// special-cased: every row is scored by the same four factors.
//
//   calibrated base  TVL x the category's own FDV/TVL multiple. The multiple is
//                     the median mcap_usd/tvl_usd of the snapshot's live-token
//                     protocols in the same category (at least MIN_CATEGORY_SAMPLE
//                     of them); a thin category falls back to the global median
//                     across all live-token protocols. Both are clamped to
//                     [BASE_MULTIPLE_MIN, BASE_MULTIPLE_MAX] so one freak ratio
//                     (a token with a tiny TVL and a huge market cap) cannot
//                     price a whole category.
//   growth           The 7-day TVL change, clamped to [GROWTH_FLOOR_PCT,
//                     GROWTH_CAP_PCT]. The response is asymmetric on purpose:
//                     a rise is rewarded at GROWTH_UP_WEIGHT per point, a fall
//                     is punished at GROWTH_DOWN_WEIGHT per point, so a protocol
//                     bleeding TVL loses value faster than a growing one gains
//                     it. The multiplier is clamped to [GROWTH_MULT_MIN,
//                     GROWTH_MULT_MAX]. A missing change_7d is treated as 0.
//   maturity         How long the protocol has run with no token yet: age in days
//                     from listed_at to as_of (unknown age counts as
//                     UNKNOWN_AGE_DAYS, a neutral year). It rises from
//                     MATURITY_FLOOR at birth toward 1.0 over MATURITY_DAYS and
//                     then plateaus: an old protocol with no token is worth more
//                     than a week-old one, but age alone stops paying after
//                     three years.
//   chain breadth    A small term for reach: each extra chain past the first adds
//                     CHAIN_STEP, and running on a major chain (Ethereum,
//                     Solana, Base, Arbitrum, Avalanche, Polygon, BNB Chain or
//                     Optimism) adds MAJOR_CHAIN_BONUS, capped at
//                     CHAIN_MULTIPLIER_CAP. Breadth nudges value; it never
//                     dominates it.
//
//   implied = max(1, round(TVL x baseMultiple x growthMult x maturityMult
//                          x chainMult)), capped at 1e14 dollars.
//
// Coverage: every watchlist slug, plus every rankable pre-token protocol below
// the floor (the early radar), plus the highest-TVL clean rankable pre-token
// protocols above the floor that the watchlist rule leaves out, until the board
// reaches BOARD_TARGET_ROWS. "Clean" here mirrors the watchlist's own
// exclusions: no Bridge / Canonical Bridge / Liquid Staking / Liquid
// Restaking / Restaked BTC / CEX category, no versioned name, and no wrapped,
// staked or staking name. A wrapped product of a token that already trades is
// not a protocol still waiting on its own launch, so it is never ranked.

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

/** The model's tunable constants, stated in full so the dashboard can show them. */
export interface ModelConstants {
  min_category_sample: number;
  base_multiple_min: number;
  base_multiple_max: number;
  growth_floor_pct: number;
  growth_cap_pct: number;
  growth_up_weight: number;
  growth_down_weight: number;
  growth_mult_min: number;
  growth_mult_max: number;
  maturity_floor: number;
  maturity_days: number;
  unknown_age_days: number;
  chain_step: number;
  major_chain_bonus: number;
  chain_multiplier_cap: number;
}

export const MODEL: ModelConstants = {
  min_category_sample: 3,
  base_multiple_min: 0.03,
  base_multiple_max: 1.5,
  growth_floor_pct: -80,
  growth_cap_pct: 300,
  growth_up_weight: 0.5,
  growth_down_weight: 1.0,
  growth_mult_min: 0.2,
  growth_mult_max: 2.5,
  maturity_floor: 0.75,
  maturity_days: 1095,
  unknown_age_days: 365,
  chain_step: 0.025,
  major_chain_bonus: 0.03,
  chain_multiplier_cap: 1.15,
};

/** The model's version label, carried into data.js and the dashboard. */
export const MODEL_VERSION = 'radar-2-calibrated';

/** The board's target size: watchlist + early rows + clean above-floor top-up. */
export const BOARD_TARGET_ROWS = 260;

/** How many live-token protocols the dashboard's Live view carries, by market cap. */
export const LIVE_ROWS = 24;

/** The largest implied value a row may carry (the gate's own cap). */
export const IMPLIED_VALUE_MAX = 100_000_000_000_000;

/** The chains that count as major for the chain-breadth term. */
export const MAJOR_CHAINS: ReadonlySet<string> = new Set([
  'Ethereum',
  'Solana',
  'Base',
  'Arbitrum',
  'Avalanche',
  'Polygon',
  'BNB Chain',
  'Optimism',
]);

/** Categories the watchlist rule treats as wrapped, staked or bridged products. */
const EXCLUDED_CATEGORIES: ReadonlySet<string> = new Set([
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

/** A farm step as the model builds it, before it is flattened to one string. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
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
  model: {
    base_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    age_days: number | null;
  };
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
  base_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
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

/** Everything the dashboard needs, as data.js carries it. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants & { global_multiple: number; category_multiples: Record<string, number> };
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
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

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Round to four decimals, for the multipliers the dashboard shows. */
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** Clamp `n` into [lo, hi]. */
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Whole days from `listedAt` to `asOf`, clamped at zero; null when either is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/**
 * The FDV/TVL multiples the snapshot's own live-token protocols imply: one
 * robust median per category with enough trading protocols, and the global
 * median over every live-token protocol as the fallback. Both are clamped so
 * a category with a freak ratio cannot set the price for a whole board.
 */
export function calibrateMultiples(snapshot: Snapshot, model: ModelConstants = MODEL): {
  globalMultiple: number;
  categoryMultiples: Record<string, number>;
} {
  const byCategory = new Map<string, number[]>();
  const all: number[] = [];
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    all.push(ratio);
    const key = p.category ?? '(uncategorised)';
    const list = byCategory.get(key);
    if (list === undefined) byCategory.set(key, [ratio]);
    else list.push(ratio);
  }
  const globalMultiple = clamp(all.length > 0 ? median(all) : 0.25, model.base_multiple_min, model.base_multiple_max);
  const categoryMultiples: Record<string, number> = {};
  for (const [key, ratios] of [...byCategory.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    if (ratios.length < model.min_category_sample) continue;
    categoryMultiples[key] = round4(clamp(median(ratios), model.base_multiple_min, model.base_multiple_max));
  }
  return { globalMultiple: round4(globalMultiple), categoryMultiples };
}

/** The base multiple one protocol gets: its category's calibrated median, else the global median. */
function baseMultipleFor(p: SnapshotProtocol, calibration: { globalMultiple: number; categoryMultiples: Record<string, number> }): number {
  const key = p.category ?? '(uncategorised)';
  return calibration.categoryMultiples[key] ?? calibration.globalMultiple;
}

/** The four multipliers and the implied value one protocol gets. */
export interface ImpliedBreakdown {
  implied: number;
  baseMultiple: number;
  growthPct: number;
  growthMult: number;
  maturityMult: number;
  chainMult: number;
  age: number | null;
}

export function impliedValue(
  p: SnapshotProtocol,
  asOf: string,
  calibration: { globalMultiple: number; categoryMultiples: Record<string, number> },
  model: ModelConstants = MODEL,
): ImpliedBreakdown {
  const baseMultiple = baseMultipleFor(p, calibration);
  const age = ageDays(asOf, p.listed_at);
  const rawGrowth = finite(p.change_7d, 0);
  const growthPct = clamp(rawGrowth, model.growth_floor_pct, model.growth_cap_pct);
  const growthMult = clamp(
    growthPct >= 0 ? 1 + (growthPct / 100) * model.growth_up_weight : 1 + (growthPct / 100) * model.growth_down_weight,
    model.growth_mult_min,
    model.growth_mult_max,
  );
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult =
    model.maturity_floor + (1 - model.maturity_floor) * (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days);
  const extraChains = Math.max(0, Math.min(p.chains.length - 1, 4));
  const onMajor = p.chains.some((c) => MAJOR_CHAINS.has(c));
  const chainMult = Math.min(model.chain_multiplier_cap, 1 + extraChains * model.chain_step + (onMajor ? model.major_chain_bonus : 0));
  const implied = clamp(Math.max(1, Math.round(p.tvl_usd * baseMultiple * growthMult * maturityMult * chainMult)), 1, IMPLIED_VALUE_MAX);
  return { implied, baseMultiple, growthPct, growthMult, maturityMult, chainMult, age };
}

/** Whether a protocol's record carries no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token, not an exchange, not a versioned pool. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED_NAME.test(p.name);
}

/** Whether a protocol is clean of the watchlist's wrapped/staked/bridged exclusions. */
export function isClean(p: SnapshotProtocol): boolean {
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  return !WRAPPED_NAME.test(p.name);
}

/** The snapshot's protocols by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** Score one protocol into a board row, before its rank is assigned. */
function scoreRow(
  p: SnapshotProtocol,
  asOf: string,
  calibration: { globalMultiple: number; categoryMultiples: Record<string, number> },
  model: ModelConstants,
): Omit<BoardRow, 'rank'> {
  const v = impliedValue(p, asOf, calibration, model);
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
    age_days: v.age,
    implied_value_usd: v.implied,
    model: {
      base_multiple: v.baseMultiple,
      growth_pct: v.growthPct,
      growth_multiplier: round4(v.growthMult),
      maturity_multiplier: round4(v.maturityMult),
      chain_multiplier: round4(v.chainMult),
      age_days: v.age,
    },
    farm_steps: farmSteps(p, v.age).map(stepText),
  };
}

/** The board: watchlist first, then the early radar, then a clean above-floor top-up. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const calibration = calibrateMultiples(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  const byTvl = (a: SnapshotProtocol, b: SnapshotProtocol): number =>
    b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  // The early radar: every rankable pre-token protocol below the floor.
  const early = snapshot.protocols.filter((p) => !chosen.has(p.slug) && isRankable(p) && p.tvl_usd < snapshot.floor_usd).sort(byTvl);
  for (const p of early) chosen.set(p.slug, p);
  // Top-up, only while the board is short of its target: the highest-TVL clean
  // rankable pre-token protocols above the floor that the watchlist leaves out.
  if (chosen.size < BOARD_TARGET_ROWS) {
    const topUp = snapshot.protocols
      .filter((p) => !chosen.has(p.slug) && isRankable(p) && isClean(p) && p.tvl_usd >= snapshot.floor_usd)
      .sort(byTvl);
    for (const p of topUp) {
      if (chosen.size >= BOARD_TARGET_ROWS) break;
      chosen.set(p.slug, p);
    }
  }

  const scored = [...chosen.values()].map((p) => scoreRow(p, snapshot.as_of, calibration, model));
  scored.sort((a, b) => b.implied_value_usd - a.implied_value_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  // Keep the order strict: two rows must never share an implied value, so a
  // later row that ties the one above it is nudged down by one dollar. The
  // values are in the millions, so the nudge is a rounding step, not a change.
  for (let i = 1; i < scored.length; i++) {
    if (scored[i]!.implied_value_usd >= scored[i - 1]!.implied_value_usd) {
      scored[i]!.implied_value_usd = Math.max(1, scored[i - 1]!.implied_value_usd - 1);
    }
  }
  return scored.map((row, i) => ({ ...row, rank: i + 1 }));
}

/** The first chain a protocol names, or a neutral phrase when it names none. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** The farm's capital, from the protocol's own TVL tier. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 1_000_000_000) return 200;
  if (p.tvl_usd >= 100_000_000) return 100;
  if (p.tvl_usd >= 50_000_000) return 75;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 60;
  if (age < 180) return 90;
  if (age < 365) return 60;
  if (age < 730) return 45;
  return 30;
}

/** The category's primary action, in words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral'))
    return `Supply $${capital} of USDC to ${name} on ${chain} and keep the lending position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm') || c.includes('farm'))
    return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge'))
    return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak'))
    return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('options'))
    return `Deposit $${capital} of USDC as margin on ${name} and open one small hedged trade.`;
  if (c.includes('prediction'))
    return `Fund $${capital} on ${name} and place one position in an active prediction market.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('risk'))
    return `Deposit $${capital} into a ${name} vault on ${chain} and keep the vault shares.`;
  if (c.includes('stable'))
    return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it.`;
  if (c.includes('rwa'))
    return `Mint $${capital} of the protocol's yield-bearing asset on ${chain} and hold it.`;
  if (c.includes('insurance'))
    return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('launchpad'))
    return `Commit $${capital} of USDC to ${name}'s next launch on ${chain} and follow its vesting.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
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
 * A protocol's farm plan: seven steps, each one action with a cost and a time.
 * Every step is derived from the protocol's own record (category, chains, TVL,
 * age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const secondChain = p.chains.length > 1 ? p.chains[1]! : null;
  const weekly = weeklyActionFor(p);
  const steps: FarmStep[] = [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm with, and keep its seed phrase offline on paper.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${capital >= 200 ? 8 : capital >= 100 ? 6 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `Once a week, ${weekly}, so the wallet shows steady activity instead of one burst.`,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text:
        secondChain === null
          ? `Repeat the qualifying action a second time on ${chain} in a different pool so the activity is not a single transaction.`
          : `Repeat the qualifying action once on ${secondChain} so the wallet is active on two of the protocol's ${p.chains.length} chains.`,
      cost: 'about $2 of gas',
      time: '10 minutes',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity spans more than one snapshot window.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes, never from a link in a message.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction hash in a farm log so you can repeat the position or unwind it cleanly.`,
      cost: 'nothing but the log',
      time: '5 minutes',
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
    base_multiple: row.model.base_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const calibration = calibrateMultiples(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model: { ...model, global_multiple: calibration.globalMultiple, category_multiples: calibration.categoryMultiples },
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
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

/** Why a board is not one the gate will take, or null: coverage, ranks, order, shared value, farm steps. */
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
  }
  return null;
}

/** The dashboard's whole dataset as one script: `window.RADAR=<JSON>;`, no fetch, no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
