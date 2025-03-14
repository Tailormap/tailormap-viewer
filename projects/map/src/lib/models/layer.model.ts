import { LayerTypesEnum } from './layer-types.enum';

export interface LayerModel {
  id: string;
  name: string;
  layerType: LayerTypesEnum;
  visible: boolean;
  layers?: string;
  tilePixelRatio?: number;
  hiDpiDisabled?: boolean;
  wfsUrl?: string;
  wfsFeatureTypeName?: string;
  wfsFeatureGeomName?: string;
  opacity?: number;
  attribution?: string;
  webMercatorAvailable?: boolean;
}
