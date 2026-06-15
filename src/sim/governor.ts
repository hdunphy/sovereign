// The Governance Layer (GDD section 5). ADAPTED from caravan-and-kingdom/src/sim/governors/.
// C&K ran four parallel governors (civil/labor/trade/transport) per settlement to
// avoid deadlock. The GDD deliberately COLLAPSES this for MVP into:
//   (a) a thin STRATEGIC step (once/tick): player sliders -> budget split across
//       Expansion / Infrastructure / Military pools.
//   (b) a concurrent EXECUTION step: each colony runs the SAME small utility-picker
//       against its local options, drawing only from the relevant pool.
// Determinism holds via fixed colony iteration order (port this discipline from C&K).
// Every decision logs ONE reason line to the Chronicle (GDD section 5, the anti-rage-quit
// feature) - port the logging habit from C&K's governors verbatim.
import { ECON, TIERS } from '../core/constants/index.ts';
import { withinReach } from '../core/graph.ts';
import { chronicle } from './chronicle.ts';
import { withdraw } from './market.ts';
import { foundColony } from './worldgen.ts';
import type { World, Colony, Faction } from '../types.ts';

const AI_INTERVAL = 10; // governors deliberate every N ticks (same cadence as C&K)

export function governorSystem(world: World) {
  if (world.tick % AI_INTERVAL !== 0) return;
  for (const f of world.factions) {
    if (f.eliminated) continue;
    const pools = strategicSplit(world, f);            // thin strategic step
    const colonies = (world.coloniesByFaction?.get(f.id) ?? []);
    for (const c of colonies) executeColony(world, c, pools);  // concurrent execution
  }
}

interface BudgetPools { expansion: number; infrastructure: number; military: number; }

// Thin strategic step: turn the faction's policy sliders into a budget split.
// TODO: weight by sliders (expansionDrive, militaryRate) + faction traits.
function strategicSplit(world: World, f: Faction): BudgetPools {
  const p = f.policy!;
  const exp = p.expansionDrive ?? 1;
  const mil = p.militaryRate ?? 1;
  const total = exp + mil + 1;
  return { expansion: exp / total, infrastructure: 1 / total, military: mil / total };
}

// One reusable local utility-picker, run per colony. Picks the single highest-
// utility action this tick and logs its reason.
function executeColony(world: World, c: Colony, pools: BudgetPools) {
  const sys = world.systems.get(c.systemId);
  if (!sys) return;

  const tierDef = TIERS[c.tier];
  let bestAction: any = null;
  let bestScore = -1;

  // 1. Consider Build
  if (c.buildings.length < tierDef.jobCap && sys.stockpiles.alloys >= ECON.EXTRACTOR_COST.alloys) {
    const score = pools.infrastructure * 100;
    if (score > bestScore) {
      bestScore = score;
      bestAction = { type: 'BUILD', score };
    }
  }

  // 2. Consider Upgrade
  if (tierDef.next && c.buildings.length >= tierDef.jobCap) {
    const cost = tierDef.upgradeCost!;
    if (sys.stockpiles.alloys >= cost.alloys && c.stock.population >= cost.population) {
      const score = pools.infrastructure * 150 + pools.expansion * 50; 
      if (score > bestScore) {
        bestScore = score;
        bestAction = { type: 'UPGRADE', score };
      }
    }
  }

  // 3. Consider Expand
  const costExpand = ECON.OUTPOST_COST;
  if (sys.stockpiles.alloys >= costExpand.alloys && c.stock.population >= costExpand.population) {
    const reachable = withinReach(world, c.systemId, c.reach);
    for (const tgtId of reachable) {
      const tgt = world.systems.get(tgtId);
      if (tgt && tgt.ownerColonyId == null) {
        const score = pools.expansion * (100 + tgt.richness * 100);
        if (score > bestScore) {
          bestScore = score;
          bestAction = { type: 'EXPAND', tgtId, name: tgt.name, score };
        }
      }
    }
  }

  if (!bestAction) return;

  if (bestAction.type === 'BUILD') {
    withdraw(world, c.systemId, 'alloys', ECON.EXTRACTOR_COST.alloys);
    c.buildings.push('EXTRACTOR');
    chronicle(world, 'governor', `${c.name}: Built Extractor (infrastructure priority)`, c.factionId);
  } else if (bestAction.type === 'UPGRADE') {
    const cost = tierDef.upgradeCost!;
    withdraw(world, c.systemId, 'alloys', cost.alloys);
    c.stock.population -= cost.population;
    c.tier = tierDef.next as any;
    chronicle(world, 'governor', `${c.name}: Upgraded to ${TIERS[c.tier].name} (growth priority)`, c.factionId);
  } else if (bestAction.type === 'EXPAND') {
    withdraw(world, c.systemId, 'alloys', costExpand.alloys);
    c.stock.population -= costExpand.population;
    foundColony(world, c.factionId, bestAction.tgtId, 'OUTPOST');
    chronicle(world, 'governor', `${c.name}: Founded outpost at ${bestAction.name} (expansion priority)`, c.factionId);
  }
}
