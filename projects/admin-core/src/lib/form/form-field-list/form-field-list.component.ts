import {
  Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, inject,
  signal, computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
  CdkDragDrop, CdkDragEnter, CdkDragExit,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface TabModel {
  id: string;
  name: string;
}

type FieldWithSelected = FormFieldModel & { selected?: boolean };

@Component({
  selector: 'tm-admin-form-field-list',
  templateUrl: './form-field-list.component.html',
  styleUrls: ['./form-field-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListFilterComponent,
    ReactiveFormsModule,
    MatIcon,
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

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');
  public tabName = new FormControl<string>('');

  /** Current filter string */
  public readonly attributeFilter = signal<string | null>(null);

  /** All fields from the store, filtered by `attributeFilter` */
  public readonly fields = computed(() => {
    const filterStr = this.attributeFilter();
    const allFields = this.store$.selectSignal(selectDraftFormFieldsWithSelected)();
    return filterStr ? FilterHelper.filterByTerm(allFields, filterStr, f => f.name) : allFields;
  });

  /** Tabs from the store */
  public readonly tabs = this.store$.selectSignal(selectDraftFormTabs);

  /** Fields with no tab assigned */
  public readonly unassignedFields = computed(() =>
    this.fields().filter(f => !f.tab),
  );

  /** Fields grouped per tab, index-aligned with `tabs` */
  public readonly tabFields = computed(() => {
    const tabs = this.tabs();
    const fields = this.fields();
    return tabs.map(tab => fields.filter(f => f.tab === tab.id));
  });

  /** Track which tabs are collapsed */
  public readonly collapsedTabs = signal<Set<string>>(new Set());

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.attributeFilter.set(value));
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
      ...this.tabs().map(t => t.id),
      ...this.tabs().map(t => `tab-header-drop-${t.id}`),
    ];
  }

  public addTab(): void {
    const tabName = this.tabName.value?.trim();
    if (!tabName) {
      return;
    }
    const tabId = `tab-${this.tabs().length + 1}`;
    this.store$.dispatch(draftFormAddTab({ tabId, tabName }));
    this.tabName.setValue('');
  }

  public toggleTab(tabId: string): void {
    this.collapsedTabs.update(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  }

  public isExpanded(tabId: string): boolean {
    return !this.collapsedTabs().has(tabId);
  }

  public deleteTab(tabId: string): void {
    const tabs = this.tabs().map(t => ({ ...t }));
    const tabIdx = tabs.findIndex(t => t.id === tabId);
    if (tabIdx === -1) {
      return;
    }

    const tabFieldGroups = this.tabFields().map(group => group.map(f => ({ ...f })));
    const fieldsToUnassign: FieldWithSelected[] = tabFieldGroups[tabIdx].map(f => ({ ...f, tab: undefined }));
    const newUnassigned: FieldWithSelected[] = [ ...this.unassignedFields().map(f => ({ ...f })), ...fieldsToUnassign ];

    tabs.splice(tabIdx, 1);
    tabFieldGroups.splice(tabIdx, 1);

    this.collapsedTabs.update(prev => {
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });

    const allFields: FieldWithSelected[] = [
      ...newUnassigned,
      ...tabFieldGroups.reduce<FieldWithSelected[]>((acc, fields) => [ ...acc, ...fields ], []),
    ];

    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
    this.store$.dispatch(draftFormUpdateFields({ fields: allFields }));
  }

  // ----------------------------------------------------------------
  // Drag & Drop – fields
  // ----------------------------------------------------------------

  /**
   * Called when a field is dropped into any of the field drop lists
   * (unassigned list or one of the per-tab lists).
   *
   * Because `unassignedFields` and `tabFields` are computed signals (immutable),
   * we build a mutable snapshot, apply the CDK move/transfer, and dispatch.
   */
  public onFieldDrop(event: CdkDragDrop<FieldWithSelected[]>): void {
    // Build mutable snapshots
    const unassigned = this.unassignedFields().map(f => ({ ...f }));
    const tabFieldGroups = this.tabFields().map(group => group.map(f => ({ ...f })));
    const tabs = this.tabs();

    // Resolve which mutable array corresponds to each drop-list id
    const resolveList = (id: string): FieldWithSelected[] => {
      if (id === 'unassigned') {
        return unassigned;
      }
      const rawId = id.startsWith('tab-header-drop-') ? id.slice('tab-header-drop-'.length) : id;
      const idx = tabs.findIndex(t => t.id === rawId);
      return idx !== -1 ? tabFieldGroups[idx] : unassigned;
    };

    const prevList = resolveList(event.previousContainer.id);
    const currList = resolveList(event.container.id);

    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(currList, event.previousIndex, event.currentIndex);
    } else {
      const containerId = event.container.id;
      const resolvedTabId = containerId === 'unassigned'
        ? undefined
        : containerId.startsWith('tab-header-drop-')
          ? containerId.slice('tab-header-drop-'.length)
          : containerId;

      const field = prevList[event.previousIndex];
      const updatedField: FieldWithSelected = { ...field, tab: resolvedTabId };
      prevList.splice(event.previousIndex, 1);
      currList.splice(event.currentIndex, 0, updatedField);
    }

    const allFields: FieldWithSelected[] = [
      ...unassigned,
      ...tabFieldGroups.reduce<FieldWithSelected[]>((acc, fields) => [ ...acc, ...fields ], []),
    ];
    this.store$.dispatch(draftFormUpdateFields({ fields: allFields }));
  }

  // ----------------------------------------------------------------
  // Drag & Drop – tabs
  // ----------------------------------------------------------------

  /** Called when a tab header is dropped to reorder tabs */
  public onTabDrop(event: CdkDragDrop<TabModel[]>): void {
    const tabs = this.tabs().map(t => ({ ...t }));
    const tabFieldGroups = this.tabFields().map(group => group.map(f => ({ ...f })));

    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    moveItemInArray(tabFieldGroups, event.previousIndex, event.currentIndex);

    this.store$.dispatch(draftFormUpdateTabs({ tabs }));

    const allFields: FieldWithSelected[] = [
      ...this.unassignedFields().map(f => ({ ...f })),
      ...tabFieldGroups.reduce<FieldWithSelected[]>((acc, fields) => [ ...acc, ...fields ], []),
    ];
    this.store$.dispatch(draftFormUpdateFields({ fields: allFields }));
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

  public onTabDragOver(tabId: string): void {
    // event.preventDefault();
    console.debug(`Drag over tab ${tabId}`);
    document.getElementById(`tab-header-drop-${tabId}`)?.classList.add('tab-header--drop-target');
  }

  public onTabDragLeave(tabId: string): void {
    document.getElementById(`tab-header-drop-${tabId}`)?.classList.remove('tab-header--drop-target');
  }

}
