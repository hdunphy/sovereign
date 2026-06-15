// Trade as an abstracted income flow (GDD section 4). NEW to Sovereign. C&K modeled
// trade with physical caravan AGENTS hauling cargo (agents/, logistics.ts) - all
// of that is intentionally CUT for MVP. Here trade is a net energy trickle scaled
// by surplus, partner demand, tariff/agreement modifiers, and route safety.
// Merchant glyphs on the map are PURELY VISUAL (renderer), no cargo to manage.
import { ECON, DIPLO } from '../../core/constants/index.ts';
import { canTrade, hasPact, hasEmbargo, getRelation, addRelation } from '../diplomacy/relations.ts';
import type { World } from '../../types.ts';

export function tradeSystem(world: World) {
  // For each pair that CAN trade, accrue a net flow into both treasuries and warm
  // relations slightly (the "trade IS the relationship" axis from GDD section 4).
  // TODO: scale flow by tariffStance, per-partner trade agreements, surplus, and
  // route safety (raidable lanes in wartime drop the flow). Track tradeCounts so
  // the Court can convert accumulated trade into relation gains.
  const facs = world.factions.filter(f => !f.eliminated);
  for (let i = 0; i < facs.length; i++) {
    for (let j = i + 1; j < facs.length; j++) {
      const a = facs[i].id, b = facs[j].id;
      if (!canTrade(world, a, b)) continue;
      const agreement = hasPact(world, a, b) ? 1.5 : 1.0;
      const flow = ECON.TRADE_BASE_FLOW * agreement;
      facs[i].stock.energy += flow;
      facs[j].stock.energy += flow;
    }
  }
  void DIPLO; void hasEmbargo; void getRelation; void addRelation;
}
