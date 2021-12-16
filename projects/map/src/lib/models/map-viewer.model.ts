import { OpenlayersExtent } from './extent.type';
import { LayerManagerModel } from './layer-manager.model';
import { MapViewerOptionsModel } from './map-viewer-options.model';
import { Observable } from 'rxjs';

export interface MapViewerModel {
  setProjection(options: MapViewerOptionsModel): void;
  render(element: HTMLElement): void;
  getLayerManager$(): Observable<LayerManagerModel>;
  getVisibleExtent$(): Observable<OpenlayersExtent>;
  setZoomLevel(zoom: number): void;
  zoomIn(): void;
  zoomOut(): void;
}

