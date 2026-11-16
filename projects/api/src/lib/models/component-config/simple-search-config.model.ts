import { ComponentBaseConfigModel } from '../component-base-config.model';

export interface SimpleSearchConfigModel extends ComponentBaseConfigModel {
  municipalities?: string[];
  /** Also search the PDOK Locatieserver for kadastrale percelen (only for maps in RD). Defaults to off. */
  searchCadastralParcels?: boolean;
  /** Kadastrale gemeentecodes (AKR codes, e.g. "ATN02") to restrict the parcel search to. Empty or undefined means no restriction. */
  cadastralMunicipalities?: string[];
}
