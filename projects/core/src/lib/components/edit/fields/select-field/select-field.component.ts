import { Component, ChangeDetectionStrategy, Input, forwardRef, DestroyRef, OnInit, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { ViewerEditFormFieldModel } from '../../models/viewer-edit-form-field.model';
import { FormFieldValueListItemModel, UniqueValuesService } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../../state/core.selectors';
import { filter, take } from 'rxjs';
import { TypesHelper } from '@tailormap-viewer/shared';
import { concatMap } from 'rxjs/operators';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-select-field',
  templateUrl: './select-field.component.html',
  styleUrls: ['./select-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class SelectFieldComponent implements OnInit, ControlValueAccessor {
  private uniqueValueService = inject(UniqueValuesService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);


  @Input({ required: true })
  public item: ViewerEditFormFieldModel | null = null;

  @Input({ required: true })
  public layerId: string = '';

  @Output()
  public changed = new EventEmitter<string | number | boolean | null>();

  @Output()
  public clearUniqueValueCacheAfterSave = new EventEmitter<string>();

  public loading = false;
  public options: FormFieldValueListItemModel[] = [];
  private optionsLoaded = false;

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public formControl = new FormControl<string | number | boolean>('');

  public ngOnInit() {
    const value = this.item?.value || '';
    this.options = [{ value }];
    if (!this.item?.uniqueValuesAsOptions) {
      this.options = this.item?.valueList || [];
      this.optionsLoaded = true;
    }
    if (this.item?.required) {
      this.formControl.setValidators([Validators.required]);
    }
    this.formControl.setValue(value);
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(formValue => {
        this.valueChanged(formValue);
      });
  }

  public displayLabel = (result: string | number | boolean): string => {
    const option = this.options.find(o => o.value === result);
    return option ? (option.label || `${option.value}`) : `${result}`;
  };

  public writeValue(value: string | number | boolean): void {
      this.formControl.patchValue(value);
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
        this.formControl.disable({ emitEvent: false });
      } else {
        this.formControl.enable({ emitEvent: false });
      }
  }

  private valueChanged(value: string | number | boolean | null) {
    if (!this.item) {
      return;
    }
    const isOption = this.options.findIndex(o => o.value === value) !== -1;
    const allowToChangeOptions = !this.item.allowValueListOnly;
    if (!allowToChangeOptions && !isOption && typeof this.item.value !== 'undefined') {
      value = this.item.value;
      this.formControl.patchValue(value, { emitEvent: false });
      return;
    }
    if (this.onChange) {
      this.onChange(value);
    }
    this.changed.emit(value);
    this.checkUniqueValueCache(isOption, allowToChangeOptions);
  }

  public loadUniqueValues() {
    if (!this.item || this.optionsLoaded) {
      return;
    }
    const attribute = this.item.name;
    this.loading = true;
    this.cdr.detectChanges();
    return this.store$.select(selectViewerId)
      .pipe(
        filter(TypesHelper.isDefined),
        take(1),
        concatMap(applicationId => this.uniqueValueService.getUniqueValues$({
          attribute,
          layerId: this.layerId,
          applicationId,
        })),
      )
      .subscribe(response => {
        this.options = response.values.map(v => ({ value: v }));
        this.loading = false;
        this.optionsLoaded = true;
        this.cdr.detectChanges();
      });
  }

  private checkUniqueValueCache(isOption: boolean, allowToChangeOptions: boolean) {
    if (isOption || !allowToChangeOptions || !this.item?.uniqueValuesAsOptions) {
      return;
    }
    this.store$.select(selectViewerId)
      .pipe(
        filter(TypesHelper.isDefined),
        take(1),
      )
      .subscribe(applicationId => {
        this.clearUniqueValueCacheAfterSave.emit(this.uniqueValueService.createKey({
          attribute: this.item?.name || '',
          layerId: this.layerId,
          applicationId,
        }));
      });
  }

}
