/**
 * Fachada historica del elenco. Los datos viven ahora en `@/data/families`,
 * que agrupa a los personajes por familia; aqui solo quedan los tipos y los
 * ayudantes que no dependen de una familia concreta.
 */
export type { CharacterData, FamilyData } from '@/data/families';
export {
  ALL_CHARACTERS,
  DEFAULT_FAMILY_ID,
  FAMILIES,
  getCharacterById,
  getFamilyById,
  getFamilyOfCharacter,
  resolveFamily,
} from '@/data/families';

export type Role = 'protagonist' | 'ghost';

export interface RoleAssignment {
  characterId: string;
  role: Role;
}
