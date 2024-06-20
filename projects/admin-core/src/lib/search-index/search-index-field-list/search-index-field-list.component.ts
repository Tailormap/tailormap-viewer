import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, take } from 'rxjs';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFieldModel } from '@tailormap-viewer/api';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { draftFormSetSelectedField, draftFormUpdateFields } from '../../form/state/form.actions';
import { selectDraftFormFieldsWithSelected } from '../../form/state/form.selectors';
import { selectDraftSearchIndexFields } from '../state/search-index.selectors';

@Component({
  selector: 'tm-admin-search-index-field-list',
  templateUrl: './search-index-field-list.component.html',
  styleUrls: ['./search-index-field-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexFieldListComponent implements OnInit {

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  public fields$: Observable<Array<FormFieldModel & { selected?: boolean }>> = of([]);

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
      this.store$.select(selectDraftSearchIndexFields),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([ selectedFields, filterStr ]) => {
          if (filterStr) {
            return FilterHelper.filterByTerm(selectedFields, filterStr, a => a.name);
          }
          return selectedFields;
        }),
      );
  }

  public selectAttribute(attribute: string) {
    this.store$.dispatch(draftFormSetSelectedField({ name: attribute }));
  }

  public updateListOrder($event: CdkDragDrop<Array<FormFieldModel & { selected?: boolean }> | null, any>) {
    this.fields$
      .pipe(take(1))
      .subscribe(fields => {
        const updatedFields = [...fields];
        moveItemInArray(updatedFields, $event.previousIndex, $event.currentIndex);
        this.store$.dispatch(draftFormUpdateFields({ fields: updatedFields }));
      });
  }

}
