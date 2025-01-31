import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { AdminFieldModel } from '../../services/admin-field-registration.service';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdditionalPropertyModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-fields-renderer',
  templateUrl: './admin-fields-renderer.component.html',
  styleUrls: ['./admin-fields-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminFieldsRendererComponent implements OnInit {

  private _data: AdditionalPropertyModel[] | null = null;

  private _fields: AdminFieldModel[] = [];

  @Input({ required: true })
  public set fields(fields: AdminFieldModel[]) {
    this._fields = fields;
    this.initForm(fields);
  }
  public get fields(): AdminFieldModel[] {
    return this._fields;
  }

  @Input()
  public set data(data: AdditionalPropertyModel[] | null) {
    this._data = data;
    const controlKeys = Object.keys(this.formGroup.controls);
    if (controlKeys.length === 0) {
      return;
    }
    controlKeys.forEach(key => {
      const property = (data || [])?.find(d => d.key === key);
      const value = property ? property.value : '';
      this.getControl(key).setValue(value);
    });
  }
  public get data(): AdditionalPropertyModel[] | null {
    return this._data;
  }

  @Output()
  public changed = new EventEmitter<AdditionalPropertyModel[]>();

  public formGroup = new FormGroup({});

  constructor(
    private destroyRef: DestroyRef,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const values: Record<string, string | number | boolean> = this.formGroup.value;
        const formKeys = Object.keys(values);
        const propertiesNotInForm = (this.data || []).filter(d => !formKeys.includes(d.key));
        const additionalProperties: AdditionalPropertyModel[] = [...propertiesNotInForm];
        formKeys.forEach(key => {
          const field = this.fields.find(f => f.key === key);
          const value = values[key];
          if (!field) {
            return;
          }
          let parsedValue: number | string | boolean;
          if (field.dataType === 'number' && typeof value === 'string') {
            parsedValue = +(value);
          } else if (field.dataType === 'boolean' && typeof value === 'string') {
            parsedValue = value === 'true';
          } else {
            parsedValue = value;
          }
          additionalProperties.push({ key, value: parsedValue, isPublic: field.isPublic ?? false });
        });
        this.changed.emit(additionalProperties);
      });
  }

  public initForm(fields: AdminFieldModel[]): void {
    const currentControls = Object.keys(this.formGroup.controls);
    if (currentControls.length > 0) {
      currentControls.forEach(control => this.formGroup.removeControl(control));
    }
    fields.forEach(field => {
      const property = (this.data || []).find(d => d.key === field.key);
      const value = property ? property.value : '';
      const control = new FormControl(value);
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      this.formGroup.addControl(field.key, control);
    });
    this.changeDetectorRef.detectChanges();
  }

  public getControl(name: string) {
    const field = this.formGroup.get(name);
    if (!field) {
      throw new Error(`Field ${name} not found`);
    }
    return field as FormControl;
  }

}
