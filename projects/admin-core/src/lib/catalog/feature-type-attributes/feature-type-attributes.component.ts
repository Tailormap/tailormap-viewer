import { Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { FeatureTypeAttributeHelper } from '../helpers/feature-type-attribute.helper';

@Component({
  selector: 'tm-admin-feature-type-attributes',
  templateUrl: './feature-type-attributes.component.html',
  styleUrls: ['./feature-type-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeAttributesComponent implements OnChanges {

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Output()
  public attributeEnabledChanged = new EventEmitter<Array<{ attribute: string; enabled: boolean }>>();

  public enabledAttributes = new Set<string>();
  public allAttributesEnabled = false;
  public someAttributesDisabled = false;
  public dataAttributes: AttributeDescriptorModel[] = [];
  public geomAttributes: AttributeDescriptorModel[] = [];

  constructor() { }

  public ngOnChanges(): void {
    if (this.attributes) {
      this.dataAttributes = this.attributes.filter(a => !FeatureTypeAttributeHelper.isGeometryType(a.type));
      this.geomAttributes = this.attributes.filter(a => FeatureTypeAttributeHelper.isGeometryType(a.type));
      const hideAttributes = new Set(this.featureTypeSettings?.hideAttributes || []);
      this.enabledAttributes = new Set(this.dataAttributes
        .map(a => a.name)
        .filter(a => !hideAttributes.has(a)));
      this.allAttributesEnabled = this.enabledAttributes.size === this.dataAttributes.length;
      this.someAttributesDisabled = this.enabledAttributes.size !== 0 && !this.allAttributesEnabled;
    }
  }

  public toggleAllAttributes() {
    this.attributeEnabledChanged.emit(this.dataAttributes.map(a => ({ attribute: a.name, enabled: !this.allAttributesEnabled })));
  }

  public toggleAttribute(attribute: string) {
    this.attributeEnabledChanged.emit([{ attribute, enabled: !this.isAttributeEnabled(attribute) }]);
  }

  public isAttributeEnabled(attribute: string) {
    return this.enabledAttributes.has(attribute);
  }

}
