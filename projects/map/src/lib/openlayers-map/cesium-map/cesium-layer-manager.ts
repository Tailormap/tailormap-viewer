import { Map as OlMap } from 'ol';
import { LayerModel } from '../../models/layer.model';
import { LayerTypesHelper } from '../../helpers/layer-types.helper';
import { NgZone } from '@angular/core';
import type OLCesium from 'olcs';
import { BehaviorSubject, filter, from, map, Observable, take } from 'rxjs';
import { Cesium3DTileset, CesiumTerrainProvider, EllipsoidTerrainProvider, Scene } from 'cesium';
import { CssHelper, ExternalLibsLoaderHelper } from '@tailormap-viewer/shared';
import { LayerTypesEnum } from '../../models/layer-types.enum';
import { CesiumEventManager } from './cesium-event-manager';
import { Projection } from 'ol/proj';

export class CesiumLayerManager {

  private map3D: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private layers3D: Map<string, number> = new Map<string, number>();

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
    private projection2D?: Projection,
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
            sceneOptions: {
              canvas: document.createElement('canvas'),
              requestRenderMode: true,
              maximumRenderTimeChange: Infinity,
            },
          });
          ol3d.setRefresh2DAfterCameraMoveEndOnly(true);
          ol3d.setTargetFrameRate(60);
          this.map3D.next(ol3d);
        });
      this.executeScene3DAction(async scene3D => {
        scene3D.globe.depthTestAgainstTerrain = true;
        CesiumEventManager.initClickEvent(scene3D, CssHelper.getCssVariableValue('--primary-color').trim(), this.projection2D?.getCode());
      });
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

  public switch3D(){
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
          this.layers3D.set(layer.id, scene3D.primitives.length);
          const tiles3DLayerPromise = this.create3DLayer(layer);
          tiles3DLayerPromise.then(tiles3dLayer => {
            if (tiles3dLayer) {
              scene3D.primitives.add(tiles3dLayer);
            }
          }).catch(error => { console.log(`Error while adding 3D layer: ${error}`); });
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

  private async create3DLayer(
    layer: LayerModel,
  ): Promise<Cesium3DTileset | null> {
    if (LayerTypesHelper.isTiles3DLayer(layer)) {
      const resource = new Cesium.Resource({
        url: layer.url,
      });
      try {
        const tileset: Promise<Cesium3DTileset> = await Cesium.Cesium3DTileset.fromUrl(resource, {
          maximumScreenSpaceError: 16,
          skipLevelOfDetail: true,
          baseScreenSpaceError: 1024,
          skipScreenSpaceErrorFactor: 16,
          skipLevels: 1,
          immediatelyLoadDesiredLevelOfDetail: false,
          loadSiblings: false,
          cullWithChildrenBounds: true,
          dynamicScreenSpaceError: true,
          dynamicScreenSpaceErrorDensity: 6.0e-4,
          dynamicScreenSpaceErrorFactor: 72.0,
          dynamicScreenSpaceErrorHeightFalloff: 0.75,
        });
        return tileset;
      } catch (error) {
        console.log(`Error while creating Cesium3DTileset: ${error}`);
      }
      return null;
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

  public getLayerId(index: number): string | null {
    for (const [ key, val ] of this.layers3D.entries()) {
      if (val === index) {
        return key;
      }
    }
    return null;
  }

}
