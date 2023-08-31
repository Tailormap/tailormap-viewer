import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormHelper } from '../helpers/form.helper';
import { FormGroup } from '@angular/forms';
import { debounceTime, map, merge, Subscription } from 'rxjs';
import { ColumnMetadataModel, FeatureModel, LayerDetailsModel } from '@tailormap-viewer/api';
import { EditModelHelper } from '../helpers/edit-model.helper';
import { FormFieldModel } from '../models/form-field.model';

interface EditFormInput {
  feature: FeatureModel | undefined;
  details: LayerDetailsModel | undefined;
  columnMetadata: ColumnMetadataModel[];
  isNewFeature?: boolean;
}

@Component({
  selector: 'tm-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditFormComponent implements OnDestroy {

  private _feature: EditFormInput | undefined;

  private currentFormSubscription: Subscription | undefined;
  public formConfig: FormFieldModel[] = [];

  @Input({ required: true })
  public set feature(feature: EditFormInput | undefined) {
    this._feature = feature;
    this.createForm();
  }
  public get feature(): EditFormInput | undefined {
    return this._feature;
  }

  @Output()
  public featureAttributeChanged = new EventEmitter<{ attribute: string; value: any; invalid?: boolean }>();

  public form: FormGroup = new FormGroup({});

  constructor(
    private cdr: ChangeDetectorRef,
  ) {
  }

  public ngOnDestroy() {
    if (this.currentFormSubscription) {
      this.currentFormSubscription.unsubscribe();
    }
  }

  private createForm() {
    if (this.currentFormSubscription) {
      this.currentFormSubscription.unsubscribe();
    }
    if (!this.feature?.details || !this.feature?.feature) {
      return;
    }
    this.formConfig = EditModelHelper.createEditModel(this.feature.feature, this.feature.details, this.feature.columnMetadata, this.feature.isNewFeature ?? false);
    this.form = FormHelper.createForm(this.formConfig);
    const changes$ = Object.keys(this.form.controls)
      .map(key => {
        const control = this.form.get(key);
        if (control) {
          return control.valueChanges.pipe(map(value => [ key, value ]));
        }
        return null;
      })
      .filter((valueChanges$): valueChanges$ is FormGroup['valueChanges'] => !!valueChanges$);
    this.currentFormSubscription = merge(...changes$)
      .pipe(debounceTime(250))
      .subscribe(([ changedKey, value ]) => {
        if (!this.form.valid || !this.feature?.feature) {
          this.featureAttributeChanged.emit({ attribute: changedKey, value: null, invalid: true });
          return;
        }
        const val = FormHelper.getFormValue(value);
        this.featureAttributeChanged.emit({ attribute: changedKey, value: val });
      });
    this.form.markAllAsTouched();
    this.cdr.detectChanges();
  }

}
