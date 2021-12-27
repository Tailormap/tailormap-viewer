import { BoundsModel } from './bounds.model';

export interface CoordinateReferenceSystemModel {
  code: string;
  definition: string;
  area?: BoundsModel;
}
