import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppLayerSettingsModel, AttributeDescriptorModel, FeatureTypeModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';

interface ApplicationLayerAttributeSettingsData {
  featureType: FeatureTypeModel;
  appLayerSettings: AppLayerSettingsModel;
}

interface ApplicationLayerAttributeSettingsResult {
  hideAttributes?: string[] | null;
  readOnlyAttributes?: string[] | null;
}

@Component({
  selector: 'tm-admin-application-layer-attribute-settings',
  templateUrl: './application-layer-attribute-settings.component.html',
  styleUrls: ['./application-layer-attribute-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationLayerAttributeSettingsComponent {

  private hideAttributes: string[] | null | undefined;
  private readOnlyAttributes: string[] | null | undefined;

  public attributes: AttributeDescriptorModel[] = [];
  public settings: FeatureTypeSettingsModel | null = null;
  public catalogFeatureTypeSettings: FeatureTypeSettingsModel;
  public featureType: FeatureTypeModel | null = null;

  constructor(
    private dialogRef: MatDialogRef<ApplicationLayerAttributeSettingsResult>,
    @Inject(MAT_DIALOG_DATA) private data: ApplicationLayerAttributeSettingsData,
  ) {
    const hiddenAttributes = new Set(this.data.featureType.settings.hideAttributes || []);
    this.catalogFeatureTypeSettings = this.data.featureType.settings;
    this.attributes = this.data.featureType.attributes
      .filter(a => !hiddenAttributes.has(a.name));
    this.featureType = this.data.featureType;
    this.hideAttributes = this.data.appLayerSettings.hideAttributes || [];
    this.readOnlyAttributes = this.data.appLayerSettings.readOnlyAttributes || [];
    this.updateSettings();
  }

  public static open(
    dialog: MatDialog,
    data: ApplicationLayerAttributeSettingsData,
  ): MatDialogRef<ApplicationLayerAttributeSettingsComponent, ApplicationLayerAttributeSettingsResult> {
    return dialog.open(ApplicationLayerAttributeSettingsComponent, {
      data,
      width: '90vw',
    });
  }

  public close() {
    this.dialogRef.close();
  }


  public save() {
    this.dialogRef.close({
      hideAttributes: [...this.hideAttributes || []],
      readOnlyAttributes: [...this.readOnlyAttributes || []],
    });
  }

  public attributesEnabledChanged($event: Array<{ attribute: string; checked: boolean }>) {
    this.hideAttributes = this.updateAttributeChecked(this.hideAttributes || [], $event);
    this.updateSettings();
  }

  public attributesReadonlyChanged($event: Array<{ attribute: string; checked: boolean }>) {
    this.readOnlyAttributes = this.updateAttributeChecked(this.readOnlyAttributes || [], $event);
    this.updateSettings();
  }

  private updateAttributeChecked(
    attributes: string[],
    $event: Array<{ attribute: string; checked: boolean }>,
  ) {
    const attributeSet = new Set(attributes);
    $event.forEach(change => {
      if (change.checked) {
        attributeSet.delete(change.attribute);
      } else {
        attributeSet.add(change.attribute);
      }
    });
    return Array.from(attributeSet);
  }

  private updateSettings() {
    this.settings = {
      ...this.data.featureType.settings,
      hideAttributes: this.hideAttributes || [],
      readOnlyAttributes: this.readOnlyAttributes || [],
    };
  }

}
