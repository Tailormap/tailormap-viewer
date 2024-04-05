import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { AppLayerSettingsModel, FeatureTypeModel, FormModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-form-warning-message',
  templateUrl: './form-warning-message.component.html',
  styleUrls: ['./form-warning-message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormWarningMessageComponent implements OnChanges {

  @Input()
  public featureType: FeatureTypeModel | null = null;

  @Input()
  public applicationLayerSetting: AppLayerSettingsModel | null = null;

  @Input()
  public form: FormModel | null = null;

  public unAvailableFields: string[] = [];

  public ngOnChanges() {
    const hiddenFeatureTypeAttributes: string[] = [
      ...this.featureType?.settings.hideAttributes || [],
      ...this.featureType?.settings.readOnlyAttributes || [],
    ];
    const appLayerHiddenAttributes: string[] = [
      ...this.applicationLayerSetting?.hideAttributes || [],
      ...this.applicationLayerSetting?.readOnlyAttributes || [],
    ];
    const hiddenAttributes = new Set([
      ...hiddenFeatureTypeAttributes,
      ...appLayerHiddenAttributes,
    ]);
    this.unAvailableFields = (this.form?.fields || [])
      .filter(field => {
        return hiddenAttributes.has(field.name);
      })
      .map(field => field.name);
  }

}
