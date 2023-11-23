import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppLayerSettingsModel, AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';

interface ApplicationLayerAttributeSettingsData {
  appLayerSettings: AppLayerSettingsModel;
  featureTypeSettings: FeatureTypeSettingsModel;
  attributes: AttributeDescriptorModel[];
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
})
export class ApplicationLayerAttributeSettingsComponent {

  private hideAttributes: string[] | null | undefined;
  private readOnlyAttributes: string[] | null | undefined;

  public attributes: AttributeDescriptorModel[] = [];
  public settings: FeatureTypeSettingsModel | null = null;
  public catalogFeatureTypeSettings: FeatureTypeSettingsModel;

  constructor(
    private dialogRef: MatDialogRef<ApplicationLayerAttributeSettingsResult>,
    @Inject(MAT_DIALOG_DATA) private data: ApplicationLayerAttributeSettingsData,
  ) {
    const hiddenAttributes = new Set(this.data.featureTypeSettings.hideAttributes || []);
    this.catalogFeatureTypeSettings = this.data.featureTypeSettings;
    this.attributes = this.data.attributes
      .filter(a => !hiddenAttributes.has(a.name));
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
    console.log(this.hideAttributes, this.readOnlyAttributes);
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
      ...this.data.featureTypeSettings,
      hideAttributes: this.hideAttributes || [],
      readOnlyAttributes: this.readOnlyAttributes || [],
    };
  }

}
