import { Map as OlMap } from 'ol';
import { LayerModel } from '../models/layer.model';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import { NgZone } from '@angular/core';
import type OLCesium from 'olcs';
import { BehaviorSubject, filter, from, map, Observable, take } from 'rxjs';
import type { Cesium3DTileset, Scene } from 'cesium';
import { ExternalLibsLoaderHelper } from '@tailormap-viewer/shared';

export class CesiumLayerManager {

  private map3D: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);

  constructor(
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {
  }

  public init() {
    ExternalLibsLoaderHelper.loadScript$('/cesium/Cesium.js')
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

      // this.executeScene3DAction(scene3D => {
      //   const OLCS_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YjQ4MDkzYi02ZjJjLTQ5YTgtY' +
      //     'jAyZC1lN2IxZGZlMDFlMDkiLCJpZCI6MTk3Mzk5LCJpYXQiOjE3MDg2Nzg4ODh9.DQT_DNkF7XS8vtMtIde2oeZsJoQTqm4K3qFahQ1-tR8';
      //   Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
      //   scene3D.setTerrain(
      //     new Cesium.Terrain(
      //       Cesium.CesiumTerrainProvider.fromIonAssetId(1),
      //     ),
      //   );
      // });
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
    });
  }

  public addLayers(layers: LayerModel[]){
    this.ngZone.runOutsideAngular(() => {
      layers.forEach(layer => {
          this.addLayer(layer);
        });
    });
  }

  private addLayer(layer: LayerModel) {
    this.executeScene3DAction(async scene3D => {
      this.create3DLayer(layer)?.then(cesiumLayer => {
        if (cesiumLayer) {
          scene3D.primitives.add(cesiumLayer);
        }
      });
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

}
