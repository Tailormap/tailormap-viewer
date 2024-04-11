import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { AdminFieldModel } from '../../services/admin-field-registration.service';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-fields-renderer',
  templateUrl: './admin-fields-renderer.component.html',
  styleUrls: ['./admin-fields-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFieldsRendererComponent implements OnInit {

  @Input({ required: true })
  public fields: AdminFieldModel[] = [];

  @Input()
  public data: Record<string, string | number | boolean> = {};

  @Output()
  public changed = new EventEmitter<Record<string, string | number | boolean>>();

  public formGroup = new FormGroup({});

  constructor(
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.fields.forEach(field => {
      const value = this.data && Object.prototype.hasOwnProperty.call(this.data, field.name) ? this.data[field.name] : '';
      const control = new FormControl(value);
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      this.formGroup.addControl(field.name, control);
    });
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const values: Record<string, string | number | boolean> = this.formGroup.value;
        const parsedValues: Record<string, string | number | boolean> = {};
        Object.keys(values).forEach(key => {
          const field = this.fields.find(f => f.name === key);
          const value = values[key];
          if (!field) {
            return;
          }
          if (field.dataType === 'number' && typeof value === 'string') {
            parsedValues[key] = +(value);
          } else if (field.dataType === 'boolean' && typeof value === 'string') {
            parsedValues[key] = value === 'true';
          } else {
            parsedValues[key] = value;
          }
        });
        this.changed.emit(parsedValues);
      });
  }

  public getControl(name: string) {
    const field = this.formGroup.get(name);
    if (!field) {
      throw new Error(`Field ${name} not found`);
    }
    return field as FormControl;
  }

}
