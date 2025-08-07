import { ChangeDetectionStrategy, Component, OnDestroy, signal, Signal, inject } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum } from '@tailormap-viewer/api';
import { selectFiltersForSelectedGroup } from '../../../state/application.selectors';
import { Store } from '@ngrx/store';
import {
  deleteApplicationAttributeFilter,
  setApplicationSelectedFilterId, updateApplicationFiltersConfigForSelectedGroup,
} from '../../../state/application.actions';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent implements OnDestroy {
  private store$ = inject(Store);


  public filters: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = this.store$.selectSignal(selectFiltersForSelectedGroup);

  public isDragging = signal<boolean>(false);

  protected readonly filterToolTypes = FilterToolEnum;

  public ngOnDestroy(): void {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: undefined }));
  }

  public setSelectedFilterId(id: string) {
    this.store$.dispatch(setApplicationSelectedFilterId({ filterId: id }));
  }

  public drop(event: CdkDragDrop<string[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const filters = this.filters().map(filter => filter.filter);
    moveItemInArray(filters, event.previousIndex, event.currentIndex);
    this.store$.dispatch(updateApplicationFiltersConfigForSelectedGroup({ filters }));
  }

  public removeFilter($event: MouseEvent, id: string) {
    $event.stopPropagation();
    this.store$.dispatch(deleteApplicationAttributeFilter({ filterId: id }));
  }
}
