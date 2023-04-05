import {
  Component, OnInit, ChangeDetectionStrategy, Input, forwardRef, ChangeDetectorRef, Output, EventEmitter, OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BoundsModel } from '@tailormap-viewer/api';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'tm-admin-bounds-form-field',
  templateUrl: './bounds-field.component.html',
  styleUrls: ['./bounds-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BoundsFieldComponent),
      multi: true,
    },
  ],
})
export class BoundsFieldComponent implements OnInit, OnDestroy, ControlValueAccessor {

  private _bounds: BoundsModel | null = null;
  private _projection: string | null = null;
  private destroyed = new Subject();
  public hasManualChanges = false;

  private applyProjectionBounds = false;

  @Input()
  public set bounds(bounds: BoundsModel | null) {
    this._bounds = bounds;
    if (bounds) {
      this.boundsForm.patchValue({
        minX: bounds.minx,
        minY: bounds.miny,
        maxX: bounds.maxx,
        maxY: bounds.maxy,
      }, { emitEvent: false });
      this.hasManualChanges = true;
    }
  }

  public get bounds(): BoundsModel | null {
    return this._bounds;
  }

  @Input()
  public set projection(projection: string | null) {
    this._projection = projection;
  }

  public get projection(): string | null {
    return this._projection;
  }

  @Input()
  public label: string | null = null;

  @Output()
  public changed = new EventEmitter<BoundsModel | null>();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public boundsForm = new FormGroup({
    minX: new FormControl<number | null>(null),
    minY: new FormControl<number | null>(null),
    maxX: new FormControl<number | null>(null),
    maxY: new FormControl<number | null>(null),
  });

  constructor(private cdr: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.boundsForm.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(bounds => {
        this.triggerChange(bounds);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public writeValue(obj: BoundsModel | null): void {
    this.bounds = obj;
    this.cdr.detectChanges();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.boundsForm.disable();
    }
  }

  public setBoundsForProjection(projection: string | null) {
    if (!projection) {
      return;
    }
    if (projection === 'EPSG:28992') {
      this.boundsForm.patchValue({
        minX: 482,
        minY: 306602,
        maxX: 284182,
        maxY: 637049,
      }, { emitEvent: true });
    }
    if (projection === 'EPSG:3857') {
      this.boundsForm.patchValue({
        minX: -20037508,
        minY: -20048966,
        maxX: 20037508,
        maxY: 20048966,
      }, { emitEvent: true });
    }
  }

  private triggerChange(bounds: typeof this.boundsForm.value) {
    if (typeof bounds.minX !== 'number'
      || typeof bounds.minY !== 'number'
      || typeof bounds.maxX !== 'number'
      || typeof bounds.maxY !== 'number'
    ) {
      return;
    }
    const boundsModel: BoundsModel = {
      minx: bounds.minX,
      miny: bounds.minY,
      maxx: bounds.maxX,
      maxy: bounds.maxY,
      crs: this.projection || undefined,
    };
    if (this.onChange) {
      this.onChange(boundsModel);
    }
    this.changed.emit(boundsModel);
  }

}
