import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum, CatalogItemModel, CatalogModelHelper, CatalogNodeModel, FeatureSourceModel, GeoServiceWithLayersModel,
  TAILORMAP_ADMIN_API_V1_SERVICE,
  TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, forkJoin, map, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import {
  selectCatalog, selectCatalogNodeById, selectFeatureSources, selectGeoServices, selectParentsForCatalogNode,
} from '../state/catalog.selectors';
import { addFeatureSources, addGeoServices, expandTree, updateCatalog, updateFeatureSourceNodeIds } from '../state/catalog.actions';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { nanoid } from 'nanoid';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { ExtendedFeatureSourceModel } from '../models/extended-feature-source.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {

  private destroyed = new Subject();
  private loadServiceSubscriptions = new Map<string, Subject<null>>();
  private geoServices: Map<string, ExtendedGeoServiceModel> = new Map();
  private featureSources: Map<string, ExtendedFeatureSourceModel> = new Map();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
  ) {
    this.store$.select(selectGeoServices).pipe(takeUntil(this.destroyed)).subscribe(services => {
      this.geoServices = new Map(services.map(service => [ service.id, service ]));
    });
    this.store$.select(selectFeatureSources).pipe(takeUntil(this.destroyed)).subscribe(featureSources => {
      this.featureSources = new Map(featureSources.map(featureSource => [ featureSource.id, featureSource ]));
    });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public expandTreeToSelectedItem(nodesList: Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }>) {
    const catalogNode = nodesList.find(part => part.type === CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE);
    if (catalogNode) {
      this.store$.dispatch(expandTree({ id: catalogNode.id, nodeType: catalogNode.type }));
      this.loadCatalogNodeItems$(catalogNode.id, true)
        .pipe(take(1))
        .subscribe(() => {
          const serviceNode = nodesList.find(part => part.type === CatalogTreeModelTypeEnum.SERVICE_TYPE);
          if (serviceNode) {
            this.store$.dispatch(expandTree({ id: serviceNode.id, nodeType: serviceNode.type }));
          }
          const layerNode = nodesList.find(part => part.type === CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE);
          if (layerNode) {
            this.store$.dispatch(expandTree({ id: layerNode.id, nodeType: layerNode.type }));
          }
          const featureSourceNode = nodesList.find(part => part.type === CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE);
          if (featureSourceNode) {
            this.store$.dispatch(expandTree({ id: featureSourceNode.id, nodeType: featureSourceNode.type }));
          }
        });
    }
  }

  public loadCatalogNodeItems$(nodeId: string, includeParents?: boolean) {
    return this.store$.select(selectParentsForCatalogNode(nodeId))
      .pipe(
        take(1),
        concatMap(parentIds => {
          const requests$ = [];
          if (includeParents) {
            requests$.push(...parentIds.map(id => this.loadCatalogChildren$(id)));
          }
          requests$.push(this.loadCatalogChildren$(nodeId));
          return forkJoin(requests$);
        }),
      );
  }

  private loadCatalogChildren$(nodeId: string) {
    this.cancelCurrentSubscription(nodeId);
    const newSubscription = new Subject<null>();
    this.loadServiceSubscriptions.set(nodeId, newSubscription);
    return this.store$.select(selectCatalogNodeById(nodeId)).pipe(
      take(1),
      map(node => {
        if (!node || (node?.items || []).length === 0) {
          return [[], []];
        }
        const serviceItems = (node.items || []).filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE);
        const featureSourceItems = (node.items || []).filter(item => item.kind === CatalogItemKindEnum.FEATURE_SOURCE);
        return [ serviceItems, featureSourceItems ];
      }),
      tap(([ _, featureSourceItems ]) => {
        this.updateNodeIdForExistingFeatureSources(featureSourceItems, nodeId);
      }),
      concatMap(([ serviceItems, featureSourceItems ]) => {
        const services$ = this.getServiceRequests$(serviceItems, newSubscription);
        const featureSources$ = this.getFeatureSourceRequests$(featureSourceItems, newSubscription);
        if (services$.length === 0 && featureSources$.length === 0) {
          return of([]);
        }
        return forkJoin([ ...services$, ...featureSources$ ]);
      }),
      tap(responses => this.handleResponses(nodeId, responses, newSubscription)),
    );
  }

  private handleResponses(nodeId: string, responses: Array<GeoServiceWithLayersModel | FeatureSourceModel | null>, newSubscription: Subject<null>) {
    if (responses.length === 0) {
      return;
    }
    const hasError = responses.some(response => response === null);
    if (hasError) {
      SnackBarMessageComponent.open$(this.snackBar, {
        message: $localize `Error while loading service(s). Please collapse/expand the node again to try again.`,
        duration: 5000,
        showCloseButton: true,
      }).pipe(takeUntil(newSubscription)).subscribe();
    }
    const services = responses.filter((response): response is GeoServiceWithLayersModel => {
      return CatalogModelHelper.isGeoServiceModel(response);
    });
    const featureSources = responses.filter((response): response is FeatureSourceModel => {
      return CatalogModelHelper.isFeatureSourceModel(response);
    });
    if (services.length > 0) {
      this.store$.dispatch(addGeoServices({ services, parentNode: nodeId }));
    }
    if (featureSources.length > 0) {
      this.store$.dispatch(addFeatureSources({ featureSources, parentNode: nodeId }));
    }
  }

  private getServiceRequests$(serviceItems: CatalogItemModel[], subscription: Subject<null>) {
    return serviceItems.filter(item => !this.geoServices.has(item.id)).map(item => {
      return this.adminApiService.getGeoService$({ id: item.id })
        .pipe(
          takeUntil(subscription),
          catchError(() => {
            return of(null);
          }),
        );
    });
  }

  private getFeatureSourceRequests$(featureSourceItems: CatalogItemModel[], subscription: Subject<null>) {
    return featureSourceItems.filter(item => !this.featureSources.has(item.id)).map(item => {
      return this.adminApiService.getFeatureSource$({ id: item.id })
        .pipe(
          takeUntil(subscription),
          catchError(() => {
            return of(null);
          }),
        );
    });
  }

  private cancelCurrentSubscription(nodeId: string) {
    const currentSubscription = this.loadServiceSubscriptions.get(nodeId);
    if (currentSubscription) {
      currentSubscription.next(null);
      currentSubscription.complete();
    }
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
      );
  }

  private updateNodeIdForExistingFeatureSources(featureSourceItems: undefined | CatalogItemModel[], nodeId: string) {
    if (typeof featureSourceItems === 'undefined') {
      return;
    }
    const featureSourceIds = new Set(featureSourceItems.map(item => item.id));
    const featuresWithoutNodeId = Array.from(this.featureSources.values())
      .filter(featureSource => featureSourceIds.has(featureSource.id) && !featureSource.catalogNodeId)
      .map(fs => fs.id);
    if (featuresWithoutNodeId.length > 0) {
      this.store$.dispatch(updateFeatureSourceNodeIds({ featureSources: featuresWithoutNodeId, nodeId }));
    }
  }

}
