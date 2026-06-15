// Diplomacy + combat balance constants (GDD section 6, section 8).
// PORTED + TRIMMED from caravan-and-kingdom/src/core/constants/diplo.ts.
// The relations/memory band, pacts, embargoes, truces, and war-exhaustion model
// all carry over directly; siege/soldier-economy knobs were dropped because
// Sovereign auto-resolves combat at nodes rather than running soldier agents.
export const DIPLO = {
  INTERVAL: 50,                // ticks between Court sessions
  // relations (persistent memory - the story layer, GDD section 8)
  TRADE_RELATION: 0.05,        // per trade tick between partners
  DRIFT: 0.8,                  // forgiveness toward 0 per session
  FRIENDLY: 30,
  HOSTILE: -30,
  DECLARE_WAR_PENALTY: -40,
  EMBARGO_PENALTY: -20,
  CAPTURE_PENALTY: -25,
  PEACE_RELATION: -15,
  // pacts / alliances
  PACT_DURATION: 2000,
  PACT_COOLDOWN: 1500,
  PACT_RELATION_REQ: 60,
  EMBARGO_RELATION_REQ: -40,
  // war exhaustion -> drives AI peace (GDD section 6)
  WAR_RELATION: -30,
  EXH_TICK: 0.015,
  EXH_BATTLE_LOSER_COST: 4,
  SUE_THRESHOLD: 70,
  TRUCE_DURATION: 2000,
  // combat (auto-resolve, GDD section 6)
  COMBAT_RANDOM: 0.25,         // +/- random swing on resolved fleet power
  COMBAT_LOSS_RATE: 0.3,       // fraction of losing stack destroyed
} as const;
