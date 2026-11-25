/** A Dutch municipality (gemeente) with the province it lies in. */
export interface MunicipalityModel {
  /** CBS municipality code without "GM" prefix, as in the PDOK Locatieserver field `gemeentecode`, e.g. "0363". */
  municipalityCode: string;
  municipality: string;
  /** CBS province code without "PV" prefix, e.g. "27". */
  provinceCode: string;
  province: string;
}

export const isMunicipalityModel = (value: unknown): value is MunicipalityModel =>
  !!value && typeof value === 'object' && typeof (value as MunicipalityModel).municipalityCode === 'string';
