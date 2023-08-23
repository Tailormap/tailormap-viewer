import { Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { FeatureTypeAttributeHelper } from '../helpers/feature-type-attribute.helper';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ArrayHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-feature-type-attributes',
  templateUrl: './feature-type-attributes.component.html',
  styleUrls: ['./feature-type-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeAttributesComponent implements OnChanges {

  public readonly columns = [ 'enabled', 'name', 'type', 'sort' ];

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Output()
  public attributeEnabledChanged = new EventEmitter<Array<{ attribute: string; enabled: boolean }>>();

  @Output()
  public attributeOrderChanged = new EventEmitter<string[]>();

  public enabledAttributes = new Set<string>();
  public allAttributesEnabled = false;
  public someAttributesDisabled = false;
  public dataAttributes: AttributeDescriptorModel[] = [];
  public geomAttributes: AttributeDescriptorModel[] = [];

  constructor() { }

  public ngOnChanges(): void {
    if (this.attributes) {
      const attributeOrder = this.featureTypeSettings?.attributeOrder || [];
      const sortedAttributes = [...this.attributes].sort(ArrayHelper.getArraySorter('name', attributeOrder));
      this.dataAttributes = sortedAttributes.filter(a => !FeatureTypeAttributeHelper.isGeometryType(a.type));
      this.geomAttributes = sortedAttributes.filter(a => FeatureTypeAttributeHelper.isGeometryType(a.type));
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

  public dropTable($event: CdkDragDrop<AttributeDescriptorModel[], any>) {
    const attributes = [...this.dataAttributes];
    moveItemInArray(attributes, $event.previousIndex, $event.currentIndex);
    this.attributeOrderChanged.emit(attributes.map(a => a.name));
  }

}
