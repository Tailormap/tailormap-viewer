import { AppLayerModel, BoundsModel, CoordinateReferenceSystemModel, ServiceModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { ExtendedLayerTreeNodeModel } from '../models';

export const mapStateKey = 'map';

export interface MapSettingsModel {
  initialExtent?: BoundsModel;
  maxExtent?: BoundsModel;
  crs?: CoordinateReferenceSystemModel;
}

export interface MapState {
  loadStatus: LoadingStateEnum;
  errorMessage?: string;
  mapSettings?: MapSettingsModel;
  services: ServiceModel[];
  layers: AppLayerModel[];
  baseLayerTreeNodes: ExtendedLayerTreeNodeModel[];
  layerTreeNodes: ExtendedLayerTreeNodeModel[];
  selectedLayer?: number;
  selectedBackgroundNode?: string;
}

export const initialMapState: MapState = {
  loadStatus: LoadingStateEnum.INITIAL,
  services: [],
  layers: [],
  baseLayerTreeNodes: [],
  layerTreeNodes: [],
};
