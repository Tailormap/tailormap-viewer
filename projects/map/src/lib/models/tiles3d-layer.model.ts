import { ServiceLayerModel } from './service-layer.model';
import { Tileset3dStyle } from '@tailormap-viewer/api';

// Future properties: enableCollision, showCreditsOnScreen,
export interface Tiles3dLayerModel extends ServiceLayerModel {
  tileset3dStyle?: Tileset3dStyle;
}
