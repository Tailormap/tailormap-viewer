import { BoundsModel, CoordinateReferenceSystemModel, LayerDetailsModel, ServiceModel } from '@tailormap-viewer/api';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { AppLayerWithInitialValuesModel, ExtendedLayerTreeNodeModel } from '../models';

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
  layers: AppLayerWithInitialValuesModel[];
  baseLayerTreeNodes: ExtendedLayerTreeNodeModel[];
  layerTreeNodes: ExtendedLayerTreeNodeModel[];
  terrainLayerTreeNodes: ExtendedLayerTreeNodeModel[];
  layerDetails: LayerDetailsModel[];
  selectedLayer?: string;
  selectedBackgroundNode?: string;
  selectedTerrainLayerNode?: string;
  in3dView: boolean;
}

export const initialMapState: MapState = {
  loadStatus: LoadingStateEnum.INITIAL,
  services: [],
  layers: [],
  layerDetails: [],
  baseLayerTreeNodes: [],
  layerTreeNodes: [],
  terrainLayerTreeNodes: [],
  in3dView: false,
};
