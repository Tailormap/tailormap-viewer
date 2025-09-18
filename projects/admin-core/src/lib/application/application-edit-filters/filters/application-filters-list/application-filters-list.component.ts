import { ChangeDetectionStrategy, Component, OnDestroy, signal, Signal, inject, computed } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum } from '@tailormap-viewer/api';
import { selectFiltersForSelectedGroup } from '../../../state/application.selectors';
import { Store } from '@ngrx/store';
import {
  deleteApplicationAttributeFilter,
  setApplicationSelectedFilterId, updateApplicationFiltersConfigForSelectedGroup,
} from '../../../state/application.actions';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApplicationEditFilterService } from '../../application-edit-filter.service';
import { FeatureTypeModel } from '@tailormap-admin/admin-api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-application-filters-list',
  templateUrl: './application-filters-list.component.html',
  styleUrls: ['./application-filters-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationFiltersListComponent implements OnDestroy {
  private store$ = inject(Store);
  private applicationEditFilterService = inject(ApplicationEditFilterService);


  public filters: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = this.store$.selectSignal(selectFiltersForSelectedGroup);
  private featureTypesForSelectedLayers: Signal<FeatureTypeModel[] | undefined> = toSignal(this.applicationEditFilterService.featureTypesForSelectedLayers$);
  public filtersWithAttributeAlias: Signal<{filter: AttributeFilterModel; selected: boolean}[]> = computed(() => {
    const filters  = this.filters();
    const featureTypes = this.featureTypesForSelectedLayers();
    if (!featureTypes) {
      return filters;
    }
    return filters.map(f => {
      const ftWithAttribute = featureTypes.find(ft => ft.settings.attributeSettings?.[f.filter.attribute]);
      const alias: string | undefined = ftWithAttribute?.settings.attributeSettings?.[f.filter.attribute]?.title;
      return { ...f, filter: { ...f.filter, attributeAlias: alias } };
    });
  });

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
