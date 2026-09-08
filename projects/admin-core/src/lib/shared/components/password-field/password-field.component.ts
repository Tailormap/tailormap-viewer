import { Component, ChangeDetectionStrategy, forwardRef, Input, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { nanoid } from 'nanoid';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

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
    imports: [
        MatFormField,
        MatLabel,
        MatInput,
        MatIconButton,
        MatSuffix,
        MatIcon,
    ],
})
export class PasswordFieldComponent implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);


  @Input()
  public value: string | null = null;

  @Input()
  public label: string | null = null;

  @Output()
  public changed = new EventEmitter<string | null>();

  public hide = true;

  public randomName = nanoid();

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

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

  public onBlur() {
    if (this.onTouched) {
      this.onTouched();
    }
  }

}
