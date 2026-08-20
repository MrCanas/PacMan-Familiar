export interface CharacterData {
  id: string;
  name: string;
  imagePath: string;
  accentColor: string;
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'maria',
    name: 'María',
    imagePath: '/characters/maria.webp',
    accentColor: '#ec4899',
  },
  {
    id: 'jose',
    name: 'José',
    imagePath: '/characters/jose.webp',
    accentColor: '#38bdf8',
  },
  {
    id: 'mama',
    name: 'Mamá',
    imagePath: '/characters/mama.webp',
    accentColor: '#f59e0b',
  },
  {
    id: 'prima-ana',
    name: 'Prima Ana',
    imagePath: '/characters/prima-ana.webp',
    accentColor: '#14b8a6',
  },
  {
    id: 'primo-javier',
    name: 'Primo Javier',
    imagePath: '/characters/primo-javier.webp',
    accentColor: '#a78bfa',
  },
];

export type Role = 'protagonist' | 'ghost';

export interface RoleAssignment {
  characterId: string;
  role: Role;
}

export function getCharacterById(id: string): CharacterData | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
