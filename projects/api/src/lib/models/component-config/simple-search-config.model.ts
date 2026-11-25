import { ComponentBaseConfigModel } from '../component-base-config.model';

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

export interface SimpleSearchConfigModel extends ComponentBaseConfigModel {
  municipalities?: string[];
  /** Also search the PDOK Locatieserver for kadastrale percelen (only for maps in RD). Defaults to off. */
  searchCadastralParcels?: boolean;
  /**
   * Kadastrale gemeenten to restrict the parcel search to. The AKR codes are saved with the names, so the viewer does
   * not need the list of all kadastrale gemeenten. Empty or undefined means no restriction.
   */
  cadastralMunicipalities?: CadastralMunicipalityModel[];
}
