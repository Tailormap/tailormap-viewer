import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { FilterGroupModel, AttributeFilterModel } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';
import { addFilterGroup, removeFilterGroup } from '../../state/filter-state/filter.actions';

@Injectable({
  providedIn: 'root',
})
export class FeatureSelectionBookmarkService {
  private store$ = inject(Store);
  private mapService = inject(MapService);

  private currentFilterGroupId: string | null = null;

  public clearFilter(): void {
    if (this.currentFilterGroupId) {
      this.store$.dispatch(removeFilterGroup({ filterGroupId: this.currentFilterGroupId }));
      this.currentFilterGroupId = null;
    }
  }

  public applyFilter(filterGroup: FilterGroupModel<AttributeFilterModel>): void {
    this.currentFilterGroupId = filterGroup.id;
    this.store$.dispatch(addFilterGroup({ filterGroup }));
    this.getAndZoomToFeatures(filterGroup);
  }

  private getAndZoomToFeatures(filterGroup: FilterGroupModel<AttributeFilterModel>): void {
    // todo: implement this
    filterGroup.layerIds.forEach(_layerId => {
      // Call features API with the filter
      // Then zoom to the returned features using:
      // this.mapService.zoomToFeatures(features);
    });
  }
}
