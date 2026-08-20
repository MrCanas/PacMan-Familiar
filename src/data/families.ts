import manifest from '@/data/characters.json';

export interface CharacterData {
  id: string;
  name: string;
  imagePath: string;
  accentColor: string;
}

export interface FamilyData {
  id: string;
  name: string;
  tagline: string;
  characters: CharacterData[];
}

/**
 * El elenco vive en `characters.json` porque ese mismo fichero es el que lee
 * `scripts/prepare-characters.py` para generar los sprites. Una sola lista:
 * asi las caras del juego y los WebP de `public/characters/` no se separan.
 */
export const FAMILIES: FamilyData[] = manifest.families.map((family) => ({
  id: family.id,
  name: family.name,
  tagline: family.tagline,
  characters: family.characters.map((character) => ({
    id: character.id,
    name: character.name,
    accentColor: character.accentColor,
    imagePath: `/characters/${family.id}/${character.id}.webp`,
  })),
}));

export const DEFAULT_FAMILY_ID = FAMILIES[0]!.id;

/** Todos los personajes de todas las familias, para precargar y para el ranking. */
export const ALL_CHARACTERS: CharacterData[] = FAMILIES.flatMap((f) => f.characters);

export function getFamilyById(id: string | null): FamilyData | undefined {
  if (!id) return undefined;
  return FAMILIES.find((f) => f.id === id);
}

/** Familia guardada, o la primera si el id no existe (manifiesto editado, etc.). */
export function resolveFamily(id: string | null): FamilyData {
  return getFamilyById(id) ?? FAMILIES[0]!;
}

export function getCharacterById(id: string): CharacterData | undefined {
  return ALL_CHARACTERS.find((c) => c.id === id);
}

/** Familia a la que pertenece un personaje (el ranking agrupa por familia). */
export function getFamilyOfCharacter(characterId: string): FamilyData | undefined {
  return FAMILIES.find((f) => f.characters.some((c) => c.id === characterId));
}
