import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import {
  ArrowTypeEnum, DrawingFeatureStyleModel, LabelDrawingFeatureStyleModel, LabelStyleEnum, StrokeTypeEnum,
} from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../../../map/models/drawing-feature-type.enum';
import { DrawingHelper } from '../helpers/drawing.helper';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';
import { StyleHelper } from '@tailormap-viewer/shared';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ApplicationStyleService } from '../../../services/application-style.service';

@Component({
  selector: 'tm-drawing-style-form',
  templateUrl: './drawing-style-form.component.html',
  styleUrls: ['./drawing-style-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingStyleFormComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  private _style: DrawingFeatureStyleModel = {};

  @Input()
  public onlyLabelSettings: boolean = false;

  @Input()
  public set style (style: DrawingFeatureStyleModel) {
    this._style = style;
    this.labelControl.patchValue(this.style.label || '', {
      emitEvent: false,
    });
    const strokeType = Array.isArray(this.style.strokeType)
      ? this.style.strokeType.join(' ')
      : this.style.strokeType || StrokeTypeEnum.SOLID;
    this.strokeTypeControl.patchValue(strokeType, {
      emitEvent: false,
    });
    this.arrowTypeControl.patchValue(this.style.arrowType || ArrowTypeEnum.NONE, {
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

  @Output()
  public labelStyleUpdated: EventEmitter<LabelDrawingFeatureStyleModel> = new EventEmitter<LabelDrawingFeatureStyleModel>();

  public labelControl = new FormControl('', {
    nonNullable: true,
  });
  public strokeTypeControl = new FormControl<StrokeTypeEnum | string>(StrokeTypeEnum.SOLID, {
    nonNullable: true,
  });
  public arrowTypeControl = new FormControl<ArrowTypeEnum>(ArrowTypeEnum.NONE, {
    nonNullable: true,
  });

  private availableMarkers = DrawingHelper.getAvailableMarkers();
  public strokeTypeValues = DrawingHelper.strokeTypeValues;
  public arrowTypeValues = DrawingHelper.arrowTypeValues;
  public labelStyleValues = { bold: LabelStyleEnum.BOLD, italic: LabelStyleEnum.ITALIC };

  private debounce: number | undefined;
  private updatedStyleProps: Map<keyof DrawingFeatureStyleModel, string | number | null | boolean | LabelStyleEnum[] | number[]> = new Map();
  private labelDebounce: number | undefined;
  private updatedLabelStyleProps: Map<keyof LabelDrawingFeatureStyleModel, string | number | null | boolean | LabelStyleEnum[] | number[]> = new Map();

  private destroyed = new Subject();

  public iconColor = ApplicationStyleService.getPrimaryColor();

  public ngOnInit(): void {
    this.labelControl.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe((val: string) => this.changeLabel('label', val));
    this.strokeTypeControl.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe((val: StrokeTypeEnum | string) => {
        const strokeArray = StyleHelper.getDashArrayFromString(val);
        if (strokeArray.length > 0) {
          this.change('strokeType', strokeArray);
        } else {
          this.change('strokeType', val);
        }
      });
    this.arrowTypeControl.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe((val: ArrowTypeEnum) => this.change('arrowType', val));
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public showIconSettings() {
    return !this.onlyLabelSettings && this.type === DrawingFeatureTypeEnum.IMAGE;
  }

  public showPointSettings(): boolean {
    return !this.onlyLabelSettings && this.type === DrawingFeatureTypeEnum.POINT;
  }

  public showLabelSettings(): boolean {
    return !!this.type;
  }

  public isLabelType(): boolean {
    return this.type === DrawingFeatureTypeEnum.LABEL;
  }

  public showInsertCoordinates() {
    return this.showPointSettings();
  }

  public isLineType() {
    return this.type === DrawingFeatureTypeEnum.LINE;
  }

  public showInsertArea() {
    return this.showPolygonSettings();
  }

  public showLineSettings(): boolean {
    return !this.onlyLabelSettings && (this.type === DrawingFeatureTypeEnum.LINE || this.showPolygonSettings());
  }

  public showPolygonSettings(): boolean {
    return !this.onlyLabelSettings && (this.type === DrawingFeatureTypeEnum.CIRCLE
      || this.type === DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS
      || this.type === DrawingFeatureTypeEnum.POLYGON
      || this.type === DrawingFeatureTypeEnum.RECTANGLE
      || this.type === DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE
      || this.type === DrawingFeatureTypeEnum.SQUARE
      || this.type === DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH
      || this.type === DrawingFeatureTypeEnum.STAR
      || this.type === DrawingFeatureTypeEnum.ELLIPSE);
  }

  public showArrowSetting(): boolean {
    return !this.onlyLabelSettings && this.type === DrawingFeatureTypeEnum.LINE;
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

  public changeMarkerStrokeWidth($event: number) {
    this.change('markerStrokeWidth', $event);
  }

  public changeMarkerSize($event: number) {
    this.change('markerSize', $event);
  }

  public changeMarkerRotation($event: number) {
    this.change('markerRotation', $event);
  }

  public changeStrokeOpacity($event: number) {
    this.change('strokeOpacity', $event);
  }

  public getDashArray(strokeType: StrokeTypeEnum | string) {
    return StyleHelper.getDashArray(strokeType, 0).join(' ');
  }

  public changeStrokeWidth($event: number) {
    this.change('strokeWidth', $event);
  }

  public changeFillColor($event: string) {
    this.change('fillColor', $event);
  }

  public changeFillOpacity($event: number) {
    this.change('fillOpacity', $event);
  }

  public changeStripedFill($event: MatCheckboxChange) {
    this.change('stripedFill', $event.checked);
  }

  public toggleSegmentSize($event: MatCheckboxChange) {
    this.change('showSegmentSize', $event.checked);
  }

  public toggleTotalSize($event: MatCheckboxChange) {
    this.change('showTotalSize', $event.checked);
  }

  public insertCoordinates() {
    this.insertText('[COORDINATES]');
  }

  public insertLength() {
    this.insertText('[LENGTH]');
  }

  public insertArea() {
    this.insertText('[AREA]');
  }

  private insertText(text: string) {
    const label = this.style.label
      ? `${this.style.label} ${text}`
      : text;
    this.changeLabel('label', label);
  }

  public changeLabelSize($event: number) {
    this.changeLabel('labelSize', $event);
  }

  public changeLabelColor($event: string) {
    this.changeLabel('labelColor', $event);
  }

  public changeLabelOutlineColor($event: string) {
    this.changeLabel('labelOutlineColor', $event);
  }

  public toggleStyle(style: LabelStyleEnum) {
    const labelStyle: LabelStyleEnum[] = this.style.labelStyle || [];
    const idx = labelStyle.indexOf(style);
    if (idx === -1) {
      this.changeLabel('labelStyle', [ ...labelStyle, style ]);
      return;
    }
    this.changeLabel('labelStyle', [ ...labelStyle.slice(0, idx), ...labelStyle.slice(idx + 1) ]);
  }

  public hasLabelStyle(style: LabelStyleEnum) {
    return (this.style.labelStyle || []).indexOf(style) !== -1;
  }

  public changeLabelRotation($event: number) {
    this.changeLabel('labelRotation', $event);
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

  private change(key: keyof DrawingFeatureStyleModel, value: string | number | null | boolean | LabelStyleEnum[] | number[]) {
    this.updatedStyleProps.set(key, value);
    if (this.debounce) {
      window.clearTimeout(this.debounce);
    }
    this.debounce = window.setTimeout(() => this.emitUpdatedStyle(), 10);
  }

  private emitUpdatedStyle() {
    let style = { ...this.style };
    this.updatedStyleProps.forEach((value, key) => {
      style = { ...style, [key]: value };
    });
    this.styleUpdated.emit(style);
    this.updatedStyleProps.clear();
  }

  private changeLabel(key: keyof LabelDrawingFeatureStyleModel, value: string | number | null | boolean | LabelStyleEnum[] | number[]) {
    this.updatedLabelStyleProps.set(key, value);
    if (this.labelDebounce) {
      window.clearTimeout(this.labelDebounce);
    }
    this.labelDebounce = window.setTimeout(() => this.emitUpdatedLabelStyle(), 10);
  }

  private emitUpdatedLabelStyle() {
    let style = { ...this.style };
    this.updatedLabelStyleProps.forEach((value, key) => {
      style = { ...style, [key]: value };
    });
    const labelStyle = DrawingHelper.retainStyleAttributesForType(DrawingFeatureTypeEnum.LABEL, style);
    this.labelStyleUpdated.emit(labelStyle);
    this.updatedLabelStyleProps.clear();
  }
}
