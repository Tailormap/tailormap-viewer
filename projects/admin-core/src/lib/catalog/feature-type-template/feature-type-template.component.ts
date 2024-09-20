import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel, FeatureTypeTemplateModel } from '@tailormap-admin/admin-api';
import { ArrayHelper, TemplatePicklistConfig } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-feature-type-template',
  templateUrl: './feature-type-template.component.html',
  styleUrls: ['./feature-type-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeTemplateComponent implements OnInit {

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public template: FeatureTypeTemplateModel | null | undefined = null;

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null | undefined;

  @Output()
  public templateUpdated = new EventEmitter<FeatureTypeTemplateModel>();

  public templatePicklistConfig: TemplatePicklistConfig | undefined;

  constructor(
  ) {
  }

  public ngOnInit() {
    const attributeLabels = new Map(Object.entries(this.featureTypeSettings?.attributeSettings || {})
      .map(([ key, setting ]) => [ key, setting.title || "" ]));
    const sortedAttributes = [...this.attributes].sort(ArrayHelper.getArraySorter('name', this.featureTypeSettings?.attributeOrder || []));
    const attributes = sortedAttributes.map(a => ({
      label: attributeLabels.get(a.name) || a.name,
      value: a.name,
    }));
    this.templatePicklistConfig = {
      label: $localize `:@@admin-core.catalog.insert-feature-type-attribute:Insert feature type attribute`,
      variables: attributes,
    };
  }

  public templateChanged($event: string) {
    this.templateUpdated.emit({
      template: $event,
      markupLanguage: 'markdown',
      templateLanguage: 'simple',
    });
  }

}
