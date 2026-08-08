/**
 * Deterministic builder title generator with reshuffle offset support.
 * Generates a 2-word title based on the user's name + role string.
 */

const FIRST_WORDS = [
  'SIGNAL', 'STACK', 'RUNTIME', 'PROTOCOL', 'DEPLOY',
  'CHAIN', 'BUILD', 'KERNEL', 'EDGE', 'CORE',
  'ROOT', 'FORK', 'NODE', 'PATCH', 'MERGE',
  'SHIP', 'ZERO', 'ALPHA', 'GHOST', 'PRIME',
  'VOID', 'FLUX', 'DELTA', 'CIPHER', 'ATLAS',
  'RELAY', 'MESH', 'ORBIT', 'NEXUS', 'VECTOR',
];

const SECOND_WORDS = [
  'ARCHITECT', 'ORACLE', 'MONK', 'GHOST', 'BUILDER',
  'OPERATOR', 'PIONEER', 'NOMAD', 'CATALYST', 'SENTINEL',
  'ENGINEER', 'ALCHEMIST', 'NAVIGATOR', 'DIRECTOR', 'COMPILER',
  'SOLVER', 'ARTISAN', 'STRATEGIST', 'COMMANDER', 'EXECUTOR',
  'FOUNDER', 'DEPLOYER', 'WEAVER', 'FORGER', 'RANGER',
  'HUNTER', 'SEEKER', 'KEEPER', 'MAKER', 'CODER',
];

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

export function generateBuilderTitle(name: string, role: string, offset = 0): string {
  const seed = `${name.toLowerCase()}${role.toLowerCase()}`;
  const h = hash(seed) + offset * 13;
  const first = FIRST_WORDS[Math.abs(h) % FIRST_WORDS.length];
  const second = SECOND_WORDS[Math.abs(h >> 3) % SECOND_WORDS.length];
  return `${first} ${second}`;
}

export function generateSerialCode(name: string): string {
  const h = hash(name);
  const hex = h.toString(16).toUpperCase().padStart(8, '0');
  return `HH26-${hex.slice(0, 4)}-${hex.slice(4)}`;
}
