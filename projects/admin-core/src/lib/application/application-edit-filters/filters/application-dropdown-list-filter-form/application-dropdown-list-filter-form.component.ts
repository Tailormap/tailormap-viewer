import {
  ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, signal, WritableSignal,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AttributeValueSettings, DropdownListFilterModel, EditFilterConfigurationModel, FilterToolEnum } from '@tailormap-viewer/api';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-dropdown-list-filter-form',
  templateUrl: './application-dropdown-list-filter-form.component.html',
  styleUrls: ['./application-dropdown-list-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationDropdownListFilterFormComponent implements OnInit {

  @Input()
  public set uniqueValues(uniqueValues: string[] | null) {
    this.uniqueValuesSubject$.next(uniqueValues);
  }

  @Input()
  public loadingUniqueValues: boolean | null = false;

  @Input()
  public set dropdownListFilterSettings(dropdownListFilter: EditFilterConfigurationModel | null) {
    if (dropdownListFilter && dropdownListFilter.filterTool === FilterToolEnum.DROPDOWN_LIST) {
      this.dropdownListFilter = dropdownListFilter;
      this.attributeValuesSettings.set(dropdownListFilter.attributeValuesSettings);
    }
  }

  @Output()
  public updateDropdownListFilter = new EventEmitter<DropdownListFilterModel>();

  public filter = new FormControl<string>('');
  private filterSubject$ = new BehaviorSubject<string | null>(null);

  private uniqueValuesSubject$ = new BehaviorSubject<string[] | null>(null);
  public filteredUniqueValues$: Observable<string[]> = of([]);

  public attributeValuesSettings: WritableSignal<AttributeValueSettings[]> = signal([]);
  public columnLabels = [ 'value', 'initially-selected', 'selectable', 'alias' ];

  public aliasForm: FormGroup = new FormGroup({});

  private dropdownListFilter: DropdownListFilterModel = { filterTool: FilterToolEnum.DROPDOWN_LIST, attributeValuesSettings: [] };

  constructor(private destroyRef: DestroyRef) { }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.filterSubject$.next(value);
      });

    this.filteredUniqueValues$ = combineLatest([
      this.filterSubject$.asObservable(),
      this.uniqueValuesSubject$.asObservable(),
    ]).pipe(map(([ filter, uniqueValues ]) => {
      if (filter && uniqueValues) {
        return FilterHelper.filterByTerm(uniqueValues, filter, value => value);
      }
      return uniqueValues ? uniqueValues : [];
    }));

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

  public valueClicked(value: string): void {
    this.attributeValuesSettings.update(attributeValues => [
      ...attributeValues,
      { value: value, initiallySelected: false, selectable: true },
    ]);
    this.aliasForm.addControl(value, new FormControl<string>(''));
    this.filter.patchValue('', { emitEvent: true });
    this.dropdownListFilter.attributeValuesSettings = this.attributeValuesSettings();
  }

  public changeBooleanSetting(value: string, setting: 'initiallySelected' | 'selectable', checked: boolean) {
    const attributeValueSettings = this.dropdownListFilter.attributeValuesSettings.find((s) => s.value === value);
    if (attributeValueSettings) {
      const newAttributeValueSettings = setting === 'initiallySelected'
        ? { ...attributeValueSettings, initiallySelected: checked }
        : { ...attributeValueSettings, selectable: checked };
      this.dropdownListFilter.attributeValuesSettings = this.dropdownListFilter.attributeValuesSettings.map(oldAttributeValueSettings =>
        oldAttributeValueSettings.value === value ? newAttributeValueSettings : oldAttributeValueSettings);
      this.updateDropdownListFilter.emit(this.dropdownListFilter);
    }
  }

  public changeAlias(value: string, alias: string | undefined): void {
    if (!alias) {
      return;
    }
    const attributeValueSettings = this.dropdownListFilter.attributeValuesSettings.find((s) => s.value === value);
    if (attributeValueSettings) {
      const newAttributeValueSettings = { ...attributeValueSettings, alias: alias || undefined };
      this.dropdownListFilter.attributeValuesSettings = this.dropdownListFilter.attributeValuesSettings.map(oldAttributeValueSettings =>
        oldAttributeValueSettings.value === value ? newAttributeValueSettings : oldAttributeValueSettings);
      this.updateDropdownListFilter.emit(this.dropdownListFilter);
    }
  }

}
