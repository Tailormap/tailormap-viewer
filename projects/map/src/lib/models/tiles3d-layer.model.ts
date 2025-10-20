import { ServiceLayerModel } from './service-layer.model';
import { Tileset3dStyle } from '@tailormap-viewer/shared';

// Future properties: enableCollision, showCreditsOnScreen,
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Tiles3dLayerModel extends ServiceLayerModel {
  tileset3dStyle?: Tileset3dStyle;
}
