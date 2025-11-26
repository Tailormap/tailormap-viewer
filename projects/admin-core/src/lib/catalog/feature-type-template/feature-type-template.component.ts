import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import {
  AttributeDescriptorModel, FeatureTypeSettingsModel, FeatureTypeTemplateModel, ImageUploadResult, TailormapAdminUploadService,
} from '@tailormap-admin/admin-api';
import { ArrayHelper, TemplatePicklistConfig } from '@tailormap-viewer/shared';
import { AttributeTypeHelper } from '@tailormap-viewer/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'tm-admin-feature-type-template',
  templateUrl: './feature-type-template.component.html',
  styleUrls: ['./feature-type-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureTypeTemplateComponent implements OnInit {
  private uploadService = inject(TailormapAdminUploadService);


  private _attributes: AttributeDescriptorModel[] = [];
  private _featureTypeSettings: FeatureTypeSettingsModel | null | undefined;

  @Input()
  public set attributes(attributes: AttributeDescriptorModel[]) {
    this._attributes = attributes;
    this.updateAttributes();
  }

  @Input()
  public set featureTypeSettings(featureTypeSettings: FeatureTypeSettingsModel | null | undefined) {
    this._featureTypeSettings = featureTypeSettings;
    this.templateContent.set(featureTypeSettings?.template?.template);
    this.updateAttributes();
  }

  @Output()
  public templateUpdated = new EventEmitter<FeatureTypeTemplateModel>();

  public templatePicklistConfig = signal<TemplatePicklistConfig | undefined>(undefined);

  public templateContent = signal<string | undefined>('');

  public uploadImage$ = (file: File): Observable<ImageUploadResult | null> => {
    return this.uploadService.uploadImage$(file);
  };

  public ngOnInit() {
    this.updateAttributes();
  }

  private updateAttributes() {
    const attributeLabels = new Map(Object.entries(this._featureTypeSettings?.attributeSettings || {})
      .map(([ key, setting ]) => [ key, setting.title || "" ]));
    const hiddenAttributes = new Set(this._featureTypeSettings?.hideAttributes || []);
    const sortedAttributes = [...this._attributes]
      .filter(a => !hiddenAttributes.has(a.name) && !AttributeTypeHelper.isGeometryType(a.type))
      .sort(ArrayHelper.getArraySorter('name', this._featureTypeSettings?.attributeOrder || []));
    const attributes = sortedAttributes.map(a => ({
      label: attributeLabels.get(a.name) || a.name,
      value: a.name,
    }));
    this.templatePicklistConfig.set({
      label: $localize `:@@admin-core.catalog.insert-feature-type-attribute:Insert feature type attribute`,
      shortLabel: $localize `:@@admin-core.catalog.attribute:Attribute`,
      variables: attributes,
    });
  }

  public templateChanged($event: string) {
    this.templateUpdated.emit({
      template: $event,
      markupLanguage: 'markdown',
      templateLanguage: 'simple',
    });
  }

}
