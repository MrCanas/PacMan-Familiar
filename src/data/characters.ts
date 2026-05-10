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
    imagePath: '/characters/maria.png',
    accentColor: '#ec4899',
  },
  {
    id: 'jose',
    name: 'José',
    imagePath: '/characters/jose.png',
    accentColor: '#38bdf8',
  },
  {
    id: 'mama',
    name: 'Mamá',
    imagePath: '/characters/mama.png',
    accentColor: '#f59e0b',
  },
  {
    id: 'prima-ana',
    name: 'Prima Ana',
    imagePath: '/characters/prima-ana.png',
    accentColor: '#14b8a6',
  },
  {
    id: 'primo-javier',
    name: 'Primo Javier',
    imagePath: '/characters/primo-javier.png',
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
