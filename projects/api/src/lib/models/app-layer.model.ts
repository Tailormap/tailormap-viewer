import { CoordinateReferenceSystemModel } from './coordinate-reference-system.model';

export interface AppLayerModel {
  id: number;
  layerName: string;
  title: string;
  serviceId: number;
  visible: boolean;
  hasAttributes: boolean;
  crs?: CoordinateReferenceSystemModel;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
}
