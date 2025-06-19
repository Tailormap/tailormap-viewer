import { TileLayerHiDpiMode } from './layer-hi-dpi-mode.enum';
import { BoundsModel } from './bounds.model';
import { LayerSearchIndexModel } from './layer-search-index.model';
import { HiddenLayerFunctionality } from './hidden-layer-functionality.model';

export interface AppLayerModel {
  id: string;
  layerName: string;
  title: string;
  serviceId: string;
  url?: string;
  visible: boolean;
  hasAttributes: boolean;
  editable: boolean;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
  legendType?: 'static' | 'dynamic';
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiDisabled?: boolean;
  hiDpiMode?: TileLayerHiDpiMode;
  hiDpiSubstituteLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  tileGridExtent?: BoundsModel;
  opacity: number;
  attribution?: string;
  description?: string;
  autoRefreshInSeconds?: number | null;
  searchIndex: LayerSearchIndexModel | null;
  webMercatorAvailable?: boolean;
  hiddenFunctionality?: HiddenLayerFunctionality[] | null;
}
