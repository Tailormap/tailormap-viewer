import {
  Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, inject,
  signal, computed, effect,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  draftFormAddTab, draftFormSetSelectedField, draftFormSetSelectedTabId, draftFormUpdateFields, draftFormUpdateTabs,
} from '../state/form.actions';
import { selectDraftFormFieldsWithSelected, selectDraftFormSelectedTabId, selectDraftFormTabs } from '../state/form.selectors';
import { FormFieldModel } from '@tailormap-viewer/api';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { nanoid } from 'nanoid';

export interface TabModel {
  id: string;
  name: string;
}

type FieldWithSelected = FormFieldModel & { selected?: boolean };
type TabFieldsMap = Map<string, FieldWithSelected[]>;

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
  private readonly allFields = this.store$.selectSignal(selectDraftFormFieldsWithSelected);

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');
  public tabName = new FormControl<string>('');

  public readonly attributeFilter = signal<string | null>(null);
  public readonly tabs = this.store$.selectSignal(selectDraftFormTabs);
  public readonly selectedTabId = this.store$.selectSignal(selectDraftFormSelectedTabId);

  public readonly fields = computed(() => {
    const filterStr = this.attributeFilter();
    const fields = this.allFields();
    return filterStr ? FilterHelper.filterByTerm(fields, filterStr, f => f.name) : fields;
  });

  public readonly tabFields = computed<TabFieldsMap>(() => {
    const fields = this.fields();
    const tabFields: TabFieldsMap = new Map();
    this.tabs().forEach(tab => {
      tabFields.set(tab.id, fields.filter(field => field.tab === tab.id));
    });
    return tabFields;
  });

  public readonly fieldDropListIds = computed(() => [
    ...this.tabs().map(tab => tab.id),
  ]);

  constructor() {
    effect(() => {
      if (this.tabs().length === 0) {
        this.store$.dispatch(draftFormAddTab({ tabId: nanoid(), tabName: 'Tab 1' }));
      }
    });

    effect(() => {
      const allFields = this.allFields();
      const tabs = this.tabs();
      const unassignedFields = allFields.filter(field => !field.tab);
      if (unassignedFields.length > 0 && tabs) {
        const firstTabId = this.tabs()[0].id;
        unassignedFields.forEach(field => {
          this.store$.dispatch(draftFormUpdateFields({
            fields: allFields.map(f => f.name === field.name ? { ...f, tab: firstTabId } : f),
          }));
        });
      }
    });
  }

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.attributeFilter.set(value));
  }

  public selectAttribute(name: string): void {
    this.store$.dispatch(draftFormSetSelectedField({ name }));
  }

  public selectTab(tabId: string): void {
    this.store$.dispatch(draftFormSetSelectedTabId({ tabId }));
  }

  public addTab(): void {
    const tabName = this.tabName.value?.trim();
    if (!tabName) {
      return;
    }
    const tabId = nanoid();
    this.store$.dispatch(draftFormAddTab({ tabId, tabName }));
    this.tabName.setValue('');
  }

  public onFieldDrop(event: CdkDragDrop<FieldWithSelected[]>): void {
    const tabGroups = this.tabFields();
    const prevTabId = event.previousContainer.id;
    const currTabId = event.container.id;
    if (!prevTabId || !currTabId) {
      return;
    }

    const prevList = tabGroups.get(prevTabId) ?? [];
    const currList = tabGroups.get(currTabId) ?? [];

    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(currList, event.previousIndex, event.currentIndex);
    } else {
      const updatedField: FieldWithSelected = {
        ...prevList[event.previousIndex],
        tab: currTabId,
      };
      prevList.splice(event.previousIndex, 1);
      currList.splice(event.currentIndex, 0, updatedField);
    }

    this.updateFields(tabGroups, this.tabs());
  }

  public onTabDrop(event: CdkDragDrop<TabModel[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const tabs = [...this.tabs()];
    const tabGroups = this.tabFields();

    moveItemInArray(tabs, event.previousIndex, event.currentIndex);

    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
    this.updateFields(tabGroups, tabs);
  }

  private updateFields(tabGroups: TabFieldsMap, tabs: TabModel[]): void {
    this.store$.dispatch(draftFormUpdateFields({
      fields: [
        ...tabs.flatMap(tab => tabGroups.get(tab.id) ?? []),
      ],
    }));
  }
}
