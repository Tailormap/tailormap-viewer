import { Map as OlMap } from 'ol';
import { LayerModel } from '../models/layer.model';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import { NgZone } from '@angular/core';
import { CesiumLayerHelper } from '../helpers/cesium-layer.helper';
import OLCesium from 'olcs';
import { BehaviorSubject, filter, Observable, take } from 'rxjs';
import { Cesium3DTileset, Scene } from 'cesium';

export class CesiumLayerManager {

  // private layers: Map<string, BaseLayer> = new Map<string, BaseLayer>();

  private map3D: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private scene3D: BehaviorSubject<Scene | null> = new BehaviorSubject<Scene | null>(null);

  constructor(private olMap: OlMap, private ngZone: NgZone) {}

  public init() {
    (window as any).CESIUM_BASE_URL = 'cesium';
    const ol3d = new OLCesium({
      map: this.olMap,
    });
    const scene = ol3d.getCesiumScene();

    this.map3D.next(ol3d);
    this.scene3D.next(scene);

    this.executeScene3DAction(scene3D => {
      const OLCS_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YjQ4MDkzYi02ZjJjLTQ5YTgtY' +
        'jAyZC1lN2IxZGZlMDFlMDkiLCJpZCI6MTk3Mzk5LCJpYXQiOjE3MDg2Nzg4ODh9.DQT_DNkF7XS8vtMtIde2oeZsJoQTqm4K3qFahQ1-tR8';
      Cesium.Ion.defaultAccessToken = OLCS_ION_TOKEN;
      scene3D.setTerrain(
        new Cesium.Terrain(
          Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        ),
      );
    });
  }

  public getMap3D$(): Observable<OLCesium> {
    const isNotNullMap3D = (item: OLCesium | null): item is OLCesium => item !== null;
    return this.map3D.asObservable().pipe(filter(isNotNullMap3D));
  }

  public executeMap3DAction(fn: (olMap3D: OLCesium) => void) {
    this.getMap3D$()
      .pipe(take(1))
      .subscribe(olMap3D => fn(olMap3D));
  }

  public getScene3D$(): Observable<Scene> {
    const isNotNullScene3D = (item: Scene | null): item is Scene => item !== null;
    return this.scene3D.asObservable().pipe(filter(isNotNullScene3D));
  }

  public executeScene3DAction(fn: (scene3D: Scene) => void) {
    this.getScene3D$()
      .pipe(take(1))
      .subscribe(scene3D => fn(scene3D));
  }

  public switch3D$(){
    this.executeMap3DAction(olMap3D => {
      olMap3D.setEnabled(!olMap3D.getEnabled());
    });
  }

  private createLayer(layer: LayerModel): Promise<Cesium3DTileset> | null {
    const cesiumLayer = CesiumLayerHelper.create3DLayer(layer);
    if (!cesiumLayer){
      return null;
    }
    return cesiumLayer;
  }

  public addLayer(layer: LayerModel) {
    if (LayerTypesHelper.isTileset3DLayer(layer)){
      this.executeScene3DAction(scene3D => {
        // this.createLayer(layer)?.then(layer3D => console.log(layer3D));

        this.createLayer(layer)?.then(layer3D => scene3D.primitives.add(layer3D));
      });
    }
  }

  public addLayers(layers: LayerModel[]){
    layers
      .forEach(layer => {
        this.addLayer(layer);
      });
  }

}
