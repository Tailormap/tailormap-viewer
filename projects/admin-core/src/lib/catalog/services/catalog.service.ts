import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum, CatalogModelHelper, CatalogNodeModel, FeatureSourceModel, GeoServiceWithLayersModel, TAILORMAP_ADMIN_API_V1_SERVICE,
  TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, combineLatest, concatMap, forkJoin, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import {
  selectCatalog, selectCatalogNodeById, selectFeatureSourceIds, selectFeatureSources, selectGeoServiceIds, selectGeoServices,
} from '../state/catalog.selectors';
import { addFeatureSources, addGeoServices, updateCatalog } from '../state/catalog.actions';
import { nanoid } from 'nanoid';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { DebounceHelper } from '../../helpers/debounce.helper';
import { MoveCatalogNodeModel } from '../models/move-catalog-node.model';
import { CatalogTreeMoveHelper } from '../helpers/catalog-tree-move.helper';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {

  private destroyed = new Subject<null>();
  private geoServicesIds: Set<string> = new Set();
  private featureSourcesIds: Set<string> = new Set();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private adminSnackbarService: AdminSnackbarService,
    private sseService: AdminSseService,
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

  public listenForCatalogChanges() {
    this.sseService.listenForEvents$<{ nodes: CatalogNodeModel[] }>('Catalog')
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event.eventType === EventType.ENTITY_UPDATED && event.details.object) {
          this.updateCatalog(event.details.object.nodes);
        }
      });
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
          this.adminSnackbarService.showMessage($localize `Error while loading service(s). Please collapse/expand the node again to try again.`)
            .pipe(takeUntil(subscription)).subscribe();
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
          this.adminSnackbarService.showMessage($localize `Error while loading feature source(s). Please collapse/expand the node again to try again.`)
            .pipe(takeUntil(subscription))
            .subscribe();
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

  public removeNodeFromCatalog$(node: ExtendedCatalogNodeModel) {
    return this.updateCatalog$(node, 'delete')
      .pipe(map(result => ({ success: !!result })));
  }

  public getItemsForCatalogNode$(node: ExtendedCatalogNodeModel) {
    const serviceItems = (node.items || [])
      .filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE)
      .map(item => item.id);
    const featureSourceItems = (node.items || [])
      .filter(item => item.kind === CatalogItemKindEnum.FEATURE_SOURCE)
      .map(item => item.id);
    const services$ = this.getServices$(serviceItems, this.destroyed, node.id);
    const featureSources$ = this.getFeatureSources$(featureSourceItems, this.destroyed, node.id);
    const serviceIds = new Set(serviceItems);
    const featureSourceIds = new Set(featureSourceItems);
    return forkJoin([ services$ || of(true), featureSources$ || of(true) ])
      .pipe(
        take(1),
        switchMap(() => {
          return combineLatest([
            this.store$.select(selectGeoServices).pipe(map(services => services.filter(s => serviceIds.has(s.id)))),
            this.store$.select(selectFeatureSources).pipe(map(fs => fs.filter(s => featureSourceIds.has(s.id)))),
          ]).pipe(
            take(1),
            map(([ services, featureSources ]) => [ ...services, ...featureSources ]),
          );
        }),
      );
  }

  public addItemToCatalog$(nodeId: string, itemId: string, itemKind: CatalogItemKindEnum) {
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

  public removeItemFromCatalog$(nodeId: string, itemId: string, itemKind: CatalogItemKindEnum) {
    return this.store$.select(selectCatalogNodeById(nodeId))
      .pipe(
        take(1),
        concatMap(node => {
          if (!node) {
            return of(null);
          }
          const updatedNode: ExtendedCatalogNodeModel = {
            ...node,
            items: (node.items || []).filter(item => !(item.id === itemId && item.kind === itemKind)),
          };
          return this.updateCatalog$(updatedNode, 'update');
        }),
      );
  }

  public moveCatalogNode$(param: MoveCatalogNodeModel) {
    return this.store$.select(selectCatalog)
      .pipe(
        take(1),
        concatMap(catalog => {
          const updatedTree = CatalogTreeMoveHelper.moveNode(catalog, param);
          return this.saveUpdatedCatalog$(updatedTree);
        }),
      );
  }

  private updateCatalog$(node: ExtendedCatalogNodeModel, action: 'create' | 'update' | 'delete') {
    return this.store$.select(selectCatalog)
      .pipe(
        take(1),
        map(catalog => {
          const updatedCatalog: Array<CatalogNodeModel> = [...catalog].map<CatalogNodeModel>(n => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parentId, expanded, ...rest } = n;
            return rest;
          });
          if (action === 'create') {
            const parentIdx = updatedCatalog.findIndex(n => n.id === node.parentId);
            if (parentIdx === -1) {
              return null;
            }
            updatedCatalog[parentIdx] = { ...updatedCatalog[parentIdx], children: [ ...(updatedCatalog[parentIdx].children || []), node.id ] };
            updatedCatalog.push(node);
          }
          if (action === 'update' || action === 'delete') {
            const nodeIdx = updatedCatalog.findIndex(n => n.id === node.id);
            if (nodeIdx === -1) {
              return null;
            }
            if (action === 'update') {
              updatedCatalog[nodeIdx] = { ...updatedCatalog[nodeIdx], ...node };
            }
            if (action === 'delete') {
              const parentIdx = updatedCatalog.findIndex(n => n.id === node.parentId);
              if (parentIdx !== -1) {
                updatedCatalog[parentIdx] = {
                  ...updatedCatalog[parentIdx],
                  children: (updatedCatalog[parentIdx].children || []).filter(c => c !== node.id),
                };
              }
              updatedCatalog.splice(nodeIdx, 1);
            }
          }
          return updatedCatalog;
        }),
        concatMap(updatedCatalog => this.saveUpdatedCatalog$(updatedCatalog)),
        map(catalog => {
          if (catalog) {
            return { catalog, node };
          }
          return null;
        }),
      );
  }

  private saveUpdatedCatalog$(updatedCatalog: CatalogNodeModel[] | null) {
    if (!updatedCatalog) {
      return of(null);
    }
    return this.adminApiService.updateCatalog$(updatedCatalog)
      .pipe(
        catchError(() => {
          this.adminSnackbarService.showMessage($localize `Error while updating catalog.`);
          return of(null);
        }),
        tap(catalog => {
          if (catalog) {
            this.updateCatalog(catalog);
          }
        }),
      );
  }

  private updateCatalog(nodes: CatalogNodeModel[]) {
    DebounceHelper.debounce('update-catalog', () => {
      this.store$.dispatch(updateCatalog({ nodes }));
    }, 50);
  }

}
