import { LayerModel } from './layer.model';

export interface Service {
  url: string;
  layers: LayerModel[];
  serviceName?: string;
}
