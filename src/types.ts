// Central data shapes for the Sovereign simulation.
// ADAPTED from caravan-and-kingdom/src/types.ts. Key domain shifts:
//   hex grid         -> node graph (StarSystem + Lane)
//   food/timber/...  -> energy / alloys / population (per GDD section 5)
//   gold treasury    -> per-faction resource stockpile + Authority
//   settlement       -> colony
//   caravan/villager agents -> abstracted trade flow (no per-ship agents in MVP)
//   soldier agents   -> abstracted fleet power (auto-resolved combat, GDD section 6)

export type Resource = 'energy' | 'alloys' | 'population';
export type Stock = Record<Resource, number>;

// --- The galaxy: a node graph (GDD section 5) ---
export interface StarSystem {
  id: number;
  name: string;
  x: number;                 // layout position (pixels), produced by worldgen
  y: number;
  ownerColonyId: number | null;  // colony that controls this system, if any
  neighbors: number[];       // adjacent system ids (lane endpoints)
  richness: number;          // 0..1 base resource potential of the system
  // --- MARKET-READY DATA MODEL (GDD section 4) ---
  // Built now even though the MVP trade layer is abstracted. The post-MVP
  // supply/demand market is then a slot-in upgrade, not a rewrite: production
  // accrues into `stockpiles`, and `prices` is the hook the MVP reads as FLAT
  // (see sim/market.ts) and the live market will drive from scarcity.
  stockpiles: Stock;         // per-resource goods physically held at this system
  prices: Stock;             // per-resource price; MVP = flat 1.0, market = dynamic
  [key: string]: any;
}

export interface Lane {
  a: number;                 // system id
  b: number;                 // system id
  raidable?: boolean;        // becomes true in wartime (GDD section 6)
  [key: string]: any;
}

// --- Colonies (was Settlement) ---
export type ColonyTier = 'OUTPOST' | 'COLONY' | 'CORE';

export interface Colony {
  id: number;
  factionId: number;
  systemId: number;          // which StarSystem it sits on
  name: string;
  tier: ColonyTier;
  stock: Stock;              // colony working buffer (build accounting). Tradeable
                             // goods live on StarSystem.stockpiles (market-ready, sec 4).
  buildings: string[];
  reach: number;             // tether: jumps of operational reach (GDD section 5)
  happiness: number;         // 0..1 per-system happiness (GDD section 5). Scales output
                             // as a GRADIENT; a strike (0 output) is a stable floor, never
                             // a spiral - output suppression must NEVER lower this further.
  [key: string]: any;
}

// --- Fleets: abstracted military power, dispatched by the Governor (GDD section 6) ---
export interface Fleet {
  id: number;
  factionId: number;
  systemId: number;          // current location
  power: number;             // abstract combat strength
  destSystemId: number | null;
  [key: string]: any;
}

// --- Player levers (GDD section 4) ---
export interface Policy {
  taxRate: number;           // income vs happiness/growth
  militaryRate: number;      // ships vs economy/growth
  expansionDrive: number;    // settle fast vs consolidate
  lifeSupport: number;       // cheap-angry vs expensive-content pops
  tariffStance: number;      // revenue/trade vs volume/goodwill
  [key: string]: any;
}

export interface FactionTraits {
  expand: number;
  trade: number;
  industry: number;
  aggression: number;
  isolationist?: boolean;
  mercantile?: boolean;
  [key: string]: any;
}

export interface Modifier {
  id: string;
  type: string;
  value: number;
  expiresAt: number;
}

export interface Faction {
  id: number;
  name: string;
  color: string;
  persona: string;           // 'Swarm' | 'Megacorp' | 'Fallen' (GDD section 8)
  stock: Stock;              // faction-wide reserves (shared treasury analog)
  authority: number;         // the King's Will (player faction only meaningfully; sec 3)
  stability: number;         // 0..1 empire-wide, rolled up from system happiness (sec 5).
                             // Feeds Authority regen now; post-MVP also rebellion risk.
  traits: FactionTraits;
  policy?: Policy;
  modifiers?: Modifier[];
  eliminated?: boolean;
  [key: string]: any;
}

// --- Diplomacy with persistent memory (GDD section 8) ---
export interface War { a: number; b: number; [key: string]: any; }

export interface Diplo {
  relations: Record<string, number>;  // pairKey -> score (-100..100), persists = memory
  tradeCounts: Record<string, number>;
  wars: War[];
  truces: Record<string, number>;
  embargoes: string[];                // pairKeys
  pacts: Array<{ a: number; b: number; expires: number }>;  // alliances
  grudges?: Record<string, string[]>; // pairKey -> remembered offenses (the story layer)
  [key: string]: any;
}

// --- The Chronicle (GDD section 9) ---
export interface ChronicleEntry {
  tick: number;
  msg: string;
  kind: 'governor' | 'diplomacy' | 'combat' | 'event' | 'system';
  factionId?: number;
}

// --- Events (GDD section 7) ---
export interface EventChoice { id: string; text: string; cost?: Partial<Stock & { authority: number }>; }
export interface PendingEvent {
  id: string;
  factionId: number;
  tick: number;
  msg: string;
  expiresAt: number;
  choices?: EventChoice[];
}

export interface World {
  seed: number;
  tick: number;
  rng: import('./core/rng.ts').Rng;
  systems: Map<number, StarSystem>;
  lanes: Lane[];
  colonies: Colony[];
  fleets: Fleet[];
  factions: Faction[];
  diplo: Diplo;
  chronicle: ChronicleEntry[];
  events: PendingEvent[];
  playerFactionId: number | null;
  nextId: number;
  // --- derived indices, rebuilt each tick (not serialized) ---
  colonyById?: Map<number, Colony>;
  coloniesByFaction?: Map<number, Colony[]>;
  [key: string]: any;
}
