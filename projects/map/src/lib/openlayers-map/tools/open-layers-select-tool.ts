import { Subject } from 'rxjs';
import { Collection, Feature, Map as OlMap } from 'ol';
import { MapStyleHelper } from '../../helpers/map-style.helper';
import { NgZone } from '@angular/core';
import { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { Select } from 'ol/interaction';
import { Layer as BaseLayer } from 'ol/layer';
import { OlLayerHelper } from '../../helpers/ol-layer.helper';
import { SelectEvent } from 'ol/interaction/Select';
import { FeatureModel, FeatureModelAttributes } from '@tailormap-viewer/api';
import { SelectToolConfigModel, SelectToolModel } from '../../models';
import { FeatureHelper } from '../../helpers/feature.helper';

export class OpenLayersSelectTool<A extends FeatureModelAttributes = FeatureModelAttributes> implements SelectToolModel<A> {

  private destroyed = new Subject();
  private selectInteraction: Select | null = null;
  private layerFilterSet: Set<string> = new Set();
  private listeners: EventsKey[] = [];

  private selectedFeaturesSubject: Subject<Array<FeatureModel<A> | null> | null> = new Subject<Array<FeatureModel<A> | null> | null>();
  public selectedFeatures$ = this.selectedFeaturesSubject.asObservable();

  private selectedFeaturesCollection = new Collection<Feature>();

  constructor(
    public id: string,
    private toolConfig: SelectToolConfigModel,
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {
    if (this.toolConfig.layers) {
      this.layerFilterSet = new Set(this.toolConfig.layers);
    }
  }

  public isActive = false;

  public destroy(): void {
    this.disable();
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public disable(): void {
    this.isActive = false;
    this.stopSelection();
  }

  public enable(): void {
    this.listeners = [];
    this.isActive = true;
    this.selectInteraction = new Select({
      layers: this.toolConfig.layers ? this.filterLayers.bind(this) : undefined,
      style: this.getSelectionStyle(),
      multi: false,
      hitTolerance: 4,
      features: this.selectedFeaturesCollection,
    });
    this.olMap.addInteraction(this.selectInteraction);
    this.listeners.push(this.selectInteraction.on('select', (e: SelectEvent) => {
      this.ngZone.run(() => this.selectedFeaturesSubject.next((e.selected || []).map(feature => {
        if (!feature) {
          return null;
        }
        return FeatureHelper.getFeatureModelForFeature<A>(feature, this.olMap.getView().getProjection());
      })));
    }));
  }

  public setSelectedFeature(feature: FeatureModel | null) {
    this.selectedFeaturesCollection.clear();
    FeatureHelper.getFeatures(feature).forEach(f => {
      this.selectedFeaturesCollection.push(f);
    });
  }

  private filterLayers(layer: BaseLayer) {
    const layerProps = OlLayerHelper.getLayerProps(layer);
    return !(!layerProps || !this.layerFilterSet.has(layerProps.id));
  }

  private stopSelection() {
    if (!this.selectInteraction) {
      return;
    }
    this.olMap.removeInteraction(this.selectInteraction);
    this.selectInteraction.dispose();
    this.selectInteraction = null;
    unByKey(this.listeners);
    this.listeners = [];
  }

  private getSelectionStyle() {
    if (typeof this.toolConfig.style === 'function') {
      return MapStyleHelper.getStyle(this.toolConfig.style);
    }
    return MapStyleHelper.getStyle({
      styleKey: 'select-style',
      zIndex: 9999,
      strokeColor: 'rgba(0, 0, 0, 0.3)',
      strokeWidth: 2,
      pointType: 'circle',
      pointStrokeColor: 'rgba(0, 0, 0, 0.7)',
      pointFillColor: 'rgba(255, 255, 255, 0.5)',
      ...(this.toolConfig.style || {}),
    });
  }

}
