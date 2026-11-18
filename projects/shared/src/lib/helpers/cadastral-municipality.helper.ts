import { CadastralMunicipalityModel } from './cadastral-municipality.model';
import { CADASTRAL_MUNICIPALITY_LIST } from './cadastral-municipality-list';

/**
 * Helper with the list of current Dutch kadastrale gemeenten (cadastral municipalities).
 *
 * Source: Kadaster IMKAD waardelijst "KadastraleGemeente",
 * https://developer.kadaster.nl/schemas/waardelijsten/KadastraleGemeente/KadastraleGemeente.csv. The CSV column "Waarde"
 * is mapped to `name` and "Toelichting" (semicolon separated) to `codes`. Expired entries (a "DatumTot" on or before
 * the day the list was generated) are left out, because the PDOK Locatieserver contains no parcels for them.
 *
 * The list is generated in `cadastral-municipality-list.ts`. To update it, run `npm run update-cadastral-municipalities`
 * (see `ci/scripts/update-cadastral-municipalities.mjs`), review the summary and the diff, and commit.
 *
 * Note that a kadastrale gemeente does not necessarily lie within a single (burgerlijke) gemeente.
 */
export class CadastralMunicipalityHelper {

  public static getCadastralMunicipalities(): CadastralMunicipalityModel[] {
    return CADASTRAL_MUNICIPALITY_LIST;
  }

}
