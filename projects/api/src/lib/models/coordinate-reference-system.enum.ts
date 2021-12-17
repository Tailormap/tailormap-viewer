import { BoundsModel } from './bounds.model';

export interface CoordinateReferenceSystem {
  code: string;
  definition: string;
  area: BoundsModel;
}
