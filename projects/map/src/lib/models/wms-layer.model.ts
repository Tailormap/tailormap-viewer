import { ServiceLayerModel } from './service-layer.model';
import { ResolvedServerType, ServerType } from '@tailormap-viewer/api';

export interface WMSLayerModel extends ServiceLayerModel {
  layers: string;
  queryLayers?: string;
  serverType: ServerType;
  resolvedServerType: ResolvedServerType;
  tilingDisabled?: boolean;
  tilingGutter?: number;
}
