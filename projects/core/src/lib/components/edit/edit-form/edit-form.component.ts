import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormHelper } from '../helpers/form.helper';
import { FormGroup } from '@angular/forms';
import { debounceTime, map, merge, Subscription } from 'rxjs';
import { ColumnMetadataModel, FeatureModel, LayerDetailsModel } from '@tailormap-viewer/api';
import { EditModelHelper } from '../helpers/edit-model.helper';
import { FormFieldModel } from '../models/form-field.model';
import { DebounceHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditFormComponent implements OnDestroy {

  private _feature: FeatureModel | undefined;
  private _details: LayerDetailsModel | undefined;
  private _columnMetadata: ColumnMetadataModel[] = [];

  private currentFormSubscription: Subscription | undefined;
  public formConfig: FormFieldModel[] = [];

  @Input({ required: true })
  public set feature(feature: FeatureModel | undefined) {
    this._feature = feature;
    DebounceHelper.debounce('edit-form', () => this.createForm(), 10);
  }
  public get feature(): FeatureModel | undefined {
    return this._feature;
  }

  @Input({ required: true })
  public set details(details: LayerDetailsModel | undefined) {
    this._details = details;
    DebounceHelper.debounce('edit-form', () => this.createForm(), 10);
  }
  public get details(): LayerDetailsModel | undefined {
    return this._details;
  }

  @Input({ required: true })
  public set columnMetadata(columnMetadata: ColumnMetadataModel[]) {
    this._columnMetadata = columnMetadata;
    DebounceHelper.debounce('edit-form', () => this.createForm(), 10);
  }
  public get columnMetadata(): ColumnMetadataModel[] {
    return this._columnMetadata;
  }

  @Output()
  public featureAttributeChanged = new EventEmitter<{ attribute: string; value: any }>();

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
    if (!this.details || !this.feature) {
      return;
    }
    this.formConfig = EditModelHelper.createEditModel(this.feature, this.details, this.columnMetadata);
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
        if (!this.form.valid || !this.feature) {
          return;
        }
        this.featureAttributeChanged.emit({ attribute: changedKey, value });
      });
    this.cdr.detectChanges();
  }

}
