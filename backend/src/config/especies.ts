// Diccionario modular de especies permitidas
export const ALLOWED_SPECIES = [
  // domésticos comunes
  'perro', 'gato', 'conejo', 'hamster', 'huron', 'cobaya', 'chinchilla', 'erizo',
  // aves (genérico y específicos)
  'ave', 'loro', 'perico', 'canario', 'paloma', 'pato', 'gallina', 'pavo', 'codorniz',
  // acuáticos / anfibios
  'pez', 'axolote',
  // reptiles
  'tortuga', 'iguana', 'gecko', 'serpiente', 'camaleon', 'tarantula',
  // granja/campo
  'caballo', 'cabra', 'oveja', 'burro', 'cerdo', 'minipig',
  // genéricos
  'reptil', 'roedor', 'otro'
] as const;
export type Species = typeof ALLOWED_SPECIES[number];

export function normalizeSpecies(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase();
}

export function estaPermitidaLaEspecie(s: string | undefined | null): boolean {
  const norm = normalizeSpecies(s);
  return ALLOWED_SPECIES.includes(norm as Species);
}

export function obtenerListaEspecies(): Species[] {
  return [...ALLOWED_SPECIES];
}

// Lista para UI: primera letra en mayúscula
function primeraLetraMayus(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
export function getSpeciesDisplayList(): string[] {
  return ALLOWED_SPECIES.map(primeraLetraMayus);
}
