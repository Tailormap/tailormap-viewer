import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';
import { FormFieldModel } from '@tailormap-admin/admin-api';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormSetSelectedField } from '../state/form.actions';
import { selectDraftFormField } from '../state/form.selectors';

@Component({
  selector: 'tm-admin-form-field-list',
  templateUrl: './form-field-list.component.html',
  styleUrls: ['./form-field-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldListComponent implements OnInit {

  public filter = new FormControl('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  public fields$: Observable<FormFieldModel[]> = of([]);

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.attributeFilter.next(value);
      });
    this.fields$ = combineLatest([
      this.store$.select(selectDraftFormField),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([ selectedAttributes, filterStr ]) => {
          if (filterStr) {
            return FilterHelper.filterByTerm(selectedAttributes, filterStr, a => a.name);
          }
          return selectedAttributes;
        }),
      );
  }

  public selectAttribute(attribute: string) {
    this.store$.dispatch(draftFormSetSelectedField({ name: attribute }));
  }

}
