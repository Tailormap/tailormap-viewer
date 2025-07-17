import { Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, DestroyRef } from '@angular/core';
import { AttributeValueSettings, DropdownListFilterModel } from '@tailormap-viewer/api';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-dropdown-list-filter',
  templateUrl: './dropdown-list-filter.component.html',
  styleUrls: ['./dropdown-list-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DropdownListFilterComponent implements OnInit {

  @Input()
  public set dropdownListFilterConfiguration(dropdownListFilter: DropdownListFilterModel | null) {
    this.alteredValuesSubject$.next(dropdownListFilter?.attributeValuesSettings || []);
    const selectedValues = dropdownListFilter?.attributeValuesSettings
      .filter(value => value.initiallySelected)
      .map(value => ({ value: value.value, alias: value.alias })) || [];
    this.selectedValuesSubject$.next(selectedValues);
  }

  @Input()
  public set uniqueValues(uniqueValues: string[] | null) {
    this.uniqueValuesSubject$.next(uniqueValues);
  }

  @Output()
  public valueSelected = new EventEmitter<{ value: string; selected: boolean }>();

  public filter = new FormControl<string | { value: string; alias?: string }[]>('');
  private filterSubject$ = new BehaviorSubject<string | null>(null);
  private uniqueValuesSubject$ = new BehaviorSubject<string[] | null>(null);
  private alteredValuesSubject$ = new BehaviorSubject<AttributeValueSettings[]>([]);
  public selectedValuesSubject$ = new BehaviorSubject<{ value: string; alias?: string }[]>([]);

  private alteredUniqueValues$: Observable<{ value: string; alias?: string }[]> = of([]);
  public filteredUniqueValues$: Observable<{ value: string; alias?: string }[]> = of([]);

  constructor(private destroyRef: DestroyRef) { }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (typeof value === 'string') {
          this.filterSubject$.next(value);
        } else if (Array.isArray(value)) {
          this.filterSubject$.next('');
        }
      });

    this.alteredUniqueValues$ = combineLatest([
      this.uniqueValuesSubject$.asObservable(),
      this.alteredValuesSubject$.asObservable(),
    ]).pipe(
      map(([ uniqueValues, alteredValues ]) => {
        if (!uniqueValues) {
          return [];
        }
        return uniqueValues.filter(value => {
          const alteredValue = alteredValues.find(av => av.value === value);
          return !(alteredValue && !alteredValue.selectable);
        }).map(value => {
            const alteredValue = alteredValues.find(av => av.value === value);
            if (alteredValue) {
              return {
                value: value,
                alias: alteredValue.alias,
              };
            }
            return { value: value };
        });
      }),
    );

    this.filteredUniqueValues$ = combineLatest([
      this.filterSubject$.asObservable(),
      this.alteredUniqueValues$,
      this.selectedValuesSubject$.asObservable(),
    ]).pipe(map(([ filter, uniqueValues, selectedValues ]) => {
      if (!uniqueValues) {
        return [];
      }
      const selectedValuesValues = selectedValues.map(v => v.value);
      const uniqueValuesWithoutSelected = uniqueValues.filter(value =>
        !selectedValuesValues.includes(value.value));
      if (filter && uniqueValuesWithoutSelected) {
        return FilterHelper.filterByTerm(uniqueValuesWithoutSelected, filter, value => value.alias || value.value);
      }
      return uniqueValuesWithoutSelected ? uniqueValuesWithoutSelected : [];
    }));
  }

  public valueClicked(value: { value: string; alias?: string }) {
    const selectedValues = this.selectedValuesSubject$.getValue();
    this.selectedValuesSubject$.next([ ...selectedValues, value ]);
    this.valueSelected.emit({ value: value.value, selected: true });
    this.filter.setValue('');
  }

  public displayFn(value: { value: string; alias?: string }): string {
    return value.alias || value.value;
  }

  public removeValue(value: string) {
    const selectedValues = this.selectedValuesSubject$.getValue();
    const newSelectedValues = selectedValues.filter(v => v.value !== value);
    this.selectedValuesSubject$.next(newSelectedValues);
    this.valueSelected.emit({ value: value, selected: false });
  }
}
