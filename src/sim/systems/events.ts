// Reactive events with choice forks (GDD section 7). PORTED structurally from
// caravan-and-kingdom/src/sim/systems/events.ts (modifier system, choice forks,
// deterministic per-faction rolls, auto-resolve for AI). The TODO is to weight
// the event table by faction STATE (at war -> mutinies/war heroes; rich & peaceful
// -> corruption/piracy/decadence) so the world feels responsive rather than random.
import type { World, Modifier, PendingEvent } from '../../types.ts';
import { chronicle } from '../chronicle.ts';

const EVENT_INTERVAL = 1000;
const EVENT_DURATION = 500;

export function eventsSystem(world: World) {
  if (world.tick % EVENT_INTERVAL !== 0 || world.tick === 0) return;
  for (const f of world.factions) {
    if (f.eliminated) continue;
    if (f.modifiers) f.modifiers = f.modifiers.filter(m => m.expiresAt > world.tick);
    // TODO(GDD section 7): replace flat roll with a STATE-WEIGHTED table.
    const roll = world.rng.next() * 100;
    if (roll < 15) triggerSupplyCrisis(world, f.id);
    // ... add: war heroes, mutinies, corruption, piracy, decadence (state-gated)
  }
}

function triggerSupplyCrisis(world: World, fid: number) {
  const ev: PendingEvent = {
    id: 'supply_crisis', factionId: fid, tick: world.tick,
    msg: 'A frontier supply crisis threatens output. How does the throne respond?',
    expiresAt: world.tick + 200,
    choices: [
      { id: 'subsidize', text: 'Subsidize the colonies', cost: { energy: 200 } },
      { id: 'ride_it_out', text: 'Ride it out' },
    ],
  };
  world.events.push(ev);
  chronicle(world, 'event', ev.msg, fid);
}

export function addModifier(world: World, fid: number, mod: Modifier) {
  const f = world.factions[fid];
  if (!f.modifiers) f.modifiers = [];
  f.modifiers = f.modifiers.filter(m => m.id !== mod.id);
  f.modifiers.push(mod);
}

export function getModifier(world: World, fid: number, type: string, def = 1.0): number {
  const f = world.factions[fid];
  if (!f?.modifiers) return def;
  let v = def;
  for (const m of f.modifiers) if (m.type === type && m.expiresAt > world.tick) v *= m.value;
  return v;
}

export function resolveEventChoice(world: World, fid: number, eventId: string, choiceId: string) {
  // TODO: apply each fork's consequences (mirror C&K resolveEventChoice), logging
  // the outcome to the Chronicle so the player watches it play out (GDD section 7).
  chronicle(world, 'event', `Resolved ${eventId}: ${choiceId}`, fid);
}

// AI auto-resolves its own events; the player's resolve on timeout to the last choice.
export function resolvePendingEvents(world: World) {
  for (const ev of world.events) {
    if (!ev.choices) continue;
    if (ev.factionId === world.playerFactionId) {
      if (world.tick >= ev.expiresAt) {
        resolveEventChoice(world, ev.factionId, ev.id, ev.choices[ev.choices.length - 1].id);
        ev.choices = undefined;
      }
    } else {
      resolveEventChoice(world, ev.factionId, ev.id, ev.choices[0].id);
      ev.choices = undefined;
    }
  }
  world.events = world.events.filter(e => e.choices);
}
