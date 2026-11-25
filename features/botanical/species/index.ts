import type { SpeciesConfig, SpeciesId } from '../types';
import { autumnMapleSpecies } from './autumnMaple';
import { springSakuraSpecies } from './springSakura';
import { summerHibiscusSpecies } from './summerHibiscus';
import { winterCamelliaSpecies } from './winterCamellia';

export const SPECIES_REGISTRY: Record<SpeciesId, SpeciesConfig> = {
  spring: springSakuraSpecies,
  summer: summerHibiscusSpecies,
  autumn: autumnMapleSpecies,
  winter: winterCamelliaSpecies,
};

export function getSpeciesConfig(id: SpeciesId): SpeciesConfig {
  return SPECIES_REGISTRY[id];
}
