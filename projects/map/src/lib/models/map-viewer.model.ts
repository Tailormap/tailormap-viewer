import { OpenlayersExtent } from './extent.type';
import { LayerManagerModel } from './layer-manager.model';

export interface MapViewerModel {
  init(): void;
  setMapPadding(mapPadding: number[]): void;
  render(element: HTMLElement): void;
  getLayerManager(): LayerManagerModel;
  getVisibleExtent(): OpenlayersExtent;
  setZoomLevel(zoom: number): void;
  zoomIn(): void;
  zoomOut(): void;
}

