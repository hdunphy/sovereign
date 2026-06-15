// Authority - the King's Will (GDD section 3). NEW to Sovereign; no analog in C&K
// (which used a free-flowing gold treasury). This single scarce currency gates
// every active player decision and sets the entire tempo of the game.
// All values are PLACEHOLDERS from the GDD - tune LAST (GDD section 11 milestone 8).
export const AUTHORITY = {
  CAP: 100,
  REGEN_PER_TICK: 2,           // modified by Stability at runtime
  // action costs (GDD section 3 table)
  COST: {
    TRADE_AGREEMENT: 15,
    EMBARGO: 25,
    EDICT_MIN: 20,
    EDICT_MAX: 40,
    ALLIANCE: 50,
    DECLARE_WAR: 60,
    SLIDER_PER_NOTCH: 5,       // beyond the free deadband
  },
  SLIDER_DEADBAND: 1,          // notches of free movement before cost kicks in
} as const;
