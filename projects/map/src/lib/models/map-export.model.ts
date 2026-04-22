import { OpenlayersExtent } from './extent.type';
import { LayerModel } from './layer.model';
import { Coordinate } from 'ol/coordinate';
import { OlLayerFilter } from '../map-service/map.service';

export interface MapExportOptions {
  widthInMm: number;
  heightInMm: number;
  dpi: number;
  extent?: OpenlayersExtent | null;
  center?: Coordinate;
  layers: LayerModel[];
  backgroundLayers: LayerModel[];
  vectorLayerFilter?: OlLayerFilter;
}

/**
 * The position of the scale bar in the exported map image in ratio to the image size.
 */
export interface MapExportScaleBarPosition {
  x: number;
  y: number;
}

export interface MapExportResult {
  dataURL: string;
  scaleBarPosition: MapExportScaleBarPosition;
}
