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
  private static SNAPPING_CURSOR_LAYER_ID = 'snapping-layer-cursor';

  private olMap: OlMap | undefined;
  private layerManager: OpenLayersLayerManager | undefined;

  private snappingInteraction = new BehaviorSubject<Snap | null>(null);
  private snappingLayer = new BehaviorSubject<Vector | null>(null);
  private snappingCursorLayer = new BehaviorSubject<Vector | null>(null);
  private snappingAllowed = false;

  private initialized = new BehaviorSubject(false);

  private layerInitialized = false;
  private layerInitializing = false;

  private snapInitialized = false;
  private snapInitializing = false;

  public init(
    olMap: OlMap,
    layerManager: OpenLayersLayerManager,
  ) {
    this.olMap = olMap;
    this.layerManager = layerManager;
    this.initialized.next(true);
  }

  public destroy() {
    if (this.snappingInteraction.value) {
      this.olMap?.removeInteraction(this.snappingInteraction.value);
      this.snappingInteraction.next(null);
      this.snapInitialized = false;
      this.snapInitializing = false;
    }
    if (this.snappingLayer.value) {
      this.layerManager?.removeLayer(OpenLayersSnappingManager.SNAPPING_LAYER_ID);
      this.layerManager?.removeLayer(OpenLayersSnappingManager.SNAPPING_CURSOR_LAYER_ID);
      this.snappingLayer.next(null);
      this.snappingCursorLayer.next(null);
      this.layerInitialized = false;
      this.layerInitializing = false;
    }
    this.initialized.next(false);
  }

  public allowSnapping(allow: boolean) {
    this.snappingAllowed = allow;
    this.enableSnappingIfAllowed(allow);
  }

  public setSnappingLayerStyle(style: OlMapStyleType) {
    this.executeLayerAction(snappingLayer => {
      snappingLayer.setStyle(style);
    });
  }

  public setSnappingTolerance(tolerance: number) {
    this.initSnap({ pixelTolerance: tolerance });
  }

  public enableSnappingIfAllowed(enable: boolean) {
    if (!this.snappingAllowed) {
      return;
    }
    this.executeSnapAction(snap => {
      // Always remove - if we need to enable we also remove first,
      // Then add because Snap needs to be loaded last
      this.olMap?.removeInteraction(snap);
      if (enable) {
        this.olMap?.addInteraction(snap);
      }
    });
  }

  public renderFeatures(features: FeatureModelType[]) {
    this.executeLayerAction(snappingLayer => {
      snappingLayer.getSource()?.getFeatures().forEach(feature => {
        snappingLayer.getSource()?.removeFeature(feature);
      });
      const featureModels = FeatureHelper.getFeatures(features, snappingLayer.getSource()?.getProjection()?.getCode());
      featureModels.forEach(feature => {
        snappingLayer.getSource()?.addFeature(feature);
      });
    });
  }

  private executeSnapAction(cb: (snap: Snap) => void) {
    if (!this.snapInitialized) {
      this.initSnap();
    }
    this.snappingInteraction.asObservable()
      .pipe(filter(snap => !!snap), take(1))
      .subscribe(snap => {
        if (snap) {
          cb(snap);
        }
      });
  }

  private executeLayerAction(cb: (layer: Vector<VectorSource>) => void) {
    if (!this.layerInitialized) {
      this.initLayer();
    }
    this.snappingLayer.asObservable()
      .pipe(filter(layer => !!layer), take(1))
      .subscribe(layer => {
        if (layer) {
          cb(layer);
        }
      });
  }

  private initLayer() {
    if (this.layerInitializing) {
      return;
    }
    this.layerInitializing = true;
    this.initialized.asObservable()
      .pipe(filter(initialized => initialized), take(1))
      .subscribe(() => {
        const vectorLayer = this.layerManager?.addLayer<VectorLayer>({
          id: OpenLayersSnappingManager.SNAPPING_LAYER_ID,
          name: `Snapping layer`,
          layerType: LayerTypesEnum.Vector,
          visible: true,
        });
        const vectorCursorLayer = this.layerManager?.addLayer<VectorLayer>({
          id: OpenLayersSnappingManager.SNAPPING_CURSOR_LAYER_ID,
          name: `Snapping layer pointer`,
          layerType: LayerTypesEnum.Vector,
          visible: true,
        });
        if (vectorLayer && vectorCursorLayer) {
          this.snappingLayer.next(vectorLayer);
          this.snappingCursorLayer.next(vectorCursorLayer);
          this.layerInitialized = true;
        }
        this.layerInitializing = false;
      });
  }

  private initSnap(snapOptions?: { pixelTolerance: number }) {
    if (this.snapInitializing) {
      return;
    }
    this.snapInitializing = true;
    combineLatest([
      this.initialized.asObservable(),
      this.snappingLayer.asObservable(),
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
        this.snappingInteraction.next(new Snap({
          source,
          pixelTolerance: snapOptions?.pixelTolerance ?? 10,
        }));
        this.snappingInteraction.value?.on('snap', e => {
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
          this.snappingCursorLayer.value?.getSource()?.clear(true);
          this.snappingCursorLayer.value?.getSource()?.addFeature(snapFeature);
        });
        this.snappingInteraction.value?.on('unsnap', () => {
          this.snappingCursorLayer.value?.getSource()?.clear(true);
        });
        this.snapInitializing = false;
        this.snapInitialized = true;
      });
  }

}
