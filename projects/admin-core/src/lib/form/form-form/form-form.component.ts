import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormModel, FormSummaryModel } from '@tailormap-admin/admin-api';
import { debounceTime, filter, map, distinctUntilChanged } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TypesHelper, AutoFocusDirective } from '@tailormap-viewer/shared';
import { FormOptionsModel } from '@tailormap-viewer/api';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { Store } from '@ngrx/store';
import { selectForms } from '../state/form.selectors';
import { FormService } from '../services/form.service';
import { FormNameHelper } from '../helpers/form-name.helper';
import { MatInput } from '@angular/material/input';
import { FeatureTypeSelectorComponent } from '../../catalog/feature-type-selector/feature-type-selector.component';

@Component({
    selector: 'tm-admin-form-form',
    templateUrl: './form-form.component.html',
    styleUrls: ['./form-form.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatHint,
        MatInput,
        AutoFocusDirective,
        FeatureTypeSelectorComponent,
    ],
})
export class FormFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private store$ = inject(Store);
  private formService = inject(FormService);

  private forms: FormSummaryModel[] = [];


  private _form: FormModel | null = null;

  @Input()
  public set form(form: FormModel | null) {
    this._form = form;
    this.initForm(form);
  }
  public get form(): FormModel | null {
    return this._form;
  }

  @Output()
  public updateForm = new EventEmitter<{ form: Omit<FormModel, 'id'> }>();

  @Output()
  public validFormChanged = new EventEmitter<boolean>();

  public formForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    adminComments: new FormControl(''),
    featureSourceId: new FormControl<number | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  }, { validators: control => this.isUniqueFormName(control) });

  public ngOnInit(): void {
    this.formService.loadForms();
    this.store$.select(selectForms)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(forms => {
        this.forms = forms;
        this.formForm.updateValueAndValidity({ emitEvent: false });
      });
    this.formForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        map(() => this.isValidForm()),
        distinctUntilChanged(),
      )
      .subscribe(validForm => {
        this.validFormChanged.emit(validForm);
      });
    this.formForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        filter(() => this.isValidForm()),
      )
      .subscribe(value => {
        const options: FormOptionsModel = {
          adminComments: value.adminComments || '',
          tabs: [],
        };
        const form: Omit<FormModel, 'id'> = {
          name: value.name || '',
          featureSourceId: value.featureSourceId || -1,
          featureTypeName: value.featureTypeName || '',
          options,
          fields: [],
        };
        this.updateForm.emit({ form });
      });
  }

  public updateFeatureTypeSelection($event: { featureSourceId?: number; featureTypeName?: string }) {
    if (TypesHelper.isDefined($event.featureSourceId) && TypesHelper.isDefined($event.featureTypeName)) {
      this.formForm.patchValue({
        featureSourceId: $event.featureSourceId,
        featureTypeName: $event.featureTypeName,
      });
      return;
    }
    this.formForm.patchValue({
      featureSourceId: null,
      featureTypeName: null,
    });
  }

  /**
   * Group validator, because the name only has to be unique for the selected feature source and feature type.
   */
  private isUniqueFormName(control: AbstractControl): ValidationErrors | null {
    const value = control.value as { name?: string; featureSourceId?: number | null; featureTypeName?: string | null };
    return FormNameHelper.isNameTaken(this.forms || [], value.name, value.featureSourceId, value.featureTypeName, this._form?.id)
      ? { nonUniqueName: true }
      : null;
  }

  private initForm(form: FormModel | null) {
    this.formForm.patchValue({
      name: form ? form.name : '',
      adminComments: form && form.options ? form.options.adminComments : '',
      featureSourceId: form ? form.featureSourceId : null,
      featureTypeName: form ? form.featureTypeName : '',
    }, { emitEvent: false });
  }

  private isValidForm(): boolean {
    const values = this.formForm.getRawValue();
    return FormHelper.isValidValue(values.name)
      && FormHelper.isValidNumberValue(values.featureSourceId)
      && FormHelper.isValidValue(values.featureTypeName)
      && this.formForm.dirty
      && this.formForm.valid;
  }

}
