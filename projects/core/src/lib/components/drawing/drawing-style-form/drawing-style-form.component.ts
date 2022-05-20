import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DrawingFeatureStyleModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { DrawingHelper } from '../helpers/drawing.helper';
import { MatSliderChange } from '@angular/material/slider';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'tm-drawing-style-form',
  templateUrl: './drawing-style-form.component.html',
  styleUrls: ['./drawing-style-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingStyleFormComponent implements OnInit, OnDestroy {

  private _style: DrawingFeatureStyleModel = {};

  @Input()
  public set style (style: DrawingFeatureStyleModel) {
    this._style = style;
    this.labelControl.patchValue(this.style.label || '', {
      emitEvent: false,
    });
    this.cdr.detectChanges();
  }

  public get style () {
    return this._style;
  }

  @Input()
  public type: DrawingFeatureTypeEnum | undefined;

  @Output()
  public styleUpdated: EventEmitter<DrawingFeatureStyleModel> = new EventEmitter<DrawingFeatureStyleModel>();

  public labelControl = new FormControl('');

  private availableMarkers = DrawingHelper.getAvailableMarkers();

  private debounce: number | undefined;
  private updatedProps: Map<keyof DrawingFeatureStyleModel, string | number | null> = new Map();
  private destroyed = new Subject();

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.labelControl.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe((val: string) => this.change('label', val));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public showPointSettings(): boolean {
    return this.type === DrawingFeatureTypeEnum.POINT;
  }

  public showLabelSettings(): boolean {
    return this.type === DrawingFeatureTypeEnum.POINT
      || this.type === DrawingFeatureTypeEnum.LABEL;
  }

  public showLineSettings(): boolean {
    return this.type === DrawingFeatureTypeEnum.LINE
      || this.type === DrawingFeatureTypeEnum.CIRCLE
      || this.type === DrawingFeatureTypeEnum.POLYGON;
  }

  public showPolygonSettings(): boolean {
    return this.type === DrawingFeatureTypeEnum.CIRCLE
      || this.type === DrawingFeatureTypeEnum.POLYGON;
  }

  public formatThumb(value: number) {
    return `${Math.round(value)}%`;
  }

  public changeStrokeColor($event: string) {
    this.change('strokeColor', $event);
    if (!this.showPolygonSettings()) {
      this.change('fillColor', $event);
    }
  }

  public changeMarkerFill($event: string) {
    this.change('markerFillColor', $event);
  }

  public changeMarkerStroke($event: string) {
    this.change('markerStrokeColor', $event);
  }

  public changeMarkerStrokeWidth($event: MatSliderChange) {
    this.change('markerStrokeWidth', $event.value);
  }

  public changeMarkerSize($event: MatSliderChange) {
    this.change('markerSize', $event.value);
  }

  public changeMarkerRotation($event: MatSliderChange) {
    this.change('markerRotation', $event.value);
  }

  public changeStrokeOpacity($event: MatSliderChange) {
    this.change('strokeOpacity', $event.value);
  }

  public changeStrokeWidth($event: MatSliderChange) {
    this.change('strokeWidth', $event.value);
  }

  public changeFillColor($event: string) {
    this.change('fillColor', $event);
  }

  public changeFillOpacity($event: MatSliderChange) {
    this.change('fillOpacity', $event.value);
  }

  public insertCoordinates() {
    const label = !!this.style.label
      ? `${this.style.label} [COORDINATES]`
      : '[COORDINATES]';
    this.change('label', label);
  }

  public changeLabelSize($event: MatSliderChange) {
    this.change('labelSize', $event.value);
  }

  public getMarkers() {
    return this.availableMarkers.map(m => m.icon);
  }

  public getSelectedMarker() {
    const marker = this.availableMarkers.find(m => m.value === this.style.marker);
    if (marker) {
      return marker.icon;
    }
    return '';
  }

  public changeMarker($event: string) {
    const marker = this.availableMarkers.find(m => m.icon === $event);
    if (marker) {
      this.change('marker', marker.value);
    }
  }

  private change(key: keyof DrawingFeatureStyleModel, value: string | number | null) {
    this.updatedProps.set(key, value);
    if (this.debounce) {
      window.clearTimeout(this.debounce);
    }
    this.debounce = window.setTimeout(() => this.saveStyle(), 25);
  }

  private saveStyle() {
    let style = { ...this.style };
    this.updatedProps.forEach((value, key) => {
      style = { ...style, [key]: value };
    });
    this.styleUpdated.emit(style);
    this.updatedProps.clear();
  }

}
