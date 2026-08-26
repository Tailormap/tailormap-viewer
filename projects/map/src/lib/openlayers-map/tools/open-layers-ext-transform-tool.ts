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
import { SelectionStyleHelper } from '../../helpers/style/selection-style.helper';

const rotateIcon = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
  '<path d="M0 0h24v24H0z" fill="rgba(255, 255, 255, 0.01)"/>' +
  // eslint-disable-next-line max-len
  '<path d="M7.1 8.5 5.7 7.1A8 8 0 0 0 4.1 11h2a6 6 0 0 1 1-2.5zm-1 4.5H4a8 8 0 0 0 1.6 3.9L7 15.5a6 6 0 0 1-1-2.5zm1 5.3A8 8 0 0 0 11 20v-2a6 6 0 0 1-2.5-1l-1.4 1.4zM13 4.1V1L8.4 5.5 13 10V6a6 6 0 0 1 0 12v2a8 8 0 0 0 0-16z" fill="rgb(255, 0, 0)" />' +
  '</svg>');

interface KeyboardControlEntry {
  element: HTMLElement;
  enableArgs: ExtTransformEnableToolArguments;
  keydownHandler: (ev: KeyboardEvent) => void;
  focusHandler: () => void;
}

export class OpenLayersExtTransformTool implements ExtTransformToolModel {

  private listeners: EventsKey[] = [];
  private destroyed = new Subject();
  private interaction: OlExtTransform | null = null;
  private modifyInteraction: Modify | null = null;

  private geometryChangedSubject: Subject<string> = new Subject<string>();
  public featureModified$ = this.geometryChangedSubject.asObservable();
  private editLayer: VectorLayer | null = null;
  private source: VectorSource | null = null;

  public supportsSnapping = true;

  /**
   * Map of keyboard control elements indexed by feature id
   */
  private keyboardControls: Map<string, KeyboardControlEntry> = new Map();

  /**
   * Currently active feature id
   */
  private activeFeatureId: string | null = null;

  constructor(
    public id: string,
    private toolConfig: ExtTransformToolConfigModel,
    private olMap: OlMap,
    private ngZone: NgZone,
  ) {}

  public isActive = false;

  public destroy(): void {
    this.disable();
    this.destroyAllKeyboardControls();
    if (this.editLayer) {
      this.olMap.removeLayer(this.editLayer);
      this.editLayer.dispose();
      this.editLayer = null;
    }
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public disable(): void {
    console.debug(`[OpenLayersExtTransformTool] Disabling tool ${this.id}`);
    this.isActive = false;
    this.stopModify();
  }

  public enable(args: ExtTransformEnableToolArguments): void {
    console.debug(`[OpenLayersExtTransformTool] Enabling tool ${this.id} with feature`, args.feature);
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
    this.fixCursorBug();
    this.enableVertices(source);
    this.ensureKeyboardControlForFeature(args);
    this.activeFeatureId = args.feature.__fid;
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
      return MapStyleHelper.getStyle(style, this.olMap.getView().getProjection().getCode());
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
    }, this.olMap.getView().getProjection().getCode());
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
      this.olMap.getTargetElement().style.cursor = '';
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
    return SelectionStyleHelper.getSelectionRectangleBuffer(this.olMap.getView().getResolution());
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

  private fixCursorBug() {
    let timer: number | null = null;
    OpenLayersEventManager.onMouseMove$().pipe(takeUntil(this.destroyed)).subscribe(e => {
      if (!this.interaction) {
        return;
      }
      // There is a bug in ol-ext Transform interaction where the cursor does not reset to default when moving over the map after modifying a feature.
      // We are using an internal ol-ext-transform method here to check if the cursor is over the feature that is being modified.
      // Check if this still works in the future, as this is not part of the public API.
      // Check below is to prevent errors when the interaction is not yet initialized or the method does not exist anymore.
      if (!(this.interaction as any).getFeatureAtPixel_) {
        return;
      }
      const found = (this.interaction as any).getFeatureAtPixel_(e.pixel);
      if(timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      if (!found.feature && this.olMap.getTargetElement().style.cursor !== '') {
        timer = window.setTimeout(() => {
          this.olMap.getTargetElement().style.cursor = '';
        }, 50);
      }
    });
  }

  /**
   * Ensure a keyboard control element exists for the given feature.
   * Creates one if it doesn't exist yet.
   */
  private ensureKeyboardControlForFeature(args: ExtTransformEnableToolArguments) {
    const featureId = args.feature.__fid;
    if (this.keyboardControls.has(featureId)) {
      this.keyboardControls.get(featureId)?.element.focus();
      return;
    }

    // Create new keyboard control for this feature
    const element = document.createElement('div');
    element.className = 'tm-transform-keyboard-control';
    element.tabIndex = 0;
    element.setAttribute('aria-label', $localize `:@@core.map.transform-keyboard-control:Transform tool - use arrow keys to move, R to rotate, +/- to scale`);
    element.style.position = 'absolute';
    element.style.width = '0';
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.pointerEvents = 'none';

    // Create bound handlers for this specific feature
    const keydownHandler = (ev: KeyboardEvent) => this.onKeyboardControlKeyDown(ev, featureId);
    const focusHandler = () => this.onKeyboardControlFocus(featureId);

    element.addEventListener('keydown', keydownHandler);
    element.addEventListener('focus', focusHandler);

    const mapTarget = this.olMap.getTargetElement();
    mapTarget.appendChild(element);

    // Store the control entry
    this.keyboardControls.set(featureId, {
      element,
      enableArgs: args,
      keydownHandler,
      focusHandler,
    });

    // Focus the newly created control
    element.focus();
  }

  /**
   * Destroy all keyboard control elements.
   * Called when the tool is destroyed.
   */
  private destroyAllKeyboardControls() {
    this.keyboardControls.forEach((entry) => {
      entry.element.removeEventListener('keydown', entry.keydownHandler);
      entry.element.removeEventListener('focus', entry.focusHandler);
      if (entry.element.parentNode) {
        entry.element.parentNode.removeChild(entry.element);
      }
    });
    this.keyboardControls.clear();
    this.activeFeatureId = null;
  }

  /**
   * Handle focus event on a keyboard control - re-enable with the associated feature.
   */
  private onKeyboardControlFocus(featureId: string) {
    const entry = this.keyboardControls.get(featureId);
    if (entry && !this.isActive) {
      this.enable(entry.enableArgs);
    }
  }

  /**
   * Handle keyboard input for transforming the selected feature.
   * Only processes input when a keyboard control has focus.
   * Arrow keys: translate
   * R: rotate
   * +/-: scale
   * Escape: disable tool and remove focus
   * Hold Shift for larger steps.
   */
  private onKeyboardControlKeyDown(ev: KeyboardEvent, featureId: string) {
    // Handle Escape key to disable the tool
    if (ev.key === 'Escape') {
      this.disable();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    const features = this.source?.getFeatures();
    if (!features || features.length === 0) {
      return;
    }
    const feature = features[0];
    const geom = feature.getGeometry();
    if (!geom) {
      return;
    }

    const view = this.olMap.getView();
    const resolution = view.getResolution() || 1;
    const pixelStep = ev.shiftKey ? 20 : 5;              // pixels
    const mapStep = pixelStep * resolution;             // map units
    const rotationDeg = ev.shiftKey ? 15 : 5;           // degrees
    const scaleStep = ev.shiftKey ? 0.1 : 0.05;         // scale factor step

    let handled = false;

    switch (ev.key) {
      case 'ArrowUp':
        geom.translate(0, mapStep);
        handled = true;
        break;
      case 'ArrowDown':
        geom.translate(0, -mapStep);
        handled = true;
        break;
      case 'ArrowLeft':
        geom.translate(-mapStep, 0);
        handled = true;
        break;
      case 'ArrowRight':
        geom.translate(mapStep, 0);
        handled = true;
        break;
      case 'r':
      case 'R': {
        const rotationRad = rotationDeg * Math.PI / 180 * (ev.key === 'R' ? -1 : 1);
        const extent = geom.getExtent();
        const anchor = [ (extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2 ];
        geom.rotate(rotationRad, anchor);
        handled = true;
        break;
      }
      case '+':
      case '=': {
        const extent = geom.getExtent();
        const anchor = [ (extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2 ];
        const scaleFactor = 1 + scaleStep;
        geom.scale(scaleFactor, scaleFactor, anchor);
        handled = true;
        break;
      }
      case '-': {
        const extent = geom.getExtent();
        const anchor = [ (extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2 ];
        const scaleFactor = 1 - scaleStep;
        geom.scale(scaleFactor, scaleFactor, anchor);
        handled = true;
        break;
      }
      default:
        break;
    }

    if (handled) {
      feature.setGeometry(geom);
      this.eventHandler(feature);
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

}
