// Faction roster + personalities (GDD section 8). ADAPTED from
// caravan-and-kingdom/src/core/constants/factions.ts. The trait-scaling idea
// (expand/trade/industry/aggression numbers that drive governor + court behavior)
// ports directly; the roster is replaced by the GDD's three archetypes.
//   The Swarm    - expansionist, reckless; resents being boxed in.
//   The Megacorp - mercantile; loves trade pacts, hates embargos.
//   The Fallen   - isolationist; ignores you until provoked, then devastating.
export const FACTIONS = [
  { id: 0, name: 'You',           color: '#e8d36b', persona: 'Player',
    traits: { expand: 1.0, trade: 1.0, industry: 1.0, aggression: 1.0 } },
  { id: 1, name: 'The Swarm',     color: '#7fd07f', persona: 'Swarm',
    traits: { expand: 1.6, trade: 0.8, industry: 0.9, aggression: 1.3 } },
  { id: 2, name: 'The Megacorp',  color: '#5aa9e6', persona: 'Megacorp',
    traits: { expand: 1.0, trade: 1.6, industry: 1.0, aggression: 0.6, mercantile: true } },
  { id: 3, name: 'The Fallen',    color: '#b06ad0', persona: 'Fallen',
    traits: { expand: 0.4, trade: 0.4, industry: 1.5, aggression: 0.5, isolationist: true } },
];

export const DEFAULT_TRAITS = { expand: 1, trade: 1, industry: 1, aggression: 1 };

export const DEFAULT_POLICY = {
  taxRate: 1.0, militaryRate: 1.0, expansionDrive: 1.0, lifeSupport: 1.0, tariffStance: 1.0,
};
