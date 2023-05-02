import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum, CatalogModelHelper, CatalogNodeModel, FeatureSourceModel, GeoServiceWithLayersModel,
  TAILORMAP_ADMIN_API_V1_SERVICE,
  TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, map, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import {
  selectCatalog, selectCatalogNodeById, selectFeatureSourceIds, selectGeoServiceIds,
} from '../state/catalog.selectors';
import {
  addFeatureSources, addGeoServices, updateCatalog,
} from '../state/catalog.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { nanoid } from 'nanoid';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {

  private destroyed = new Subject();
  private geoServicesIds: Set<string> = new Set();
  private featureSourcesIds: Set<string> = new Set();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
  ) {
    this.store$.select(selectGeoServiceIds)
      .pipe(takeUntil(this.destroyed))
      .subscribe(services => this.geoServicesIds = services);
    this.store$.select(selectFeatureSourceIds)
      .pipe(takeUntil(this.destroyed))
      .subscribe(featureSources => this.featureSourcesIds = featureSources);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getServices$(
    serviceIds: string[],
    subscription: Subject<null>,
    parentNodeId?: string,
  ) {
    const unloadedServices = serviceIds
      .filter(id => !this.geoServicesIds.has(id));
    if (unloadedServices.length === 0) {
      return null;
    }
    return this.adminApiService.getGeoServices$({ ids: unloadedServices })
      .pipe(
        takeUntil(subscription),
        catchError(() => {
          SnackBarMessageComponent.open$(this.snackBar, {
            message: $localize `Error while loading service(s). Please collapse/expand the node again to try again.`,
            duration: 5000,
            showCloseButton: true,
          }).pipe(takeUntil(subscription)).subscribe();
          return of(null);
        }),
        map(responses => responses || []),
        tap(responses => {
          const services = responses.filter((response): response is GeoServiceWithLayersModel => {
            return CatalogModelHelper.isGeoServiceModel(response);
          });
          if (services.length > 0) {
            this.store$.dispatch(addGeoServices({ services, parentNode: parentNodeId || '' }));
          }
        }),
      );
  }

  public getFeatureSources$(
    featureSourceIds: string[],
    subscription: Subject<null>,
    parentNodeId?: string,
  ){
    const notLoadedFeatureSources = featureSourceIds
      .filter(id => !this.featureSourcesIds.has(id));
    if (notLoadedFeatureSources.length === 0) {
      return null;
    }
    return this.adminApiService.getFeatureSources$({ ids: notLoadedFeatureSources })
      .pipe(
        takeUntil(subscription),
        catchError(() => {
          SnackBarMessageComponent.open$(this.snackBar, {
            message: $localize `Error while loading feature source(s). Please collapse/expand the node again to try again.`,
            duration: 5000,
            showCloseButton: true,
          }).pipe(takeUntil(subscription)).subscribe();
          return of(null);
        }),
        map(responses => responses || []),
        tap(responses => {
          const featureSources = responses.filter((response): response is FeatureSourceModel => {
            return CatalogModelHelper.isFeatureSourceModel(response);
          });
          if (featureSources.length > 0) {
            this.store$.dispatch(addFeatureSources({ featureSources, parentNode: parentNodeId || '' }));
          }
        }),
      );
  }

  public createCatalogNode$(node: Omit<ExtendedCatalogNodeModel, 'id'>) {
    return this.updateCatalog$({ ...node, id: nanoid() }, 'create');
  }

  public updateCatalogNode$(node: ExtendedCatalogNodeModel) {
    return this.updateCatalog$(node, 'update');
  }

  public addNodeToCatalog$(nodeId: string, itemId: string, itemKind: CatalogItemKindEnum) {
    return this.store$.select(selectCatalogNodeById(nodeId))
      .pipe(
        take(1),
        concatMap(node => {
          if (!node) {
            return of(null);
          }
          const updatedNode: ExtendedCatalogNodeModel = {
            ...node,
            items: [ ...(node.items || []), { id: itemId, kind: itemKind }],
          };
          return this.updateCatalog$(updatedNode, 'update');
        }),
      );
  }

  private updateCatalog$(node: ExtendedCatalogNodeModel, action: 'create' | 'update' | 'delete') {
    return this.store$.select(selectCatalog)
      .pipe(
        take(1),
        concatMap(catalog => {
          const updatedCatalog: Array<CatalogNodeModel> = [...catalog].map<CatalogNodeModel>(n => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parentId, expanded, ...rest } = n;
            return rest;
          });
          if (action === 'create') {
            const parentIdx = updatedCatalog.findIndex(n => n.id === node.parentId);
            if (!parent) {
              return of(null);
            }
            updatedCatalog[parentIdx] = { ...updatedCatalog[parentIdx], children: [ ...(updatedCatalog[parentIdx].children || []), node.id ] };
            updatedCatalog.push(node);
          }
          if (action === 'update' || action === 'delete') {
            const nodeIdx = updatedCatalog.findIndex(n => n.id === node.id);
            if (nodeIdx === -1) {
              return of(null);
            }
            if (action === 'update') {
              updatedCatalog[nodeIdx] = { ...updatedCatalog[nodeIdx], ...node };
            }
            if (action === 'delete') {
              updatedCatalog.splice(nodeIdx, 1);
            }
          }
          return this.adminApiService.updateCatalog$(updatedCatalog)
            .pipe(
              catchError(() => {
                SnackBarMessageComponent.open$(this.snackBar, {
                  message: $localize `Error while updating catalog.`,
                  duration: 3000,
                  showCloseButton: true,
                });
                return of(null);
              }),
            );
        }),
        tap(updatedCatalog => {
          if (updatedCatalog) {
            this.store$.dispatch(updateCatalog({ nodes: updatedCatalog }));
          }
        }),
        map(catalog => {
          if (catalog) {
            return { catalog, node };
          }
          return null;
        }),
      );
  }

}
