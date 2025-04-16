import { Map as OlMap } from 'ol';
import { LayerModel } from '../../models/layer.model';
import { LayerTypesHelper } from '../../helpers/layer-types.helper';
import { NgZone } from '@angular/core';
import type OLCesium from 'olcs';
import { BehaviorSubject, filter, from, map, Observable, take } from 'rxjs';
import { Cesium3DTileset, CesiumTerrainProvider, EllipsoidTerrainProvider, Scene } from 'cesium';
import { ArrayHelper, CssHelper, ExternalLibsLoaderHelper } from '@tailormap-viewer/shared';
import { LayerTypesEnum } from '../../models/layer-types.enum';
import { CesiumEventManager } from './cesium-event-manager';
import { Projection } from 'ol/proj';

export class CesiumManager {

  private static ELLIPSOID_TERRAIN_ID = "ellipsoid";

  private map3d: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private layers3d: Map<string, number> = new Map<string, number>();
  private currentTerrainLayerId: string = CesiumManager.ELLIPSOID_TERRAIN_ID;
  private prevLayerIdentifiers: string[] = [];


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
            // requestRenderMode and maximumRenderTimeChange are used to improve performance
            sceneOptions: {
              canvas: document.createElement('canvas'),
              requestRenderMode: true,
              maximumRenderTimeChange: Infinity,
            },
          });
          ol3d.setRefresh2DAfterCameraMoveEndOnly(true);
          ol3d.setTargetFrameRate(60);
          this.map3d.next(ol3d);
        });
      this.executeScene3dAction(async scene3d => {
        scene3d.globe.depthTestAgainstTerrain = true;
        CesiumEventManager.initClickEvent(
          scene3d,
          CssHelper.getCssVariableValue('--primary-color').trim(),
          index => this.getLayerId(index),
          this.projection2D?.getCode(),
        );
      });
    });
  }

  public getMap3d$(): Observable<OLCesium> {
    const isNotNullMap3d = (item: OLCesium | null): item is OLCesium => item !== null;
    return this.map3d.asObservable().pipe(filter(isNotNullMap3d));
  }

  public executeMap3dAction(fn: (olMap3d: OLCesium) => void) {
    this.getMap3d$()
      .pipe(take(1))
      .subscribe(olMap3d => this.ngZone.runOutsideAngular(() => fn(olMap3d)));
  }

  public executeScene3dAction(fn: (scene3D: Scene) => void) {
    this.getMap3d$()
      .pipe(take(1), map(map3d => map3d.getCesiumScene()))
      .subscribe(scene3d => {
        this.ngZone.runOutsideAngular(() => fn(scene3d));
      });
  }

  public switch3d(){
    this.executeMap3dAction(olMap3d => {
      olMap3d.setEnabled(!olMap3d.getEnabled());
      if (!olMap3d.getEnabled()){
        this.olMap.getView().setRotation(0);
      }
    });
  }

  public addLayers(layers: LayerModel[]) {
    const layerIdentifiers: string[] = this.createLayerIdentifiers(layers);
    if (ArrayHelper.arrayEquals(layerIdentifiers, this.prevLayerIdentifiers)) {
      return;
    }
    this.prevLayerIdentifiers = layerIdentifiers;
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
      if (noTerrainLayersVisible && this.currentTerrainLayerId !== CesiumManager.ELLIPSOID_TERRAIN_ID) {
        // set the terrain as WGS84 ellipsoid to remove terrain layers if none are set as visible
        this.setEllipsoidTerrain();
      }
      this.executeScene3dAction(async scene3d => {
        scene3d.requestRender();
      });
    });
  }

  private addLayer(layer: LayerModel) {
    this.executeScene3dAction(async scene3d => {
      if (layer.layerType === LayerTypesEnum.QUANTIZEDMESH) {
        if (this.currentTerrainLayerId !== layer.id) {
          this.createTerrainLayer(layer)?.then(terrainLayer => {
            if (terrainLayer) {
              scene3d.setTerrain(new Cesium.Terrain(terrainLayer));
              this.currentTerrainLayerId = layer.id;
            }
          });
        }
      } else {
        if (this.layers3d.has(layer.id)) {
          const primitive = scene3d.primitives.get(this.layers3d.get(layer.id) ?? 0);
          primitive.show = true;
        } else {
          const tiles3DLayerPromise = this.create3dLayer(layer);
          tiles3DLayerPromise.then(tiles3dLayer => {
            if (tiles3dLayer) {
              scene3d.primitives.add(tiles3dLayer);
              for (let i = 0; i < scene3d.primitives.length; i++) {
                if (tiles3dLayer === scene3d.primitives.get(i)) {
                  this.layers3d.set(layer.id, i);
                  break;
                }
              }
            }
          }).catch(error => { console.log(`Error while adding 3D layer: ${error}`); });
        }
      }
    });
  }

  private removeLayer(layer: LayerModel) {
    this.executeScene3dAction(async scene3d => {
      if (this.layers3d.has(layer.id)) {
        const primitive = scene3d.primitives.get(this.layers3d.get(layer.id) ?? 0);
        primitive.show = false;

      }
    });
  }

  private async create3dLayer(
    layer: LayerModel,
  ): Promise<Cesium3DTileset | null> {
    if (LayerTypesHelper.isTiles3dLayer(layer)) {
      const resource = new Cesium.Resource({
        url: layer.url,
      });
      try {
        // Create Cesium 3D Tileset with optimization options
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
    this.executeScene3dAction(async scene3d => {
      scene3d.setTerrain(new Cesium.Terrain(new EllipsoidTerrainProvider()));
    });
    this.currentTerrainLayerId = CesiumManager.ELLIPSOID_TERRAIN_ID;
  }

  public getLayerId(index: number): string | null {
    for (const [ key, val ] of this.layers3d.entries()) {
      if (val === index) {
        return key;
      }
    }
    return null;
  }

  private createLayerIdentifiers(layers: LayerModel[]): string[] {
    return layers.map(layer => {
      const visible: string = layer.visible.toString();
      return layer.id + visible;
    });
  }

}
