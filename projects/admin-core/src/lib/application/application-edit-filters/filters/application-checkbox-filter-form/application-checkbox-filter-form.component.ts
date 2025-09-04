import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import {
  AttributeValueSettings, CheckboxFilterModel, FilterToolEnum, EditFilterConfigurationModel,
} from '@tailormap-viewer/api';
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
  private destroyRef = inject(DestroyRef);


  public attributeValuesSettings = signal<AttributeValueSettings[]>([]);
  public columnLabels = [ 'value', 'initially-selected', 'selectable', 'alias' ];

  private checkboxFilter: CheckboxFilterModel = { attributeValuesSettings: [], filterTool: FilterToolEnum.CHECKBOX };

  public aliasForm: FormGroup = new FormGroup({});
  public newValueControl = new FormControl<string>('');
  public useAsIlikeSubstringFilterControl = new FormControl<boolean>(false);

  @Input()
  public set uniqueValues(uniqueValues: string[] | null) {
    const newSettings: AttributeValueSettings[] = [];
    if (uniqueValues) {
      uniqueValues.forEach((value) => {
        newSettings.push({ value: value, initiallySelected: true, selectable: true });
        this.aliasForm.addControl(value, new FormControl<string>(''));
      });
    }
    this.attributeValuesSettings.set(newSettings);
    this.checkboxFilter.attributeValuesSettings = newSettings;
    this.updateCheckboxFilter.emit(this.checkboxFilter);
  }

  @Input()
  public set checkboxFilterSettings(
    checkboxFilterSettings: EditFilterConfigurationModel | null,
  ) {
    const newSettings: AttributeValueSettings[] = [];
    if (checkboxFilterSettings && checkboxFilterSettings.filterTool === FilterToolEnum.CHECKBOX) {
      newSettings.push(...checkboxFilterSettings.attributeValuesSettings);
      checkboxFilterSettings.attributeValuesSettings.forEach((setting) => {
        this.aliasForm.addControl(setting.value, new FormControl<string>(setting.alias || ''), { emitEvent: false });
      });
    }
    this.attributeValuesSettings.set(newSettings);
    this.checkboxFilter.attributeValuesSettings = newSettings;
  }

  @Input()
  public loadingUniqueValues: boolean | null = false;

  @Output()
  public updateCheckboxFilter = new EventEmitter<CheckboxFilterModel>();

  constructor() {
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
    const attributeValueSettings = this.checkboxFilter.attributeValuesSettings.find((s) => s.value === value);
    if (!attributeValueSettings || attributeValueSettings.alias === alias) {
      return;
    }
    const newAttributeValueSettings = { ...attributeValueSettings, alias: alias };
    this.checkboxFilter.attributeValuesSettings = this.checkboxFilter.attributeValuesSettings.map(oldAttributeValueSettings =>
      oldAttributeValueSettings.value === value ? newAttributeValueSettings : oldAttributeValueSettings);
    this.updateCheckboxFilter.emit(this.checkboxFilter);
  }

  public addNewValue() {
    const value = this.newValueControl.value;
    const useAsPartialValue = this.useAsIlikeSubstringFilterControl.value;
    if (!value || this.attributeValuesSettings().some(setting =>
      setting.value === value && setting.useAsIlikeSubstringFilter === useAsPartialValue)) {
      return;
    }
    const currentSettings = this.attributeValuesSettings();
    const newSetting: AttributeValueSettings = {
      value: value,
      initiallySelected: true,
      selectable: true,
      useAsIlikeSubstringFilter: useAsPartialValue ?? false,
    };
    const updatedSettings = [ ...currentSettings, newSetting ];
    this.attributeValuesSettings.set(updatedSettings);
    this.aliasForm.addControl(value, new FormControl<string>(''));
    this.checkboxFilter.attributeValuesSettings = updatedSettings;
    this.updateCheckboxFilter.emit(this.checkboxFilter);
  }

  public removeValue(value: string): void {
    this.attributeValuesSettings.update(attributeValues =>
      attributeValues.filter(attribute => attribute.value !== value),
    );
    this.aliasForm.removeControl(value);
    this.checkboxFilter.attributeValuesSettings = this.attributeValuesSettings();
    this.updateCheckboxFilter.emit(this.checkboxFilter);
  }
}
