import {
  Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter, SimpleChanges, DestroyRef,
} from '@angular/core';
import { AttributeDescriptorModel, FeatureTypeSettingsModel } from '@tailormap-admin/admin-api';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ArrayHelper } from '@tailormap-viewer/shared';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttributeTypeHelper } from "@tailormap-viewer/api";

type CheckableAttribute =  'hidden' | 'readonly';

@Component({
  selector: 'tm-admin-feature-type-attributes',
  templateUrl: './feature-type-attributes.component.html',
  styleUrls: ['./feature-type-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureTypeAttributesComponent implements OnChanges {

  public readonly columnLabels = [ 'label-enabled', 'label-editable', 'label-name', 'label-type', 'label-alias', 'label-sort' ];
  public readonly columns = [ 'enabled', 'editable', 'name', 'type', 'alias', 'sort' ];

  @Input()
  public attributes: AttributeDescriptorModel[] = [];

  @Input()
  public featureTypeSettings: FeatureTypeSettingsModel | null = null;

  @Output()
  public attributeEnabledChanged = new EventEmitter<Array<{ attribute: string; checked: boolean }>>();

  @Output()
  public attributeReadonlyChanged = new EventEmitter<Array<{ attribute: string; checked: boolean }>>();

  @Output()
  public attributeOrderChanged = new EventEmitter<string[]>();

  @Output()
  public aliasesChanged = new EventEmitter<Array<{ attribute: string; alias: string | undefined }>>();

  public aliasForm: FormGroup = new FormGroup({});

  public someChecked: Record<CheckableAttribute, boolean> = { hidden: false, readonly: false };
  public allChecked: Record<CheckableAttribute, boolean> = { hidden: false, readonly: false };
  public checkedAttributes: Record<CheckableAttribute, Set<string>> = { hidden: new Set<string>(), readonly: new Set<string>() };

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
    this.updateChecked(changes, 'hidden');
    this.updateChecked(changes, 'readonly');
  }

  public toggleAllAttributes(type: CheckableAttribute) {
    const updatedAttributesChecked = this.dataAttributes.map(a => ({ attribute: a.name, checked: !this.allChecked[type] }));
    if (type === 'hidden') {
      this.attributeEnabledChanged.emit(updatedAttributesChecked);
    }
    if (type === 'readonly') {
      this.attributeReadonlyChanged.emit(updatedAttributesChecked);
    }
  }

  public toggleAttribute(type: CheckableAttribute, attribute: string) {
    const updatedAttributeChecked = [{ attribute, checked: !this.isAttributeEnabled(type, attribute) }];
    if (type === 'hidden') {
      this.attributeEnabledChanged.emit(updatedAttributeChecked);
    }
    if (type === 'readonly') {
      this.attributeReadonlyChanged.emit(updatedAttributeChecked);
    }
  }

  public isAttributeEnabled(type: CheckableAttribute, attribute: string) {
    return this.checkedAttributes[type].has(attribute);
  }

  public updateChecked(changes: SimpleChanges, type: CheckableAttribute) {
    const attribute = type === 'hidden' ? 'hideAttributes' : 'readOnlyAttributes';
    if (this.changedSettings(changes, attribute)) {
      const hideAttributes = new Set((this.featureTypeSettings ? this.featureTypeSettings[attribute] : []) || []);
      this.checkedAttributes[type] = new Set(this.dataAttributes
        .map(a => a.name)
        .filter(a => !hideAttributes.has(a)));
      this.allChecked[type] = this.checkedAttributes[type].size === this.dataAttributes.length;
      this.someChecked[type] = this.checkedAttributes[type].size !== 0 && !this.allChecked[type];
    }
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
