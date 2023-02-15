import { ServiceLayerModel } from './service-layer.model';
import { ServerType } from '@tailormap-viewer/api';

export interface WMSLayerModel extends ServiceLayerModel {
  layers: string;
  queryLayers?: string;
  serverType: ServerType;
  tilingDisabled?: boolean;
  tilingGutter?: number;
}
