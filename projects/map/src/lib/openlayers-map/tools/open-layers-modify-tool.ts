import { Subject } from 'rxjs';
import { Map as OlMap } from 'ol';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { FeatureHelper } from '../../helpers/feature.helper';
import { ModifyEnableToolArguments, ModifyToolModel } from '../../models/tools/modify-tool.model';
import { ModifyToolConfigModel } from '../../models/tools/modify-tool-config.model';
import { Modify, Translate } from 'ol/interaction';
import { TranslateEvent } from 'ol/interaction/Translate';
import { ModifyEvent } from 'ol/interaction/Modify';
import { NgZone } from "@angular/core";
import { Vector as VectorLayer } from 'ol/layer';
import { Geometry } from 'ol/geom';
import { Vector as VectorSource } from 'ol/source';
import { MapStyleHelper } from "../../helpers/map-style.helper";

export class OpenLayersModifyTool implements ModifyToolModel {

  private listeners: EventsKey[] = [];
  private destroyed = new Subject();
  private translateInteraction: Translate | null = null;
  private modifyInteraction: Modify | null = null;

  private geometryChangedSubject: Subject<string> = new Subject<string>();
  public featureModified$ = this.geometryChangedSubject.asObservable();
  private editLayer: VectorLayer<VectorSource> | null = null;
  private source: VectorSource<Geometry> | null = null;

  constructor(
    public id: string,
    private toolConfig: ModifyToolConfigModel,
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

  public enable(args: ModifyEnableToolArguments): void {
    this.stopModify();
    if (!args || !args.geometry) {
      return;
    }
    this.listeners = [];
    this.isActive = true;
    const { layer, source } = this.getLayer(args.geometry);
    this.translateInteraction = new Translate({ layers: [layer] });
    this.listeners.push(this.translateInteraction.on('translateend', e => this.eventHandler(e)));
    this.modifyInteraction = new Modify({ source });
    this.listeners.push(this.modifyInteraction.on('modifyend', e => this.eventHandler(e)));
    this.olMap.getInteractions().extend([ this.translateInteraction, this.modifyInteraction ]);
  }

  private getLayer(geometry: string) {
    if (!this.editLayer || !this.source) {
      this.source = new VectorSource();
      this.editLayer = new VectorLayer({
        style: this.getStyle(),
        zIndex: this.olMap.getAllLayers().length + 9999,
        source: this.source,
      });
      this.olMap.addLayer(this.editLayer);
    }
    this.source.getFeatures().forEach(feature => {
      this.source?.removeFeature(feature);
    });
    FeatureHelper.getFeatures(geometry).forEach(feature => {
      this.source?.addFeature(feature);
    });
    return { layer: this.editLayer, source: this.source };
  }

  private getStyle() {
    return MapStyleHelper.getStyle({
      styleKey: 'edit-tool-style',
      zIndex: 9999,
      strokeColor: 'rgba(0, 0, 0, 0.3)',
      strokeWidth: 2,
      pointType: 'circle',
      pointStrokeColor: 'rgba(0, 0, 0, 0.7)',
      pointFillColor: 'rgba(255, 255, 255, 0.5)',
      ...(this.toolConfig.style || {}),
    });
  }

  private stopModify() {
    unByKey(this.listeners);
    this.source?.getFeatures().forEach(feature => {
      this.source?.removeFeature(feature);
    });
    if (this.translateInteraction) {
      this.olMap.removeInteraction(this.translateInteraction);
      this.translateInteraction.dispose();
      this.translateInteraction = null;
    }
    if (this.modifyInteraction) {
      this.olMap.removeInteraction(this.modifyInteraction);
      this.modifyInteraction.dispose();
      this.modifyInteraction = null;
    }
    this.listeners = [];
  }

  private eventHandler(event: TranslateEvent | ModifyEvent) {
    const geom = event.features.item(0)?.getGeometry();
    if (!geom) {
      return;
    }
    this.ngZone.run(() => {
      this.geometryChangedSubject.next(FeatureHelper.getWKT(geom, this.olMap.getView().getProjection()));
    });
  }

}
