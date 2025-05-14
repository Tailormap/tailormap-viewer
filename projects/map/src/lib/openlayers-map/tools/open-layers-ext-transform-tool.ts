import { Subject, takeUntil } from 'rxjs';
import { Map as OlMap } from 'ol';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { NgZone } from "@angular/core";
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { MapStyleHelper } from "../../helpers/map-style.helper";
import { MapStyleModel } from '../../models';
import { FeatureModel } from '@tailormap-viewer/api';
import { ExtTransformEnableToolArguments, ExtTransformToolModel } from '../../models/tools/ext-transform-tool.model';
import { ExtTransformToolConfigModel } from '../../models/tools/ext-transform-tool-config.model';
import OlExtTransform from 'ol-ext/interaction/Transform';
import { FeatureHelper } from '../../helpers/feature.helper';
import { Feature } from 'ol';
import { Icon, Style } from 'ol/style';
import { Modify } from 'ol/interaction';
import { GeometryTypeHelper } from '../../helpers/geometry-type.helper';
import { OpenLayersEventManager } from '../open-layers-event-manager';

const rotateIcon = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
  '<path d="M0 0h24v24H0z" fill="rgba(255, 255, 255, 0.01)"/>' +
  // eslint-disable-next-line max-len
  '<path d="M7.1 8.5 5.7 7.1A8 8 0 0 0 4.1 11h2a6 6 0 0 1 1-2.5zm-1 4.5H4a8 8 0 0 0 1.6 3.9L7 15.5a6 6 0 0 1-1-2.5zm1 5.3A8 8 0 0 0 11 20v-2a6 6 0 0 1-2.5-1l-1.4 1.4zM13 4.1V1L8.4 5.5 13 10V6a6 6 0 0 1 0 12v2a8 8 0 0 0 0-16z" fill="rgb(255, 0, 0)" />' +
  '</svg>');

export class OpenLayersExtTransformTool implements ExtTransformToolModel {

  private listeners: EventsKey[] = [];
  private destroyed = new Subject();
  private interaction: OlExtTransform | null = null;
  private modifyInteraction: Modify | null = null;

  private geometryChangedSubject: Subject<string> = new Subject<string>();
  public featureModified$ = this.geometryChangedSubject.asObservable();
  private editLayer: VectorLayer | null = null;
  private source: VectorSource | null = null;

  constructor(
    public id: string,
    private toolConfig: ExtTransformToolConfigModel,
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {}

  public isActive = false;

  public destroy(): void {
    this.disable();
    if (this.editLayer) {
      this.olMap.removeLayer(this.editLayer);
      this.editLayer.dispose();
      this.editLayer = null;
    }
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public disable(): void {
    this.isActive = false;
    this.stopModify();
  }

  public enable(args: ExtTransformEnableToolArguments): void {
    this.stopModify();
    this.destroyed = new Subject();
    if (!args || !args.feature) {
      return;
    }
    this.listeners = [];
    this.isActive = true;
    const { layer, source } = this.getLayer(args.feature, args.style);
    const isPoint = GeometryTypeHelper.isPointGeometry(source.getFeatures()[0].getGeometry());
    if (!isPoint) {
      this.enableTransformInteraction(layer, source);
    }
    this.enableVertices(source);
    OpenLayersEventManager.onMapMove$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        if (this.interaction) {
          this.interaction.set('buffer', this.getBuffer());
        }
      });
  }

  public enableTranslate() {
    this.interaction?.setActive(true);
    this.setRotateStyle();
  }

  public disableTranslate() {
    this.interaction?.setActive(false);
  }

  private getLayer(feature: FeatureModel, styleModel?: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel)) {
    if (!this.editLayer || !this.source) {
      this.source = new VectorSource();
      this.editLayer = new VectorLayer({
        zIndex: this.olMap.getAllLayers().length + 9999,
        source: this.source,
      });
      this.olMap.addLayer(this.editLayer);
    }
    this.editLayer.setStyle(this.getStyle(styleModel));
    this.source.getFeatures().forEach(f => {
      this.source?.removeFeature(f);
    });
    FeatureHelper.getFeatures(feature).forEach(f => {
      this.source?.addFeature(f);
    });
    return { layer: this.editLayer, source: this.source };
  }

  private getStyle(style?: Partial<MapStyleModel> | ((feature: FeatureModel) => MapStyleModel)) {
    if (typeof style === 'function') {
      return MapStyleHelper.getStyle(style);
    }
    return MapStyleHelper.getStyle({
      styleKey: 'edit-tool-style',
      zIndex: 9999,
      strokeColor: 'rgba(0, 0, 0, 0.3)',
      strokeWidth: 2,
      pointType: 'circle',
      pointStrokeColor: 'rgba(0, 0, 0, 0.7)',
      pointFillColor: 'rgba(255, 255, 255, 0.5)',
      ...(style || this.toolConfig.style),
    });
  }

  private stopModify() {
    unByKey(this.listeners);
    this.source?.getFeatures().forEach(feature => {
      this.source?.removeFeature(feature);
    });
    if (this.interaction) {
      this.olMap.removeInteraction(this.interaction);
      this.interaction.dispose();
      this.interaction = null;
    }
    this.listeners = [];
  }

  private eventHandler(feature?: Feature) {
    const geom = feature?.getGeometry();
    if (!geom) {
      return;
    }
    this.ngZone.run(() => {
      this.geometryChangedSubject.next(FeatureHelper.getWKT(geom, this.olMap.getView().getProjection()));
    });
  }

  private enableTransformInteraction(layer: VectorLayer, source: VectorSource) {
    this.interaction = new OlExtTransform({
      layers: [layer],
      selection: false,
      translate: true,
      // translateFeature: true,
      translateBBox: true,
      buffer: this.getBuffer(),
    });
    this.interaction.set('translate', true);
    this.listeners.push(this.interaction.on([ 'rotateend', 'translateend', 'scaleend' ], e => this.eventHandler(e.feature)));
    this.olMap.getInteractions().push(this.interaction);
    this.interaction.setActive(true);
    this.interaction.select(source.getFeatures()[0], true);
    this.setRotateStyle();
  }

  private enableVertices(source: VectorSource) {
    this.modifyInteraction = new Modify({ source });
    this.listeners.push(this.modifyInteraction.on('modifyend', e => this.eventHandler(e.features.item(0))));
    this.olMap.getInteractions().extend([this.modifyInteraction]);
  }

  private getBuffer() {
    return MapStyleHelper.getSelectionRectangleBuffer(this.olMap.getView().getResolution());
  }

  private setRotateStyle() {
    const rotateIconStyle = new Icon({
      src: rotateIcon,
      anchor: [ 0, 0 ],
      size: [ 24, 24 ],
      offset: [ -2, -2 ],
    });
    const rotateStyle = [new Style({ image: rotateIconStyle })];
    this.interaction?.setStyle('rotate', rotateStyle);
    this.interaction?.setStyle('rotate0', rotateStyle);
    this.interaction?.set('rotate', true);
  }

}
