import type { CadastralMunicipalityModel } from '@tailormap-viewer/api';
import type { MunicipalityModel } from './municipality.model';

/** Loads the list of gemeenten with a dynamic import, so the list is in a separate chunk. */
export const loadMunicipalityList = (): Promise<MunicipalityModel[]> =>
  import('./municipality-list').then(m => m.MUNICIPALITY_LIST);

/** Loads the list of kadastrale gemeenten with a dynamic import, so the large list is in a separate chunk. */
export const loadCadastralMunicipalityList = (): Promise<CadastralMunicipalityModel[]> =>
  import('./cadastral-municipality-list').then(m => m.CADASTRAL_MUNICIPALITY_LIST);
