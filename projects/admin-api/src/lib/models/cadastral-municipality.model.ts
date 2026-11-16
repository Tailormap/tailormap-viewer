/** A kadastrale gemeente as listed by tailormap-api from the PDOK Locatieserver: one entry per AKR code. */
export interface CadastralMunicipalityModel {
  /** AKR code (kadastrale gemeentecode), e.g. "ATN02". */
  code: string;
  /** Name of the kadastrale gemeente, e.g. "Aalten". */
  name: string;
}
