import { LayerModel } from './layer.model';
import { AuthorizationFunction } from './service.model';

export interface ServiceLayerModel extends LayerModel {
  url: string;
  authentication?: string | AuthorizationFunction;
  crossOrigin?: 'anonymous' | 'use-credentials';
}
