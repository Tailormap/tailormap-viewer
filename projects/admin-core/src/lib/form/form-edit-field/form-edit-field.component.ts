import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormFieldModel, FormFieldTypeEnum } from '@tailormap-admin/admin-api';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { draftFormUpdateField } from '../state/form.actions';
import { selectDraftFormSelectedField } from '../state/form.selectors';

type ValueListFormType = FormGroup<{ value: FormControl<string>; label: FormControl<string> }>;

@Component({
  selector: 'tm-admin-edit-field',
  templateUrl: './form-edit-field.component.html',
  styleUrls: ['./form-edit-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditFieldComponent implements OnInit {

  public field: FormFieldModel | null = null;

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public fieldTypes = [
    { label: $localize `:@@admin-core.form.field-type-text:Text field`, value: FormFieldTypeEnum.TEXT },
    { label: $localize `:@@admin-core.form.field-type-number:Number field`, value: FormFieldTypeEnum.NUMBER },
    { label: $localize `:@@admin-core.form.field-type-select:Choice list`, value: FormFieldTypeEnum.SELECT },
    { label: $localize `:@@admin-core.form.field-type-textarea:Textarea field`, value: FormFieldTypeEnum.TEXTAREA },
    { label: $localize `:@@admin-core.form.field-type-integer:Integer field`, value: FormFieldTypeEnum.INTEGER },
    { label: $localize `:@@admin-core.form.field-type-boolean:Checkbox field`, value: FormFieldTypeEnum.BOOLEAN },
    { label: $localize `:@@admin-core.form.field-type-date:Date field`, value: FormFieldTypeEnum.DATE },
  ];

  public fieldForm = new FormGroup({
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
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
          disabled: typeof value.disabled === 'undefined' ? false : value.disabled,
          type: this.getFieldType(value.type),
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
        this.cdr.detectChanges();
      });
  }

  private getFieldType(fieldType: string | undefined) {
    if (fieldType === 'number') {
      return FormFieldTypeEnum.NUMBER;
    }
    if (fieldType === 'integer') {
      return FormFieldTypeEnum.INTEGER;
    }
    if (fieldType === 'boolean') {
      return FormFieldTypeEnum.BOOLEAN;
    }
    if (fieldType === 'select') {
      return FormFieldTypeEnum.SELECT;
    }
    if (fieldType === 'textarea') {
      return FormFieldTypeEnum.TEXTAREA;
    }
    if (fieldType === 'date') {
      return FormFieldTypeEnum.DATE;
    }
    return FormFieldTypeEnum.TEXT;
  }

  private initForm(form: FormFieldModel) {
    this.fieldForm.patchValue({
      label: form.label,
      type: form.type,
      disabled: form.disabled,
      uniqueValuesAsOptions: form.uniqueValuesAsOptions,
      allowFreeInput: !form.allowValueListOnly,
    }, { emitEvent: false });
    const valueList = this.getValueListFormArray();
    valueList.clear();
    if (form.valueList) {
      (form.valueList || []).forEach(v => {
        const valueForm = new FormGroup({
          label: new FormControl<string>(v.label || '', { nonNullable: true }),
          value: new FormControl<string>(v.value || '', { nonNullable: true }),
        });
        valueList.push(valueForm, { emitEvent: false });
      });
    }
  }

  private clearForm() {
    this.fieldForm.patchValue({
      label: '',
      type: '',
      disabled: false,
      uniqueValuesAsOptions: false,
      allowFreeInput: false,
    }, { emitEvent: false });
    this.getValueListFormArray().clear();
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

}
