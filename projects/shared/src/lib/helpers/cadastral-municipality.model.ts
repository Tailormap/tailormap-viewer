/** A kadastrale gemeente (cadastral municipality) with its AKR codes. */
export interface CadastralMunicipalityModel {
  /** Name of the kadastrale gemeente, e.g. "Aalten". */
  name: string;
  /**
   * AKR codes (kadastrale gemeentecodes) as used in cadastral designations and in the PDOK Locatieserver field
   * `kadastrale_gemeentecode`, e.g. ["ATN02"]. Some kadastrale gemeenten have several, e.g. Amsterdam (ASD02 - ASD43).
   */
  codes: string[];
}
