import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, take } from 'rxjs';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  draftFormAddTab,
  draftFormSetSelectedField,
  draftFormUpdateFields,
  draftFormUpdateTabs,
} from '../state/form.actions';
import { selectDraftFormFieldsWithSelected, selectDraftFormTabs } from '../state/form.selectors';
import { FormFieldModel } from '@tailormap-viewer/api';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatSelectionList, MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'tm-admin-form-field-list',
    templateUrl: './form-field-list.component.html',
    styleUrls: ['./form-field-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListFilterComponent,
    ReactiveFormsModule,
    MatSelectionList,
    CdkDropList,
    MatListItem,
    CdkDrag,
    MatIcon,
    CdkDragHandle,
    AsyncPipe,
    MatButton,
    MatTabsModule,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatLabel,
    MatInput,
  ],
})
export class FormFieldListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);


  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');
  public tabName = new FormControl<string>('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  public fields$: Observable<Array<FormFieldModel & { selected?: boolean }>> = of([]);
  public tabs$: Observable<Array<{ id: string; name: string }>> = of([]);

  public filterTerm$ = this.attributeFilter.asObservable();

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

    this.tabs$ = this.store$.select(selectDraftFormTabs);
  }

  public selectAttribute(attribute: string) {
    this.store$.dispatch(draftFormSetSelectedField({ name: attribute }));
  }

  public addTab() {
    const tabName = this.tabName.value?.trim();

    if (!tabName) {
      return;
    }

    this.tabs$.pipe(take(1)).subscribe(tabs => {
      const tabNumber = tabs.length + 1;
      const tabId = `tab-${tabNumber}`;

      this.store$.dispatch(draftFormAddTab({ tabId, tabName }));
      this.tabName.setValue('');
    });
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
