import { Feature, Map as OlMap } from 'ol';
import { Layer as BaseLayer, Vector as VectorLayer, Group as LayerGroup } from 'ol/layer';
import { Geometry } from 'ol/geom';
import { Vector as VectorSource, ImageWMS, WMTS, XYZ, TileWMS } from 'ol/source';
import {  } from 'ol/layer';
import { LayerManagerModel, LayerTypes, LayerTypes3D } from '../models';
import { OlLayerHelper } from '../helpers/ol-layer.helper';
import { LayerModel } from '../models/layer.model';
import { VectorLayerModel } from '../models/vector-layer.model';
import { isOpenLayersVectorLayer, isOpenLayersWMSLayer, isPossibleRealtimeLayer } from '../helpers/ol-layer-types.helper';
import { LayerTypesHelper } from '../helpers/layer-types.helper';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { NgZone } from '@angular/core';
import { HttpXsrfTokenExtractor } from '@angular/common/http';
import { ServerType } from '@tailormap-viewer/api';
import { CesiumLayerHelper } from '../helpers/cesium-layer.helper';
import OLCesium from 'olcs';
import { BehaviorSubject, filter, Observable, take } from 'rxjs';
import { Scene, CesiumTerrainProvider, Cesium3DTileset, Ion } from 'cesium';

export class CesiumLayerManager {

  private layers: Map<string, BaseLayer> = new Map<string, BaseLayer>();

  private map3D: BehaviorSubject<OLCesium | null> = new BehaviorSubject<OLCesium | null>(null);
  private scene3D: BehaviorSubject<Scene | null> = new BehaviorSubject<Scene | null>(null);

  constructor(private olMap: OlMap, private ngZone: NgZone, private httpXsrfTokenExtractor: HttpXsrfTokenExtractor) {}

  public init() {
    const ol3d = new OLCesium({
      map: this.olMap,
    });
    const scene = ol3d.getCesiumScene();

    this.map3D.next(ol3d);
    this.scene3D.next(scene);

    this.executeScene3DAction(scene3D => {
      CesiumTerrainProvider.fromUrl('https://download.swissgeol.ch/cli_terrain/ch-2m/').then(tp => scene3D.terrainProvider = tp);
    });
    // CesiumTerrainProvider.fromUrl('https://download.swissgeol.ch/cli_terrain/ch-2m/').then(tp => scene.terrainProvider = tp);
    // scene.primitives.add(Cesium3DTileset.fromUrl('https://3dtilesnederland.nl/tiles/1.0/implicit/nederland/599.json'));

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


  // public destroy() {
  //   this.layers = new Map();
  //   this.backgroundLayers = new Map();
  //   this.vectorLayers = new Map();
  //   this.olMap.removeLayer(this.backgroundLayerGroup);
  //   this.olMap.removeLayer(this.baseLayerGroup);
  //   this.olMap.removeLayer(this.vectorLayerGroup);
  // }
  //
  // public setLayers(layers: LayerModel[]) {
  //   this.prevLayerIdentifiers = this.updateLayers(
  //     layers,
  //     this.layers,
  //     this.prevLayerIdentifiers,
  //     this.addLayer.bind(this),
  //     this.removeLayer.bind(this),
  //   );
  // }
  //
  // private updateLayers(
  //   layers: LayerModel[],
  //   currentLayerMap: Map<string, BaseLayer>,
  //   prevLayerIdentifiers: string[],
  //   addLayer: (layer: LayerModel, zIndex: number) => void,
  //   removeLayer: (id: string) => void,
  // ) {
  //   const layerIdentifiers = this.createLayerIdentifiers(layers);
  //   if (ArrayHelper.arrayEquals(layerIdentifiers, prevLayerIdentifiers)) {
  //     return prevLayerIdentifiers;
  //   }
  //   const layerIds = layers.map(layer => layer.id);
  //   const layerIdSet = new Set(layerIds);
  //   const removableLayers: string[] = [];
  //   currentLayerMap.forEach((layer, id) => {
  //     if (!layerIdSet.has(id)) {
  //       removableLayers.push(id);
  //     }
  //   });
  //   removableLayers.forEach(id => removeLayer(id));
  //   const layerOrder = layerIds.reverse();
  //   layers
  //     .forEach(layer => {
  //       const zIndex = layerOrder.indexOf(layer.id);
  //       const existingLayer = currentLayerMap.get(layer.id);
  //       if (existingLayer) {
  //         this.updatePropertiesIfChanged(layer, existingLayer);
  //         this.updateFilterIfChanged(layer, existingLayer);
  //         return;
  //       }
  //       addLayer(layer, zIndex);
  //     });
  //   return layerIdentifiers;
  // }
  //
  // public addLayer<LayerType extends LayerTypes>(layer: LayerModel): LayerType | null {
  //   const olLayer = this.createLayer(layer);
  //   if (olLayer === null) {
  //     return null;
  //   }
  //   OlLayerHelper.setLayerProps(layer, olLayer);
  //   return olLayer as LayerType;
  // }
  //
  // // Create an identifier for each layer to quickly check if something changed and requires re-rendering
  // private createLayerIdentifiers(layers: LayerModel[]): string[] {
  //   return layers.map(layer => {
  //     const changingProps = [layer.opacity ? `${layer.opacity}` : undefined];
  //     if (LayerTypesHelper.isServiceLayer(layer)) {
  //       changingProps.push(layer.filter);
  //     }
  //     return [ layer.id, ...changingProps.filter(Boolean) ].join('_');
  //   });
  // }
  //
  // private updatePropertiesIfChanged(layer: LayerModel, olLayer: BaseLayer) {
  //   const currentOpacity = olLayer.getOpacity();
  //   const layerOpacity = typeof layer.opacity === 'undefined' ? 1 : layer.opacity / 100;
  //   if (currentOpacity !== layerOpacity) {
  //     olLayer.setOpacity(layerOpacity);
  //   }
  // }
  //
  // private updateFilterIfChanged(layer: LayerModel, olLayer: BaseLayer) {
  //   // For now, GeoServer & WMS only
  //   if (!LayerTypesHelper.isWmsLayer(layer) || layer.serverType !== ServerType.GEOSERVER) {
  //     return;
  //   }
  //   const existingProps = OlLayerHelper.getLayerProps(olLayer);
  //   if (existingProps.filter === layer.filter) {
  //     return;
  //   }
  //   OlLayerHelper.setLayerProps(layer, olLayer);
  //   if (isOpenLayersWMSLayer(olLayer)) {
  //     olLayer.getSource()?.updateParams({ CQL_FILTER: layer.filter });
  //   }
  // }
  //
  // public removeLayer(id: string) {
  //   this.removeLayerAndSource(id, this.baseLayerGroup, this.layers);
  // }
  //
  // public removeLayers(layerIds: string[]) {
  //   layerIds.forEach(l => this.removeLayerAndSource(l, this.baseLayerGroup, this.layers));
  // }
  //
  // public getLayer(layerId: string) {
  //   const layer = this.layers.get(layerId) || this.vectorLayers.get(layerId);
  //   if (!layer) {
  //     return;
  //   }
  //   return layer;
  // }
  //
  // public addLayers(layers: LayerModel[]) {
  //   layers.forEach(layer => this.addLayer(layer));
  // }
  //
  // public refreshLayer(layerId: string) {
  //   const layer = this.layers.get(layerId);
  //   if (!layer || !isPossibleRealtimeLayer(layer)) {
  //     return;
  //   }
  //   const source = layer.getSource();
  //   if (source instanceof ImageWMS || source instanceof TileWMS) {
  //     source.updateParams({ CACHE: Date.now() });
  //   }
  //   if (source instanceof WMTS || source instanceof XYZ) {
  //     const urls = (source.getUrls() || []).map(url => {
  //       const u = new URL(url);
  //       u.searchParams.set('CACHE', `${Date.now()}`);
  //       return u.toString();
  //     });
  //     source.setUrls(urls);
  //   }
  // }
  //
  // private addLayerToScene(layer: BaseLayer) {
  //
  // }
  //
  // private removeLayerAndSource(
  //   layerId: string,
  //   layerGroup: LayerGroup,
  //   layerMap: Map<string, BaseLayer>,
  // ) {
  //   const layer = layerMap.get(layerId) || this.vectorLayers.get(layerId);
  //   if (!layer) {
  //     return;
  //   }
  //   const layers = layerGroup.getLayers();
  //   layers.remove(layer);
  //   layerGroup.setLayers(layers);
  //   layerMap.delete(layerId);
  // }
  //
  // private createLayer(layer: LayerModel): LayerTypes {
  //
  //   // if (LayerTypesHelper.isTileset3DLayer(layer)){
  //   //   return CesiumLayerHelper.createTileset3DLayer(layer);
  //   // }
  //   const olLayer = OlLayerHelper.createLayer(layer, this.olMap.getView().getProjection(), this.ngZone, this.httpXsrfTokenExtractor);
  //   if (!olLayer) {
  //     return null;
  //   }
  //   if (typeof layer.opacity === 'number') {
  //     olLayer.setOpacity(layer.opacity / 100);
  //   }
  //   return olLayer;
  // }

}
