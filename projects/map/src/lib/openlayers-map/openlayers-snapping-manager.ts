import { Feature, Map as OlMap } from 'ol';
import { Snap } from 'ol/interaction';
import { LayerTypesEnum, OlMapStyleType } from '../models';
import { Vector as VectorLayer, Vector } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { FeatureModelType } from '../models/feature-model.type';
import { BehaviorSubject, combineLatest, filter, take } from 'rxjs';
import { FeatureHelper } from '../helpers/feature.helper';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';
import { Point } from 'ol/geom';

export class OpenLayersSnappingManager {

  private static SNAPPING_LAYER_ID = 'snapping-layer';

  private static olMap: OlMap | undefined;
  private static layerManager: OpenLayersLayerManager | undefined;

  private static snappingInteraction = new BehaviorSubject<Snap | null>(null);
  private static snappingLayer = new BehaviorSubject<Vector | null>(null);
  private static snappingCursorLayer = new BehaviorSubject<Vector | null>(null);
  private static snappingAllowed = false;

  private static initialized = new BehaviorSubject(false);

  private static layerInitialized = false;
  private static layerInitializing = false;

  private static snapInitialized = false;
  private static snapInitializing = false;

  public static init(
    olMap: OlMap,
    layerManager: OpenLayersLayerManager,
  ) {
    OpenLayersSnappingManager.olMap = olMap;
    OpenLayersSnappingManager.layerManager = layerManager;
    OpenLayersSnappingManager.initialized.next(true);
  }

  public static destroy() {
    if (OpenLayersSnappingManager.snappingInteraction.value) {
      OpenLayersSnappingManager.olMap?.removeInteraction(OpenLayersSnappingManager.snappingInteraction.value);
      OpenLayersSnappingManager.snappingInteraction.next(null);
      OpenLayersSnappingManager.snapInitialized = false;
      OpenLayersSnappingManager.snapInitializing = false;
    }
    if (OpenLayersSnappingManager.snappingLayer.value) {
      OpenLayersSnappingManager.layerManager?.removeLayer(OpenLayersSnappingManager.SNAPPING_LAYER_ID);
      OpenLayersSnappingManager.snappingLayer.next(null);
      OpenLayersSnappingManager.snappingCursorLayer.next(null);
      OpenLayersSnappingManager.layerInitialized = false;
      OpenLayersSnappingManager.layerInitializing = false;
    }
    OpenLayersSnappingManager.initialized.next(false);
  }

  public static allowSnapping(allow: boolean) {
    OpenLayersSnappingManager.snappingAllowed = allow;
    OpenLayersSnappingManager.enableSnappingIfAllowed(allow);
  }

  public static setSnappingLayerStyle(style: OlMapStyleType) {
    OpenLayersSnappingManager.executeLayerAction(snappingLayer => {
      snappingLayer.setStyle(style);
    });
  }

  public static setSnappingTolerance(tolerance: number) {
    OpenLayersSnappingManager.initSnap({ pixelTolerance: tolerance });
  }

  public static enableSnappingIfAllowed(enable: boolean) {
    if (!OpenLayersSnappingManager.snappingAllowed) {
      return;
    }
    OpenLayersSnappingManager.executeSnapAction(snap => {
      // Always remove - if we need to enable we also remove first,
      // Then add because Snap needs to be loaded last
      OpenLayersSnappingManager.olMap?.removeInteraction(snap);
      if (enable) {
        OpenLayersSnappingManager.olMap?.addInteraction(snap);
      }
    });
  }

  public static renderFeatures(features: FeatureModelType[]) {
    OpenLayersSnappingManager.executeLayerAction(snappingLayer => {
      snappingLayer.getSource()?.getFeatures().forEach(feature => {
        snappingLayer.getSource()?.removeFeature(feature);
      });
      const featureModels = FeatureHelper.getFeatures(features, snappingLayer.getSource()?.getProjection()?.getCode());
      featureModels.forEach(feature => {
        snappingLayer.getSource()?.addFeature(feature);
      });
    });
  }

  private static executeSnapAction(cb: (snap: Snap) => void) {
    if (!OpenLayersSnappingManager.snapInitialized) {
      OpenLayersSnappingManager.initSnap();
    }
    OpenLayersSnappingManager.snappingInteraction.asObservable()
      .pipe(filter(snap => !!snap), take(1))
      .subscribe(snap => {
        if (snap) {
          cb(snap);
        }
      });
  }

  private static executeLayerAction(cb: (layer: Vector<VectorSource>) => void) {
    if (!OpenLayersSnappingManager.layerInitialized) {
      OpenLayersSnappingManager.initLayer();
    }
    OpenLayersSnappingManager.snappingLayer.asObservable()
      .pipe(filter(layer => !!layer), take(1))
      .subscribe(layer => {
        if (layer) {
          cb(layer);
        }
      });
  }

  private static initLayer() {
    if (OpenLayersSnappingManager.layerInitializing) {
      return;
    }
    OpenLayersSnappingManager.layerInitializing = true;
    OpenLayersSnappingManager.initialized.asObservable()
      .pipe(filter(initialized => initialized), take(1))
      .subscribe(() => {
        const vectorLayer = OpenLayersSnappingManager.layerManager?.addLayer<VectorLayer>({
          id: OpenLayersSnappingManager.SNAPPING_LAYER_ID,
          name: `Snapping layer`,
          layerType: LayerTypesEnum.Vector,
          visible: true,
        });
        const vectorCursorLayer = OpenLayersSnappingManager.layerManager?.addLayer<VectorLayer>({
          id: OpenLayersSnappingManager.SNAPPING_LAYER_ID + '_Pointer',
          name: `Snapping layer pointer`,
          layerType: LayerTypesEnum.Vector,
          visible: true,
        });
        if (vectorLayer && vectorCursorLayer) {
          OpenLayersSnappingManager.snappingLayer.next(vectorLayer);
          OpenLayersSnappingManager.snappingCursorLayer.next(vectorCursorLayer);
          OpenLayersSnappingManager.layerInitialized = true;
        }
        OpenLayersSnappingManager.layerInitializing = false;
      });
  }

  private static initSnap(snapOptions?: { pixelTolerance: number }) {
    if (OpenLayersSnappingManager.snapInitializing) {
      return;
    }
    OpenLayersSnappingManager.snapInitializing = true;
    combineLatest([
      OpenLayersSnappingManager.initialized.asObservable(),
      OpenLayersSnappingManager.snappingLayer.asObservable(),
    ])
      .pipe(
        filter(([ initialized, snappingLayer ]) => initialized && !!snappingLayer),
        take(1),
      )
      .subscribe(([ _initialized, snappingLayer ]) => {
        const source = snappingLayer?.getSource();
        if (!source) {
          return;
        }
        OpenLayersSnappingManager.snappingInteraction.next(new Snap({
          source,
          pixelTolerance: snapOptions?.pixelTolerance ?? 10,
        }));
        OpenLayersSnappingManager.snappingInteraction.value?.on('snap', e => {
          const snapFeature = new Feature(new Point(e.vertex));
          snapFeature.setStyle(new Style({
            image: new RegularShape({
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({ color: '#000', width: 2 }),
              points: 4,
              radius: 12,
              radius2: 0,
              angle: 0,
            }),
          }));
          OpenLayersSnappingManager.snappingCursorLayer.value?.getSource()?.clear(true);
          OpenLayersSnappingManager.snappingCursorLayer.value?.getSource()?.addFeature(snapFeature);
        });
        OpenLayersSnappingManager.snappingInteraction.value?.on('unsnap', () => {
          OpenLayersSnappingManager.snappingCursorLayer.value?.getSource()?.clear(true);
        });
        OpenLayersSnappingManager.snapInitializing = false;
        OpenLayersSnappingManager.snapInitialized = true;
      });
  }

}
