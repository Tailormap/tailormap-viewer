import { OpenlayersExtent } from './extent.type';

export interface MapViewDetailsModel {
  zoomLevel: number;
  minZoomLevel: number;
  maxZoomLevel: number;
  resolution: number;
  scale: number;
  minResolution: number;
  maxResolution: number;
  size: number[] | undefined;
  center: number[] | null | undefined;
  extent: OpenlayersExtent | null;
}
