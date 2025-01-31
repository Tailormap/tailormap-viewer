import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, ChangeDetectorRef, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormFieldModel } from '@tailormap-viewer/api';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { draftFormRemoveField, draftFormUpdateField } from '../state/form.actions';
import { selectDraftFormSelectedField } from '../state/form.selectors';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';
import { EditFormFieldHelper } from '../helpers/edit-form-field.helper';

type ValueListFormType = FormGroup<{ value: FormControl<string>; label: FormControl<string> }>;

@Component({
  selector: 'tm-admin-edit-field',
  templateUrl: './form-edit-field.component.html',
  styleUrls: ['./form-edit-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormEditFieldComponent implements OnInit {

  @Input({ required: true })
  public set featureType(featureType: FeatureTypeModel | null) {
    this._featureType = featureType;
  }
  public get featureType() {
    return this._featureType;
  }

  private _featureType: FeatureTypeModel | null = null;

  public field: FormFieldModel | null = null;

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public filteredFieldTypes = EditFormFieldHelper.getFilteredFieldTypes();

  public fieldForm = new FormGroup({
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    required: new FormControl<boolean>(false, { nonNullable: true }),
    disabled: new FormControl<boolean>(false, { nonNullable: true }),
    uniqueValuesAsOptions: new FormControl<boolean>(false, { nonNullable: true }),
    valueList: new FormArray<ValueListFormType>([]),
    allowFreeInput: new FormControl<boolean>(false, { nonNullable: true }),
  });

  public ngOnInit(): void {
    this.fieldForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        if (!this.field) {
          return;
        }
        const valueList = (value.valueList || [])
          .map(v => ({ label: v.label || v.value || '', value: v.value || '' }));
        const fieldModel: FormFieldModel = {
          name: this.field.name,
          label: value.label || this.field.name,
          required: typeof value.required === 'undefined' ? false : value.required,
          disabled: typeof value.disabled === 'undefined' ? false : value.disabled,
          type: EditFormFieldHelper.getFormFieldType(value.type),
          valueList,
          uniqueValuesAsOptions: value.uniqueValuesAsOptions,
          allowValueListOnly: !value.allowFreeInput,
        };
        this.store$.dispatch(draftFormUpdateField({ field: fieldModel }));
      });

    this.store$.select(selectDraftFormSelectedField)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged((a, b) => a?.name === b?.name),
      )
      .subscribe(field => {
        this.field = field;
        if (field) {
          this.initForm(field);
        } else {
          this.clearForm();
        }
        this.filteredFieldTypes = EditFormFieldHelper.getFilteredFieldTypes(field?.name, this.featureType);
        this.cdr.detectChanges();
      });
  }

  private initForm(form: FormFieldModel) {
    this.fieldForm.patchValue({
      label: form.label,
      type: form.type,
      required: form.required,
      disabled: form.disabled,
      uniqueValuesAsOptions: form.uniqueValuesAsOptions,
      allowFreeInput: form.allowValueListOnly === false,
    }, { emitEvent: false });
    const valueList = this.getValueListFormArray();
    valueList.clear({ emitEvent: false });
    if (form.valueList) {
      (form.valueList || []).forEach(v => {
        const valueForm = new FormGroup({
          label: new FormControl<string>(v.label || '', { nonNullable: true }),
          value: new FormControl<string>(typeof v.value === 'undefined' ? '' : `${v.value}`, { nonNullable: true }),
        });
        valueList.push(valueForm, { emitEvent: false });
      });
    }
  }

  private clearForm() {
    this.fieldForm.patchValue({
      label: '',
      type: '',
      required: false,
      disabled: false,
      uniqueValuesAsOptions: false,
      allowFreeInput: false,
    }, { emitEvent: false });
    this.getValueListFormArray().clear({ emitEvent: false });
  }

  public getValueListFormArray() {
    return this.fieldForm.get('valueList') as FormArray<ValueListFormType>;
  }

  private isValidForm(): boolean {
    const values = this.fieldForm.getRawValue();
    return FormHelper.isValidValue(values.label)
      && FormHelper.isValidValue(values.type)
      && this.fieldForm.dirty
      && this.fieldForm.valid;
  }

  public addValue() {
    const valueListForm = this.getValueListFormArray();
    const newForm = new FormGroup({
      label: new FormControl<string>('', { nonNullable: true }),
      value: new FormControl<string>('', { nonNullable: true }),
    });
    valueListForm.push(newForm, { emitEvent: false });
  }

  public removeValue(valueIdx: number) {
    this.getValueListFormArray().removeAt(valueIdx);
  }

  public delete(field: FormFieldModel | null) {
    if (!field) {
      return;
    }
    this.store$.dispatch(draftFormRemoveField({ field: field.name }));
  }

  public stopEnter($event: Event, addNewIfLast?: boolean, rowIdx?: number) {
    $event.stopPropagation();
    $event.preventDefault();
    if (addNewIfLast && rowIdx === (this.getValueListFormArray().length - 1)) {
      this.addValue();
    }
  }

}
