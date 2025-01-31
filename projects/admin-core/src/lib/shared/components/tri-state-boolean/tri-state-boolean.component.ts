import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, forwardRef, ChangeDetectorRef } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'tm-admin-tri-state-boolean',
  templateUrl: './tri-state-boolean.component.html',
  styleUrls: ['./tri-state-boolean.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TriStateBooleanComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class TriStateBooleanComponent implements ControlValueAccessor {

  @Input()
  public value: boolean | null = null;

  @Input()
  public labelDefault: string | null = null;

  @Input()
  public labelEnabled: string | null = null;

  @Input()
  public labelDisabled: string | null = null;

  @Output()
  public changed = new EventEmitter<boolean | null>();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  public writeValue(obj: boolean | null): void {
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

  public getValue() {
    return typeof this.value === 'boolean' ? this.value : 'INHERIT';
  }

  public setValue($event: MatButtonToggleChange) {
    const value = typeof $event.value === 'boolean' ? $event.value : null;
    this.changed.emit(value);
    if (this.onChange) {
      this.onChange(value);
    }
  }

}
