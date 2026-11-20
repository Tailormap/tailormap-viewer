import type { CadastralMunicipalityModel } from './cadastral-municipality.model';

/** Loads the list of kadastrale gemeenten with a dynamic import, so the large list is in a separate chunk. */
export const loadCadastralMunicipalityList = (): Promise<CadastralMunicipalityModel[]> =>
  import('./cadastral-municipality-list').then(m => m.CADASTRAL_MUNICIPALITY_LIST);
