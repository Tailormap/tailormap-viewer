import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { AppLayerSettingsModel, FeatureTypeModel, FormModel } from '@tailormap-admin/admin-api';
import { ErrorMessageComponent } from '@tailormap-viewer/shared';
import { FormFieldWarnings, FormWarningHelper } from '../helpers/form-warning.helper';

@Component({
    selector: 'tm-admin-form-warning-message',
    templateUrl: './form-warning-message.component.html',
    styleUrls: ['./form-warning-message.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ErrorMessageComponent],
})
export class FormWarningMessageComponent implements OnChanges {

  @Input()
  public featureType: FeatureTypeModel | null = null;

  @Input()
  public applicationLayerSetting: AppLayerSettingsModel | null = null;

  @Input()
  public form: FormModel | null = null;

  public warnings: FormFieldWarnings = { notShown: [], readOnly: [], requiredReadOnly: [] };
  public hasWarnings = false;

  public ngOnChanges() {
    this.warnings = FormWarningHelper.getFieldWarnings(this.form, this.featureType, this.applicationLayerSetting);
    this.hasWarnings = FormWarningHelper.hasWarnings(this.warnings);
  }

}
