import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { FormHelper } from '../helpers/form.helper';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ColumnMetadataModel, FeatureModel, LayerDetailsModel } from '@tailormap-viewer/api';
import { EditModelHelper } from '../helpers/edit-model.helper';
import { FormFieldModel } from '../models/form-field.model';

@Component({
  selector: 'tm-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditFormComponent {

  private _feature: FeatureModel | undefined;
  private _details: LayerDetailsModel | undefined;
  private _columnMetadata: ColumnMetadataModel[] = [];

  private currentFormSubscription: Subscription | undefined;
  public formConfig: FormFieldModel[] = [];

  @Input({ required: true })
  public set feature(feature: FeatureModel | undefined) {
    this._feature = feature;
    this.createForm();
  }
  public get feature(): FeatureModel | undefined {
    return this._feature;
  }

  @Input({ required: true })
  public set details(details: LayerDetailsModel | undefined) {
    this._details = details;
    this.createForm();
  }
  public get details(): LayerDetailsModel | undefined {
    return this._details;
  }

  @Input({ required: true })
  public set columnMetadata(columnMetadata: ColumnMetadataModel[]) {
    this._columnMetadata = columnMetadata;
    this.createForm();
  }
  public get columnMetadata(): ColumnMetadataModel[] {
    return this._columnMetadata;
  }

  @Output()
  public featureChanged = new EventEmitter<FeatureModel>();

  public form: FormGroup = new FormGroup({});

  private createForm() {
    if (this.currentFormSubscription) {
      this.currentFormSubscription.unsubscribe();
    }
    if (!this.details || !this.feature) {
      return;
    }
    this.formConfig = EditModelHelper.createEditModel(this.feature, this.details, this.columnMetadata);
    this.form = FormHelper.createForm(this.formConfig);
    this.currentFormSubscription = this.form.valueChanges
      .subscribe(value => {
        const currentFeature = this.feature;
        if (!currentFeature) {
          return;
        }
        const newFeature = EditModelHelper.updateFeature(currentFeature, value);
        this.featureChanged.emit(newFeature);
      });
  }

}
