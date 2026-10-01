
import {
  Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, inject, ChangeDetectorRef,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, take,
} from 'rxjs';
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
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface TabModel {
  id: string;
  name: string;
}

@Component({
  selector: 'tm-admin-form-field-list',
  templateUrl: './form-field-list.component.html',
  styleUrls: ['./form-field-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListFilterComponent,
    ReactiveFormsModule,
    MatIcon,
    AsyncPipe,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatInput,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
})
export class FormFieldListComponent implements OnInit {
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');
  public tabName = new FormControl<string>('');

  private attributeFilter = new BehaviorSubject<string | null>(null);
  public filterTerm$ = this.attributeFilter.asObservable();

  public fields$: Observable<Array<FormFieldModel & { selected?: boolean }>> = of([]);
  public tabs$: Observable<TabModel[]> = of([]);

  /** Fields with no tab assigned */
  public unassignedFields: Array<FormFieldModel & { selected?: boolean }> = [];

  /**
   * Fields grouped per tab, index-aligned with `tabs`.
   * Each entry is the mutable array the CDK drop list operates on.
   */
  public tabFields: Array<Array<FormFieldModel & { selected?: boolean }>> = [];

  /** Current ordered list of tabs */
  public tabs: TabModel[] = [];

  /** Track which tabs are collapsed */
  public collapsedTabs = new Set<string>();

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.attributeFilter.next(value));

    this.fields$ = combineLatest([
      this.store$.select(selectDraftFormFieldsWithSelected),
      this.attributeFilter.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([ fields, filterStr ]) =>
        filterStr ? FilterHelper.filterByTerm(fields, filterStr, f => f.name) : fields,
      ),
    );

    this.tabs$ = this.store$.select(selectDraftFormTabs);

    // Keep local mutable arrays in sync with the store so CDK can operate on them
    combineLatest([ this.fields$, this.tabs$ ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ fields, tabs ]) => {
        this.tabs = tabs.map(t => ({ ...t }));
        this.unassignedFields = fields.filter(f => !f.tab);
        this.tabFields = tabs.map(tab => fields.filter(f => f.tab === tab.id));
        this.cdr.markForCheck();
      });
  }

  // ----------------------------------------------------------------
  // Selection
  // ----------------------------------------------------------------

  public selectAttribute(name: string): void {
    this.store$.dispatch(draftFormSetSelectedField({ name }));
  }

  // ----------------------------------------------------------------
  // Tab management
  // ----------------------------------------------------------------

  public get fieldDropListIds(): string[] {
    return [
      'unassigned',
      ...this.tabs.map(t => t.id),
      ...this.tabs.map(t => `tab-header-drop-${t.id}`),
    ];
  }

  public addTab(): void {
    const tabName = this.tabName.value?.trim();
    if (!tabName) {
      return;
    }
    this.tabs$.pipe(take(1)).subscribe(tabs => {
      const tabId = `tab-${tabs.length + 1}`;
      this.store$.dispatch(draftFormAddTab({ tabId, tabName }));
      this.tabName.setValue('');
    });
  }

  public toggleTab(tabId: string): void {
    if (this.collapsedTabs.has(tabId)) {
      this.collapsedTabs.delete(tabId);
    } else {
      this.collapsedTabs.add(tabId);
    }
    this.cdr.markForCheck();
  }

  public isExpanded(tabId: string): boolean {
    return !this.collapsedTabs.has(tabId);
  }

  public deleteTab(tabId: string): void {
    // Remove the tab from the tabs list
    const tabIdx = this.tabs.findIndex(t => t.id === tabId);
    if (tabIdx === -1) {
      return;
    }
    // Clear tab assignment from all fields that belonged to this tab
    const fieldsToUnassign = this.tabFields[tabIdx].map(
      f => ({ ...f, tab: undefined }),
    );
    this.unassignedFields = [ ...this.unassignedFields, ...fieldsToUnassign ];
    this.tabs.splice(tabIdx, 1);
    this.tabFields.splice(tabIdx, 1);
    this.collapsedTabs.delete(tabId);

    const allFields: Array<FormFieldModel & { selected?: boolean }> = [
      ...this.unassignedFields,
      ...this.tabFields.reduce<Array<FormFieldModel & { selected?: boolean }>>(
        (acc, fields) => [ ...acc, ...fields ],
        [],
      ),
    ];

    this.store$.dispatch(draftFormUpdateTabs({ tabs: this.tabs }));
    this.store$.dispatch(draftFormUpdateFields({ fields: allFields }));
  }

  // ----------------------------------------------------------------
  // Drag & Drop – fields
  // ----------------------------------------------------------------

  /**
   * Called when a field is dropped into any of the field drop lists
   * (unassigned list or one of the per-tab lists).
   *
   * - Same container  → reorder within the list
   * - Different container → transfer field and update its `tab` property
   */
  public onFieldDrop(
    event: CdkDragDrop<Array<FormFieldModel & { selected?: boolean }>>,
  ): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const field = event.previousContainer.data[event.previousIndex];
      // Resolve the tab id: strip the 'tab-header-drop-' prefix if present,
      // and treat 'unassigned' as no tab.
      const containerId = event.container.id;
      const resolvedTabId = containerId === 'unassigned'
        ? undefined
        : containerId.startsWith('tab-header-drop-')
          ? containerId.slice('tab-header-drop-'.length)
          : containerId;
      const updatedField: FormFieldModel & { selected?: boolean } = { ...field, tab: resolvedTabId };

      event.previousContainer.data.splice(event.previousIndex, 1);
      event.container.data.splice(event.currentIndex, 0, updatedField);
    }

    this.dispatchFieldsUpdate();
  }

  // ----------------------------------------------------------------
  // Drag & Drop – tabs
  // ----------------------------------------------------------------

  /** Called when a tab header is dropped to reorder tabs */
  public onTabDrop(event: CdkDragDrop<TabModel[]>): void {
    moveItemInArray(this.tabs, event.previousIndex, event.currentIndex);
    // Keep tabFields index-aligned with tabs
    moveItemInArray(this.tabFields, event.previousIndex, event.currentIndex);
    this.store$.dispatch(draftFormUpdateTabs({ tabs: this.tabs }));
    // Also persist the new field order so the store reflects the new tab order
    this.dispatchFieldsUpdate();
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  public trackByTabId(_: number, tab: TabModel): string {
    return tab.id;
  }

  public trackByFieldName(_: number, field: FormFieldModel): string {
    return field.name;
  }

  /**
   * Rebuilds the canonical flat fields array from the local mutable state
   * (unassigned first, then each tab's fields in tab order) and dispatches it.
   */
  private dispatchFieldsUpdate(): void {
    const allFields: Array<FormFieldModel & { selected?: boolean }> = [
      ...this.unassignedFields,
    ];
    this.tabs.forEach((_, i) => {
      allFields.push(...this.tabFields[i]);
    });
    this.store$.dispatch(draftFormUpdateFields({ fields: allFields }));
  }
}
