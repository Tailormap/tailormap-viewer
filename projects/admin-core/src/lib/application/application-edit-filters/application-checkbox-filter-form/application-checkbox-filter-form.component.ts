import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output } from '@angular/core';
import { AttributeValueSettings, CheckboxFilterModel, FilterToolEnum, UpdateSliderFilterModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-application-checkbox-filter-form',
  templateUrl: './application-checkbox-filter-form.component.html',
  styleUrls: ['./application-checkbox-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCheckboxFilterFormComponent {

  public attributeValuesSettings: AttributeValueSettings[] = [];
  public columnLabels = [ 'value', 'initially-selected', 'selectable', 'alias' ];

  private checkboxFilter: CheckboxFilterModel = { attributeValuesSettings: [], filterTool: FilterToolEnum.CHECKBOX };

  public aliasForm: FormGroup = new FormGroup({});

  @Input()
  public set uniqueValues(uniqueValues: string[] | null) {
    this.attributeValuesSettings = [];
    if (uniqueValues) {
      uniqueValues.forEach((value) => {
        this.attributeValuesSettings.push({ value: value, initiallySelected: true, selectable: true });
        this.aliasForm.addControl(value, new FormControl<string>(''));
      });
    }
    this.checkboxFilter.attributeValuesSettings = this.attributeValuesSettings;
  }

  @Input()
  public set checkboxFilterSettings(checkboxFilterSettings: UpdateSliderFilterModel | CheckboxFilterModel | null) {
    this.attributeValuesSettings = [];
    if (checkboxFilterSettings && checkboxFilterSettings.filterTool === FilterToolEnum.CHECKBOX) {
      this.attributeValuesSettings = checkboxFilterSettings.attributeValuesSettings;
      checkboxFilterSettings.attributeValuesSettings.forEach((setting) => {
        this.aliasForm.addControl(setting.value, new FormControl<string>(setting.alias || ''), { emitEvent: false });
      });
    }
    this.checkboxFilter.attributeValuesSettings = this.attributeValuesSettings;
  }

  @Output()
  public updateCheckboxFilter = new EventEmitter<CheckboxFilterModel>();

  constructor(private destroyRef: DestroyRef) {
    this.aliasForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        const updatedAliases = Object.keys(values)
          .map(attributeValue => ({ value: attributeValue, alias: values[attributeValue] || undefined }));
        updatedAliases.forEach(updatedAlias => {
          this.changeAlias(updatedAlias.value, updatedAlias.alias);
        });
      });
  }

  public changeBooleanSetting(value: string, setting: 'initiallySelected' | 'selectable', checked: boolean) {
    const attributeValueSettings = this.checkboxFilter.attributeValuesSettings.find((s) => s.value === value);
    if (attributeValueSettings) {
      const newAttributeValueSettings = setting === 'initiallySelected'
        ? { ...attributeValueSettings, initiallySelected: checked }
        : { ...attributeValueSettings, selectable: checked };
      this.checkboxFilter.attributeValuesSettings = this.checkboxFilter.attributeValuesSettings.map(oldAttributeValueSettings =>
        oldAttributeValueSettings.value === value ? newAttributeValueSettings : oldAttributeValueSettings);
      this.updateCheckboxFilter.emit(this.checkboxFilter);
    }
  }

  public changeAlias(value: string, alias?: string) {
    if (!alias) {
      return;
    }
    const attributeValueSettings = this.checkboxFilter.attributeValuesSettings.find((s) => s.value === value);
    if (attributeValueSettings) {
      const newAttributeValueSettings = { ...attributeValueSettings, alias: alias };
      this.checkboxFilter.attributeValuesSettings = this.checkboxFilter.attributeValuesSettings.map(oldAttributeValueSettings =>
        oldAttributeValueSettings.value === value ? newAttributeValueSettings : oldAttributeValueSettings);
      this.updateCheckboxFilter.emit(this.checkboxFilter);
    }
  }

}
