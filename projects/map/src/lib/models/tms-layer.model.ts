import { LayerModel } from './layer.model';

export interface TMSLayerModel extends LayerModel {
  xyzOptions: any;
  crossOrigin?: 'anonymous' | 'use-credentials';
}
