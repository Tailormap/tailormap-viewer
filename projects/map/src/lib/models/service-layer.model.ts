import { LayerModel } from './layer.model';

export interface ServiceLayerModel extends LayerModel {
  url: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}
