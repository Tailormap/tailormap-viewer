import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, signal, WritableSignal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AttributeValueSettings, DropdownListFilterModel, EditFilterConfigurationModel, FilterToolEnum } from '@tailormap-viewer/api';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/select';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-application-dropdown-list-filter-form',
    templateUrl: './application-dropdown-list-filter-form.component.html',
    styleUrls: ['./application-dropdown-list-filter-form.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatOption,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatCheckbox,
        MatIconButton,
        MatTooltip,
        MatIcon,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        AsyncPipe,
    ],
})
export class ApplicationDropdownListFilterFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


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
      for (const value of dropdownListFilter.attributeValuesSettings) {
        this.aliasForm.addControl(value.value, new FormControl<string>(value.alias || ''));
      }
    }
  }

  @Output()
  public updateDropdownListFilter = new EventEmitter<DropdownListFilterModel>();

  public filter = new FormControl<string>('');
  private filterSubject$ = new BehaviorSubject<string | null>(null);

  private uniqueValuesSubject$ = new BehaviorSubject<string[] | null>(null);
  public filteredUniqueValues$: Observable<string[]> = of([]);
  private selectedValuesSubject$ = new BehaviorSubject<string[]>([]);
  public attributeValuesSettings: WritableSignal<AttributeValueSettings[]> = signal([]);

  public columnLabels = [ 'value', 'initially-selected', 'selectable', 'alias' ];

  public aliasForm: FormGroup = new FormGroup({});

  private dropdownListFilter: DropdownListFilterModel = { filterTool: FilterToolEnum.DROPDOWN_LIST, attributeValuesSettings: [] };

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.filterSubject$.next(value);
      });

    this.filteredUniqueValues$ = combineLatest([
      this.filterSubject$.asObservable(),
      this.uniqueValuesSubject$.asObservable(),
      this.selectedValuesSubject$.asObservable(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(([ filter, uniqueValues, selectedValues ]) => {
        if (!uniqueValues) {
          return [];
        }
        const uniqueValuesWithoutSelected = uniqueValues.filter(value =>
          !selectedValues.includes(value));
        if (filter) {
          return FilterHelper.filterByTerm(uniqueValuesWithoutSelected, filter, value => value);
        }
        return uniqueValuesWithoutSelected ? uniqueValuesWithoutSelected : [];
      }),
    );

    this.aliasForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(formValues => {
        const updatedAliases = Object.keys(formValues)
          .map(attributeValue => ({ value: attributeValue, alias: formValues[attributeValue] || undefined }));
        updatedAliases.forEach(updatedAlias => {
          this.changeAlias(updatedAlias.value, updatedAlias.alias);
        });
      });

    this.updateDropdownListFilter.emit(this.dropdownListFilter);
  }

  public valueClicked(value: string): void {
    this.attributeValuesSettings.update(attributeValues => [
      ...attributeValues,
      { value: value, initiallySelected: false, selectable: true },
    ]);
    const selectedValues = this.selectedValuesSubject$.getValue();
    this.selectedValuesSubject$.next([ ...selectedValues, value ]);
    this.aliasForm.addControl(value, new FormControl<string>(''));
    this.filter.patchValue('', { emitEvent: true });
    this.dropdownListFilter.attributeValuesSettings = this.attributeValuesSettings();
    this.updateDropdownListFilter.emit(this.dropdownListFilter);
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

  private changeAlias(value: string, alias: string | undefined): void {
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

  public deleteAttributeValue(value: string): void {
    this.attributeValuesSettings.update(attributeValues =>
      attributeValues.filter(attribute => attribute.value !== value),
    );
    const selectedValues = this.selectedValuesSubject$.getValue();
    const newSelectedValues = selectedValues.filter(v => v !== value);
    this.selectedValuesSubject$.next(newSelectedValues);
    this.aliasForm.removeControl(value);
    this.dropdownListFilter.attributeValuesSettings = this.attributeValuesSettings();
    this.updateDropdownListFilter.emit(this.dropdownListFilter);
  }


}
