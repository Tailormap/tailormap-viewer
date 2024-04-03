import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormModel } from '@tailormap-admin/admin-api';
import { debounceTime, filter, map, distinctUntilChanged } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TypesHelper } from '@tailormap-viewer/shared';
import { FormOptionsModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-form-form',
  templateUrl: './form-form.component.html',
  styleUrls: ['./form-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFormComponent implements OnInit {

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

  constructor(
    private destroyRef: DestroyRef,
  ) {
  }

  public formForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl(''),
    featureSourceId: new FormControl<number | null>(null),
    featureTypeName: new FormControl<string | null>(null),
  });

  public ngOnInit(): void {
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
          description: value.description || '',
          columns: 0,
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

  private initForm(form: FormModel | null) {
    this.formForm.patchValue({
      name: form ? form.name : '',
      description: form && form.options ? form.options.description : '',
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
