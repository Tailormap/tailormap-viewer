import {
  Component, OnInit, ChangeDetectionStrategy, DestroyRef, Input, inject,
  signal, computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterHelper } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { draftFormAddTab, draftFormSetSelectedField, draftFormUpdateFields, draftFormUpdateTabs } from '../state/form.actions';
import { selectDraftFormFieldsWithSelected, selectDraftFormTabs } from '../state/form.selectors';
import { FormFieldModel } from '@tailormap-viewer/api';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
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
  private readonly tabHeaderDropPrefix = 'tab-header-drop-';
  private readonly allFields = this.store$.selectSignal(selectDraftFormFieldsWithSelected);

  @Input({ required: true })
  public featureTypeName: string = '';

  public filter = new FormControl('');
  public tabName = new FormControl<string>('');

  public readonly attributeFilter = signal<string | null>(null);

  public readonly fields = computed(() => {
    const filterStr = this.attributeFilter();
    const fields = this.allFields();
    return filterStr ? FilterHelper.filterByTerm(fields, filterStr, f => f.name) : fields;
  });

  public readonly tabs = this.store$.selectSignal(selectDraftFormTabs);

  public readonly unassignedFields = computed(() =>
    this.fields().filter(f => !f.tab),
  );

  public readonly tabFields = computed(() => {
    const fields = this.fields();
    return this.tabs().map(tab => fields.filter(f => f.tab === tab.id));
  });

  public readonly collapsedTabs = signal<Set<string>>(new Set());

  public readonly fieldDropListIds = computed(() => {
    const tabs = this.tabs();
    return [
      'unassigned',
      ...tabs.map(tab => tab.id),
      ...tabs.map(tab => this.getTabHeaderDropId(tab.id)),
    ];
  });

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.attributeFilter.set(value));
  }

  public selectAttribute(name: string): void {
    this.store$.dispatch(draftFormSetSelectedField({ name }));
  }

  public getTabHeaderDropId(tabId: string): string {
    return `${this.tabHeaderDropPrefix}${tabId}`;
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
    const tabs = this.tabs().map(tab => ({ ...tab }));
    const tabIdx = tabs.findIndex(tab => tab.id === tabId);
    if (tabIdx === -1) {
      return;
    }

    const { unassigned, tabGroups } = this.createFieldSnapshot();
    unassigned.push(...tabGroups[tabIdx].map(field => ({ ...field, tab: undefined })));

    tabs.splice(tabIdx, 1);
    tabGroups.splice(tabIdx, 1);

    this.collapsedTabs.update(prev => {
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });

    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
    this.updateFields(unassigned, tabGroups);
  }

  public onFieldDrop(event: CdkDragDrop<FieldWithSelected[]>): void {
    const { unassigned, tabGroups } = this.createFieldSnapshot();
    const tabs = this.tabs();

    const resolveList = (id: string): FieldWithSelected[] => {
      const tabId = this.getTabIdForDropList(id);
      const idx = tabs.findIndex(tab => tab.id === tabId);
      return idx !== -1 ? tabGroups[idx] : unassigned;
    };

    const prevList = resolveList(event.previousContainer.id);
    const currList = resolveList(event.container.id);

    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(currList, event.previousIndex, event.currentIndex);
    } else {
      const updatedField: FieldWithSelected = {
        ...prevList[event.previousIndex],
        tab: this.getTabIdForDropList(event.container.id),
      };
      prevList.splice(event.previousIndex, 1);
      currList.splice(event.currentIndex, 0, updatedField);
    }

    this.updateFields(unassigned, tabGroups);
  }

  public onTabDrop(event: CdkDragDrop<TabModel[]>): void {
    const tabs = this.tabs().map(tab => ({ ...tab }));
    const { unassigned, tabGroups } = this.createFieldSnapshot();

    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    moveItemInArray(tabGroups, event.previousIndex, event.currentIndex);

    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
    this.updateFields(unassigned, tabGroups);
  }

  public onTabDragOver(tabId: string): void {
    document.getElementById(this.getTabHeaderDropId(tabId))?.classList.add('tab-header--drop-target');
  }

  public onTabDragLeave(tabId: string): void {
    document.getElementById(this.getTabHeaderDropId(tabId))?.classList.remove('tab-header--drop-target');
  }

  private getTabIdForDropList(id: string): string | undefined {
    if (id === 'unassigned') {
      return undefined;
    }
    return id.startsWith(this.tabHeaderDropPrefix)
      ? id.slice(this.tabHeaderDropPrefix.length)
      : id;
  }

  private createFieldSnapshot(): {
    unassigned: FieldWithSelected[];
    tabGroups: FieldWithSelected[][];
  } {
    return {
      unassigned: this.unassignedFields().map(field => ({ ...field })),
      tabGroups: this.tabFields().map(group => group.map(field => ({ ...field }))),
    };
  }

  private updateFields(unassigned: FieldWithSelected[], tabGroups: FieldWithSelected[][]): void {
    this.store$.dispatch(draftFormUpdateFields({
      fields: [ ...unassigned, ...tabGroups.flat() ],
    }));
  }
}
