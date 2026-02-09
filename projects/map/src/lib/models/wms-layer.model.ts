import { ServiceLayerModel } from './service-layer.model';
import { ServerType, WmsStyleModel } from '@tailormap-viewer/api';

export interface WMSLayerModel extends ServiceLayerModel {
  layers: string;
  queryLayers?: string;
  serverType: ServerType;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  language?: string;
  styles?: WmsStyleModel[] | null;
}
