import { ServiceLayerModel } from './service-layer.model';
import { OpenlayersExtent } from './extent.type';

export interface WMTSLayerModel extends ServiceLayerModel {
  matrixSet: string;
  layers: string;
  resolutions: number[];
  matrixIds: string[];
  tileSizes: Array<[number, number]>;
  projection?: string;
  format?: string;
  extent: OpenlayersExtent;
  origins: number[][];
  tilePixelRatio?: number;
}
