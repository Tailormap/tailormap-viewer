import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormHelper } from '../helpers/form.helper';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, map, merge, Observable, Subscription, take } from 'rxjs';
import { AuthenticatedUserService, ColumnMetadataModel, FeatureModel, LayerDetailsModel, SecurityModel } from '@tailormap-viewer/api';
import { EditModelHelper } from '../helpers/edit-model.helper';
import { ViewerEditFormFieldModel } from '../models/viewer-edit-form-field.model';
import { DateTime } from 'luxon';

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
  standalone: false,
})
export class EditFormComponent implements OnDestroy {

  private _feature: EditFormInput | undefined;

  private currentFormSubscription: Subscription | undefined;
  public formConfig: ViewerEditFormFieldModel[] = [];
  public userDetails$: Observable<SecurityModel | null>;

  @Input({ required: true })
  public set feature(feature: EditFormInput | undefined) {
    this._feature = feature;
    this.layerId = feature?.details?.id || '';
    this.createForm();
  }
  public get feature(): EditFormInput | undefined {
    return this._feature;
  }

  @Output()
  public featureAttributeChanged = new EventEmitter<{ attribute: string; value: any; invalid?: boolean }>();

  @Output()
  public clearUniqueValueCacheAfterSave = new EventEmitter<string>();

  public form: FormGroup = new FormGroup({});

  public layerId: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private authenticatedUserService: AuthenticatedUserService,
  ) {
    this.userDetails$ = this.authenticatedUserService.getUserDetails$();
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
    this.formConfig = EditModelHelper.createEditModel(
      this.feature.feature,
      this.feature.details,
      this.feature.columnMetadata,
      this.feature.isNewFeature ?? false,
    );
    this.form = FormHelper.createForm(this.formConfig);

    const changes$ = Object.keys(this.form.controls)
      .map(key => {
        const control = this.form.get(key);
        if (control) {
          return control.valueChanges.pipe(
            debounceTime(250),
            map(value => [ key, value ]),
          );
        }
        return null;
      })
      .filter((valueChanges$): valueChanges$ is FormGroup['valueChanges'] => !!valueChanges$);
    this.currentFormSubscription = merge(...changes$)
      .subscribe(([ changedKey, value ]) => {
        const val = FormHelper.getFormValue(value);
        this.featureAttributeChanged.emit({ attribute: changedKey, value: val, invalid: !this.form.valid });
      });

    this.userDetails$.pipe(take(1)).subscribe(userDetails => {
      // Auto-fill fields with username/date/timestamp
      this.formConfig.forEach(field => {
        const control = this.form.get(field.name);
        if (control) {
          if (field.autoFillUser) {
            control.setValue(userDetails?.username ?? '');
          }
          if (field.autoFillDate) {
            if (field.type === 'date') {
              control.setValue(DateTime.now().toISODate());
            } else if (field.type === 'timestamp') {
              control.setValue(DateTime.now().toISO());
            }
          }
        }
      });
    });

    this.form.markAllAsTouched();
    this.cdr.detectChanges();
  }

  public getControl(name: string): FormControl {
    const control = this.form.get(name);
    if (!control) {
      throw new Error(`Control with name ${name} not found`);
    }
    return control as FormControl;
  }

}
