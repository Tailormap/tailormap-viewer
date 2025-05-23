import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, NgZone, forwardRef, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'tm-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class SliderComponent implements ControlValueAccessor {

  @Input()
  public min = 0;

  @Input()
  public max = 100;

  @Input()
  public step = 1;

  @Input()
  public displayWith: ((value: number) => string) = (value: number) => value.toString();

  @Input()
  public value: number | undefined | null;

  @Input()
  public set betweenValues(betweenValues: {lower: number; upper: number} | null) {
    if (betweenValues) {
      this.lowerValue = betweenValues.lower;
      this.upperValue = betweenValues.upper;
    }
  }

  @Output()
  public valueChange = new EventEmitter<number>();

  @Output()
  public betweenValuesChange = new EventEmitter<{lower: number; upper: number}>();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public lowerValue: number = 0;
  public upperValue: number = 100;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) { }

  public writeValue(obj: number | undefined | null): void {
    this.value = obj;
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
  }

  public onValueChange(value: number) {
    this.ngZone.run(() => {
      this.valueChange.emit(value);
      if (this.onChange) {
        this.onChange(value);
      }
    });
  }

  public onLowerValueChange(value: number) {
    this.ngZone.run(() => {
      this.lowerValue = value;
      this.betweenValuesChange.emit({ lower: this.lowerValue, upper: this.upperValue });
      if (this.onChange) {
        this.onChange(value);
      }
    });
  }

  public onUpperValueChange(value: number) {
    this.ngZone.run(() => {
      this.upperValue = value;
      this.betweenValuesChange.emit({ lower: this.lowerValue, upper: this.upperValue });
      if (this.onChange) {
        this.onChange(value);
      }
    });
  }

  public labelsOverlap(): boolean {
    const dist = this.upperValue - this.lowerValue;
    const maxDist = this.max - this.min;
    console.log("bool", dist < maxDist / 10);
    return dist < (maxDist / 2.5);
  }

}
