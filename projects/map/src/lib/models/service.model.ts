import { LayerModel } from './layer.model';

export type AuthorizationFunction = (src: string) => string;

export interface Service {
  url: string;
  layers: LayerModel[];
  serviceName?: string;
  authentication?: string | AuthorizationFunction;
}
