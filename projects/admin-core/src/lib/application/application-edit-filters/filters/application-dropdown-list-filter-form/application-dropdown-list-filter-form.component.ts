import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DropdownListFilterModel, EditFilterConfigurationModel } from '@tailormap-viewer/api';
import { BehaviorSubject, Observable, of, combineLatest, map } from 'rxjs';
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
  public dropdownListFilter: EditFilterConfigurationModel | null = null;

  @Output()
  public updateDropdownListFilter = new EventEmitter<DropdownListFilterModel>();

  public filter = new FormControl<string>('');
  private filterSubject$ = new BehaviorSubject<string | null>(null);

  private uniqueValuesSubject$ = new BehaviorSubject<string[] | null>(null);
  public filteredUniqueValues$: Observable<string[]> = of([]);

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
  }

  public valueClicked() {
    return;
  }

}
