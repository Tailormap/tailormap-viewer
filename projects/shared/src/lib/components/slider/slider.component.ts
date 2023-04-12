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

  @Output()
  public valueChange = new EventEmitter<number>();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

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

}
