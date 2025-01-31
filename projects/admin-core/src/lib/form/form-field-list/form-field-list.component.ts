import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, take } from 'rxjs';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormSetSelectedField, draftFormUpdateFields } from '../state/form.actions';
import { selectDraftFormFieldsWithSelected } from '../state/form.selectors';
import { FormFieldModel } from '@tailormap-viewer/api';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'tm-admin-form-field-list',
  templateUrl: './form-field-list.component.html',
  styleUrls: ['./form-field-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormFieldListComponent implements OnInit {

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  public fields$: Observable<Array<FormFieldModel & { selected?: boolean }>> = of([]);

  public filterTerm$ = this.attributeFilter.asObservable();

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
      this.store$.select(selectDraftFormFieldsWithSelected),
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
