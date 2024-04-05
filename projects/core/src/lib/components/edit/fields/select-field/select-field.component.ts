import {
  Component, ChangeDetectionStrategy, Input, forwardRef, DestroyRef, OnInit, Output, EventEmitter, ChangeDetectorRef,
} from '@angular/core';
import { ViewerEditFormFieldModel } from '../../models/viewer-edit-form-field.model';
import { FormFieldValueListItemModel, UniqueValuesService } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectViewerId } from '../../../../state/core.selectors';
import { filter, take } from 'rxjs';
import { TypesHelper } from '@tailormap-viewer/shared';
import { concatMap } from 'rxjs/operators';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
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
})
export class SelectFieldComponent implements OnInit, ControlValueAccessor {

  @Input({ required: true })
  public item: ViewerEditFormFieldModel | null = null;

  @Input({ required: true })
  public layerId: string = '';

  @Output()
  public changed = new EventEmitter<string | number | boolean | null>();

  public loading = false;
  public options: FormFieldValueListItemModel[] = [];
  private optionsLoaded = false;

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public formControl = new FormControl<string | number | boolean>('');

  constructor(
    private uniqueValueService: UniqueValuesService,
    private store$: Store,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit() {
    this.options = [{ value: this.item?.value || '' }];
    if (!this.item?.uniqueValuesAsOptions) {
      this.options = this.item?.valueList || [];
      this.optionsLoaded = true;
    }
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.valueChanged(value);
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
  }

  private valueChanged(value: string | number | boolean | null) {
    if (this.onChange) {
      this.onChange(value);
    }
    this.changed.emit(value);
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

  protected readonly filter = filter;
}
