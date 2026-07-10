import { Injectable, inject } from '@angular/core';
import { ViewerResponseModel, TAILORMAP_API_V1_SERVICE, FilterGroupModel, AttributeFilterModel } from '@tailormap-viewer/api';
import { catchError, map, of, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { loadViewer, loadViewerFailed, loadViewerSuccess } from '../state/core.actions';
import { FeaturesFilterHelper } from '../filter';
import { addAllFilterGroupsInConfig } from '../state/filter-state/filter.actions';
import { UrlHelper } from '@tailormap-viewer/shared';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { LoadMapService } from '../map/services/load-map.service';

interface LoadViewerResponse {
  success: boolean;
  error?: string;
  result?: {
    viewer: ViewerResponseModel;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LoadViewerService {

  private apiService = inject(TAILORMAP_API_V1_SERVICE);
  private store$ = inject(Store);
  private location = inject(Location);
  private router = inject(Router);
  private loadMapService = inject(LoadMapService);

  private static LOAD_VIEWER_ERROR = $localize `:@@core.common.error-loading-viewer:Could not find or load the requested viewer`;

  public loadViewer(id?: string) {
    this.store$.dispatch(loadViewer({ id }));
    this.apiService.getViewer$(id)
      .pipe(
        take(1),
        catchError(() => {
          return of(LoadViewerService.LOAD_VIEWER_ERROR);
        }),
        map(LoadViewerService.parseResponse),
      )
      .subscribe(response => {
        if (!response.success || !response.result) {
          this.store$.dispatch(loadViewerFailed({ error: response.error }));
          return;
        }
        const viewer = response.result.viewer;
        this.store$.dispatch(loadViewerSuccess({
          viewer: { ...viewer, id: `${viewer.kind}/${viewer.name}` },
        }));
        this.addFilterGroups(viewer.filterGroups);
        this.updateRoute(viewer.id);
        this.loadMapService.loadMap(viewer.id);
      });
  }

  private static parseResponse(
    response: string | ViewerResponseModel,
  ): LoadViewerResponse {
    if (typeof response === 'string') {
      return { success: false, error: response };
    }
    return {
      success: true,
      result: {
        viewer: response,
      },
    };
  }

  private addFilterGroups(filterGroupsResponse?: FilterGroupModel<AttributeFilterModel>[] | undefined) {
    const filterGroups = FeaturesFilterHelper.separateSubstringFiltersInCheckboxFilters(filterGroupsResponse || []);
    this.store$.dispatch(addAllFilterGroupsInConfig({ filterGroups }));
  }

  private updateRoute(id: string) {
    if (!id) {
      return;
    }
    const paths = id.split('/').map(UrlHelper.getUrlSafeParam);
    if(this.location.path() !== '/' + paths.join('/')) {
      this.router.navigate(paths, { preserveFragment: true, skipLocationChange: true });
    }
  }

}
