import { Component, OnInit, ChangeDetectionStrategy, forwardRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'tm-admin-password-field',
  templateUrl: './password-field.component.html',
  styleUrls: ['./password-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordFieldComponent),
      multi: true,
    },
  ],
})
export class PasswordFieldComponent implements ControlValueAccessor, OnInit {

  @Input()
  public value: string | null = null;

  @Input()
  public label: string | null = null;

  @Output()
  public changed = new EventEmitter<string | null>();

  public hide = true;

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
  }

  public writeValue(obj: string | null): void {
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

  public setValue(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = target.value;
    this.changed.emit(value);
    if (this.onChange) {
      this.onChange(value);
    }
  }

}
