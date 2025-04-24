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
import { TerrainLayerModel } from '../../models/terrain-layer.model';
import { Tiles3dLayerModel } from '../../models/tiles3d-layer.model';

export class CesiumManager {

  private static ELLIPSOID_TERRAIN_ID = "ellipsoid";

  private map3d: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private layers3dPrimitiveIndexes: Map<string, number> = new Map<string, number>();
  private currentTerrainLayerId: string = CesiumManager.ELLIPSOID_TERRAIN_ID;
  private prevLayerIdentifiers: string[] = [];
  private createdTiles3dLayerIds: string[] = [];


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
              creditContainer: document.createElement('dummyContainer'),
            },
          });
          ol3d.setRefresh2DAfterCameraMoveEndOnly(true);
          ol3d.setTargetFrameRate(60);
          this.map3d.next(ol3d);
        });
      this.executeScene3dAction(scene3d => {
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
    const layerIdentifiers: string[] = layers.map(layer => `${layer.id}_${layer.visible}`);
    if (ArrayHelper.arrayEquals(layerIdentifiers, this.prevLayerIdentifiers)) {
      this.executeScene3dAction(scene3d => {
        scene3d.requestRender();
      });
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
      this.executeScene3dAction(scene3d => {
        scene3d.requestRender();
      });
    });
  }

  private addLayer(layer: LayerModel) {
    this.executeScene3dAction(scene3d => {
      if (LayerTypesHelper.isTerrainLayer(layer)) {
        if (this.currentTerrainLayerId !== layer.id) {
          this.createTerrainLayer(layer)?.then(terrainLayer => {
            if (terrainLayer) {
              scene3d.setTerrain(new Cesium.Terrain(terrainLayer));
              this.currentTerrainLayerId = layer.id;
            }
          }).catch(error => { console.error(`Error while adding terrain layer: ${error}`); });
        }
        return;
      }
      if (LayerTypesHelper.isTiles3dLayer(layer)){
        if (this.layers3dPrimitiveIndexes.has(layer.id)) {
          const primitive = scene3d.primitives.get(this.layers3dPrimitiveIndexes.get(layer.id) ?? 0);
          primitive.show = true;
        } else if (!this.createdTiles3dLayerIds.includes(layer.id)) {
          this.createdTiles3dLayerIds.push(layer.id);
          const tiles3DLayerPromise = this.create3dTilesLayer(layer);
          tiles3DLayerPromise.then(tiles3dLayer => {
            if (tiles3dLayer) {
              scene3d.primitives.add(tiles3dLayer);
              for (let i = 0; i < scene3d.primitives.length; i++) {
                if (tiles3dLayer === scene3d.primitives.get(i)) {
                  this.layers3dPrimitiveIndexes.set(layer.id, i);
                  break;
                }
              }
            }
          }).catch(error => { console.error(`Error while adding 3D Tiles layer: ${error}`); });
        }
      }
    });
  }

  private removeLayer(layer: LayerModel) {
    this.executeScene3dAction(scene3d => {
      if (this.layers3dPrimitiveIndexes.has(layer.id)) {
        const primitive = scene3d.primitives.get(this.layers3dPrimitiveIndexes.get(layer.id) ?? 0);
        primitive.show = false;
      }
    });
  }

  private create3dTilesLayer(layer: Tiles3dLayerModel): Promise<Cesium3DTileset> {
    try {
      // Create Cesium 3D Tileset with optimization options
      return Cesium.Cesium3DTileset.fromUrl(layer.url, {
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
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private createTerrainLayer(layer: TerrainLayerModel): Promise<CesiumTerrainProvider> {
    try {
      return Cesium.CesiumTerrainProvider.fromUrl(layer.url);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private setEllipsoidTerrain() {
    this.executeScene3dAction(scene3d => {
      scene3d.setTerrain(new Cesium.Terrain(new EllipsoidTerrainProvider()));
    });
    this.currentTerrainLayerId = CesiumManager.ELLIPSOID_TERRAIN_ID;
  }

  public getLayerId(index: number): string | null {
    for (const [ key, val ] of this.layers3dPrimitiveIndexes.entries()) {
      if (val === index) {
        return key;
      }
    }
    return null;
  }

}
