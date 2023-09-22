import {
  Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter, SimpleChanges, DestroyRef,
} from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { AttributeTypeHelper } from '../../../../../api/src/lib/helpers/attribute-type.helper';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-feature-type-attributes',
  templateUrl: './feature-type-attributes.component.html',
  styleUrls: ['./feature-type-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeAttributesComponent implements OnChanges {

  public readonly columns = [ 'enabled', 'name', 'type', 'alias', 'sort' ];

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Output()
  public attributeEnabledChanged = new EventEmitter<Array<{ attribute: string; enabled: boolean }>>();

  @Output()
  public attributeOrderChanged = new EventEmitter<string[]>();

  @Output()
  public aliasesChanged = new EventEmitter<Array<{ attribute: string; alias: string | undefined }>>();

  public aliasForm: FormGroup = new FormGroup({});

  public enabledAttributes = new Set<string>();
  public allAttributesEnabled = false;
  public someAttributesDisabled = false;
  public dataAttributes: AttributeDescriptorModel[] = [];
  public geomAttributes: AttributeDescriptorModel[] = [];

  constructor(
    private destroyRef: DestroyRef,
  ) {
    this.aliasForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        const updatedAliases = Object.keys(values)
          .map(attribute => ({ attribute, alias: values[attribute] || undefined }));
        this.aliasesChanged.emit(updatedAliases);
      });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const attributesChanged = !!changes['attributes'];
    if (this.attributes && (attributesChanged || this.changedSettings(changes, 'attributeOrder'))) {
      const attributeOrder = this.featureTypeSettings?.attributeOrder || [];
      const sortedAttributes = [...this.attributes].sort(ArrayHelper.getArraySorter('name', attributeOrder));
      this.dataAttributes = sortedAttributes.filter(a => !AttributeTypeHelper.isGeometryType(a.type));
      this.geomAttributes = sortedAttributes.filter(a => AttributeTypeHelper.isGeometryType(a.type));
    }
    if (this.attributes && attributesChanged) {
      const aliases = this.featureTypeSettings?.attributeSettings || {};
      Object.keys(this.aliasForm.controls).forEach(ctrl => this.aliasForm.removeControl(ctrl));
      this.dataAttributes.forEach(att => {
        const control = new FormControl<string>(aliases[att.name]?.title || '');
        this.aliasForm.addControl(att.name, control, { emitEvent: false });
      });
    }
    if (this.changedSettings(changes, 'hideAttributes')) {
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

  private changedSettings(changes: SimpleChanges, item: keyof FeatureTypeSettingsModel) {
    if (!changes['featureTypeSettings'] || !changes['featureTypeSettings'].previousValue) {
      return true;
    }
    return this.featureTypeSettings && this.featureTypeSettings[item] !== changes['featureTypeSettings'].previousValue[item];
  }

}
