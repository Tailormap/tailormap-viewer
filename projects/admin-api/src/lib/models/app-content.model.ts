import { AppLayerRefModel } from './app-layer-ref.model';

export interface AppContentModel {
  baseLayers: Array<{ title: string; layers: AppLayerRefModel[] }>;
  layers: AppLayerRefModel[];
  children: AppContentModel[];
}
