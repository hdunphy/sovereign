// Economic balance constants (GDD section 5). ADAPTED from
// caravan-and-kingdom/src/core/constants/economy.ts - trimmed from ~50 knobs to
// the MVP's three resources plus tether/trade. Tune last (GDD section 11, milestone 8).
export const ECON = {
  // Population (was pop growth in C&K)
  POP_GROWTH_RATE: 0.02,
  POP_DECLINE_RATE: 0.06,
  ENERGY_PER_POP: 0.04,        // upkeep drawn per pop per tick
  // Colony storage
  BASE_STORAGE: 600,
  // Expansion / settling
  OUTPOST_COST: { alloys: 80, population: 10 },
  EXTRACTOR_COST: { alloys: 50 },
  EXPAND_MIN_BUILDINGS: 2,
  // Tether (GDD section 5) - operational reach in graph jumps
  BASE_REACH: 2,
  REACH_PER_TIER: 1,
  STRAND_ATTRITION_PER_TICK: 0.05,   // ramps over several ticks, not instant death
  STRAND_GRACE_TICKS: 8,
  // Trade (abstracted income flow, GDD section 4) - net trickle, no per-ship cargo
  TRADE_BASE_FLOW: 0.5,        // energy/tick per active lane at neutral tariff
  TRADE_RANGE: 6,              // max graph hops for a trade relationship
  // Happiness / Strikes / Stability (GDD section 5) - gradient, not a cliff
  HAPPINESS_NEUTRAL: 0.6,      // baseline target with default sliders
  HAPPINESS_DRIFT: 0.02,       // per tick toward the slider-derived target (lag)
  HAPPINESS_TAX_PENALTY: 0.3,  // happiness lost per +1.0 tax above neutral
  HAPPINESS_SUBSIDY_BONUS: 0.2,// happiness gained per +1.0 life-support above neutral
  STRIKE_FLOOR: 0.05,          // below this happiness, output is fully struck (0)
  OUTPUT_SWEET_SPOT: 1.1,      // small output bonus when happiness is high (a peak to hunt)
} as const;

export const TIERS = {
  OUTPOST: { name: 'Outpost', next: 'COLONY', jobCap: 3, upgradeCost: { alloys: 120, population: 15 } },
  COLONY:  { name: 'Colony',  next: 'CORE',   jobCap: 6, upgradeCost: { alloys: 300, population: 30 } },
  CORE:    { name: 'Core World', next: null,  jobCap: 10, upgradeCost: null },
} as const;
