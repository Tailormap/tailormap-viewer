import { Map as OlMap } from 'ol';
import { Snap } from 'ol/interaction';
import { LayerTypesEnum, OlMapStyleType } from '../models';
import { Vector as VectorLayer, Vector } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { OpenLayersLayerManager } from './open-layers-layer-manager';

export class OpenLayersSnappingManager {

  private static SNAPPING_LAYER_ID = 'snapping-layer';

  private static olMap: OlMap | undefined;
  private static layerManager: OpenLayersLayerManager | undefined;

  private static snappingInteraction: Snap | null = null;
  private static snappingLayer: Vector | null = null;
  private static snappingAllowed = false;

  public static init(
    olMap: OlMap,
    layerManager: OpenLayersLayerManager,
  ) {
    OpenLayersSnappingManager.olMap = olMap;
    OpenLayersSnappingManager.layerManager = layerManager;
  }

  public static destroy() {
    if (OpenLayersSnappingManager.snappingInteraction) {
      OpenLayersSnappingManager.olMap?.removeInteraction(OpenLayersSnappingManager.snappingInteraction);
      OpenLayersSnappingManager.snappingInteraction = null;
    }
    if (OpenLayersSnappingManager.snappingLayer) {
      OpenLayersSnappingManager.layerManager?.removeLayer(OpenLayersSnappingManager.SNAPPING_LAYER_ID);
      OpenLayersSnappingManager.snappingLayer = null;
    }
  }

  public static allowSnapping(allow: boolean) {
    OpenLayersSnappingManager.snappingAllowed = allow;
    if (!allow) {
      OpenLayersSnappingManager.enableSnappingIfAllowed(false);
    }
  }

  public static setSnappingLayerStyle(style: OlMapStyleType) {
    const snappingLayer = OpenLayersSnappingManager.getSnappingLayer();
    if (!snappingLayer) {
      return;
    }
    OpenLayersSnappingManager.snappingLayer?.setStyle(style);
  }

  public static setSnappingTolerance(tolerance: number) {
    OpenLayersSnappingManager.snappingInteraction?.setProperties({ pixelTolerance: tolerance });
  }

  public static enableSnappingIfAllowed(enable: boolean) {
    if (!OpenLayersSnappingManager.snappingAllowed) {
      return;
    }
    const snap = OpenLayersSnappingManager.getSnappingInteraction();
    if (!snap) {
      return;
    }
    // Always remove - if we need to enable we also remove first,
    // Then add because Snap needs to be loaded last
    OpenLayersSnappingManager.olMap?.removeInteraction(snap);
    if (enable) {
      OpenLayersSnappingManager.olMap?.addInteraction(snap);
    }
  }

  public static getSnappingLayer(): Vector<VectorSource> | null {
    if (OpenLayersSnappingManager.snappingLayer) {
      return OpenLayersSnappingManager.snappingLayer;
    }
    const vectorLayer = OpenLayersSnappingManager.layerManager?.addLayer<VectorLayer>({
      id: OpenLayersSnappingManager.SNAPPING_LAYER_ID,
      name: `Snapping layer`,
      layerType: LayerTypesEnum.Vector,
      visible: true,
    });
    if (!vectorLayer) {
      // Just to satisfy TypeScript, this should never happen
      return new VectorLayer();
    }
    OpenLayersSnappingManager.snappingLayer = vectorLayer;
    return OpenLayersSnappingManager.snappingLayer;
  }

  private static getSnappingInteraction() {
    if (OpenLayersSnappingManager.snappingInteraction) {
      return OpenLayersSnappingManager.snappingInteraction;
    }
    const snappingLayer = OpenLayersSnappingManager.getSnappingLayer();
    const vectorSource = snappingLayer?.getSource();
    if (!vectorSource) {
      return;
    }
    OpenLayersSnappingManager.snappingInteraction = new Snap({ source: vectorSource });
    return OpenLayersSnappingManager.snappingInteraction;
  }

}
