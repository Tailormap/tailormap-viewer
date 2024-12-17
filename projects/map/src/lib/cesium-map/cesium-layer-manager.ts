import { Map as OlMap } from 'ol';
import { LayerModel } from '../models/layer.model';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import { NgZone } from '@angular/core';
import type OLCesium from 'olcs';
import { BehaviorSubject, filter, from, map, Observable, take } from 'rxjs';
import {
  Cartesian3, Cartographic,
  Cesium3DTileFeature, Cesium3DTileset, CesiumTerrainProvider, EllipsoidTerrainProvider, Scene, ScreenSpaceEventHandler,
} from 'cesium';
import { ExternalLibsLoaderHelper } from '@tailormap-viewer/shared';
import { LayerTypesEnum } from '../models/layer-types.enum';
import { Selection3dModel } from '../models/selection3d.model';

export class CesiumLayerManager {

  private map3D: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private layers3D: Map<string, number> = new Map<string, number>();
  private cesiumEventHandler: ScreenSpaceEventHandler | undefined;
  public selection3D: Selection3dModel | undefined;

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {
  }

  public init() {
    ExternalLibsLoaderHelper.loadScript$('cesium/Cesium.js')
      .pipe(filter(loaded => loaded), take(1))
      .subscribe(() => {
        this.setupOlCesium();
      });
  }

  private setupOlCesium() {
    this.ngZone.runOutsideAngular(() => {
      from(from(import('olcs')))
        .pipe(take(1))
        .subscribe(olCsModule => {
          const ol3d = new olCsModule.default({
            map: this.olMap,
          });
          this.map3D.next(ol3d);
        });
      this.executeScene3DAction(async scene3D => {
        scene3D.globe.depthTestAgainstTerrain = true;
        this.cesiumEventHandler = new Cesium.ScreenSpaceEventHandler(scene3D.canvas);
      });
      this.setClickEventHandler();
    });
  }

  public getMap3D$(): Observable<OLCesium> {
    const isNotNullMap3D = (item: OLCesium | null): item is OLCesium => item !== null;
    return this.map3D.asObservable().pipe(filter(isNotNullMap3D));
  }

  public executeMap3DAction(fn: (olMap3D: OLCesium) => void) {
    this.getMap3D$()
      .pipe(take(1))
      .subscribe(olMap3D => this.ngZone.runOutsideAngular(() => fn(olMap3D)));
  }

  public executeScene3DAction(fn: (scene3D: Scene) => void) {
    this.getMap3D$()
      .pipe(take(1), map(map3d => map3d.getCesiumScene()))
      .subscribe(scene3D => {
        this.ngZone.runOutsideAngular(() => fn(scene3D));
      });
  }

  public switch3D$(){
    this.executeMap3DAction(olMap3D => {
      olMap3D.setEnabled(!olMap3D.getEnabled());
      if (!olMap3D.getEnabled()){
        this.olMap.getView().setRotation(0);
      }
    });
  }

  public addLayers(layers: LayerModel[]){
    this.ngZone.runOutsideAngular(() => {
      let noTerrainLayersVisible: boolean = true;
      layers.forEach(layer => {
        if (layer.visible) {
          this.addLayer(layer);
          if (layer.layerType === LayerTypesEnum.QUANTIZEDMESH) {
            noTerrainLayersVisible = false;
          }
        } else {
          this.removeLayer(layer);
        }
      });
      if (noTerrainLayersVisible) {
        this.setEllipsoidTerrain();
      }
    });
  }

  private addLayer(layer: LayerModel) {
    this.executeScene3DAction(async scene3D => {
      if (layer.layerType === LayerTypesEnum.QUANTIZEDMESH) {
        this.createTerrainLayer(layer)?.then(terrainLayer => {
          if (terrainLayer) {
            scene3D.setTerrain(new Cesium.Terrain(terrainLayer));
          }
        });
      } else {
        if (this.layers3D.has(layer.id)) {
          const primitive = scene3D.primitives.get(this.layers3D.get(layer.id) ?? 0);
          primitive.show = true;
        } else {
          this.create3DLayer(layer)?.then(cesiumLayer => {
            if (cesiumLayer) {
              scene3D.primitives.add(cesiumLayer, this.layers3D.size);
              this.layers3D.set(layer.id, this.layers3D.size);
            }
          });
        }
      }
    });
  }

  private removeLayer(layer: LayerModel) {
    this.executeScene3DAction(async scene3D => {
      if (this.layers3D.has(layer.id)) {
        const primitive = scene3D.primitives.get(this.layers3D.get(layer.id) ?? 0);
        primitive.show = false;
      }
    });
  }

  private create3DLayer(
    layer: LayerModel,
  ): Promise<Cesium3DTileset> | null {
    if (LayerTypesHelper.isTileset3DLayer(layer)) {
      const url = layer.url;
      return Cesium.Cesium3DTileset.fromUrl(url);
    }
    return null;
  }

  private createTerrainLayer(layer: LayerModel): Promise<CesiumTerrainProvider> | null {
    if (LayerTypesHelper.isTerrainLayer(layer)) {
      const url = layer.url;
      return Cesium.CesiumTerrainProvider.fromUrl(url);
    }
    return null;
  }

  private setEllipsoidTerrain() {
    this.executeScene3DAction(async scene3D => {
      scene3D.setTerrain(new Cesium.Terrain(new EllipsoidTerrainProvider()));
    });
  }

  private setClickEventHandler() {
    this.executeScene3DAction(async scene3D => {
      this.cesiumEventHandler?.setInputAction((movement: any) => {
        const pickedFeature: Cesium3DTileFeature = scene3D.pick(movement.position);
        const position: Cartesian3 = scene3D.pickPosition(movement.position);
        const cartographicPosition: Cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
        const positionDegrees = {
          latitude: Cesium.Math.toDegrees(cartographicPosition.latitude),
          longitude: Cesium.Math.toDegrees(cartographicPosition.longitude),
        };
        if (!Cesium.defined(pickedFeature)) {
          this.selection3D = { position: positionDegrees };
        } else {
          this.selection3D = {
            featureId: pickedFeature.featureId,
            featureProperties: [],
            position: positionDegrees,
          };
          const propertyIds = pickedFeature.getPropertyIds();
          for (const propertyId of propertyIds) {
            this.selection3D.featureProperties?.push({ id: propertyId, value: pickedFeature.getProperty(propertyId) });
          }
        }
        console.log('feature: ', this.selection3D);

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    });
  }

}
