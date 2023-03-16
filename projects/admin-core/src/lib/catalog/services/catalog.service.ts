import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum, CatalogItemModel, CatalogNodeModel, GeoServiceWithLayersModel, TAILORMAP_ADMIN_API_V1_SERVICE,
  TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, forkJoin, of, Subject, take, takeUntil, tap } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { selectCatalog, selectCatalogNodeById, selectGeoServices, selectParentsForCatalogNode } from '../state/catalog.selectors';
import { addGeoServices, expandTree, updateCatalog } from '../state/catalog.actions';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { nanoid } from 'nanoid';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {

  private destroyed = new Subject();
  private loadServiceSubscriptions = new Map<string, Subject<null>>();
  private geoServices: Map<string, ExtendedGeoServiceModel> = new Map();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
  ) {
    this.store$.select(selectGeoServices).pipe(takeUntil(this.destroyed)).subscribe(services => {
      this.geoServices = new Map(services.map(service => [ service.id, service ]));
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
      concatMap(node => {
        if (!node || (node.items || []).length === 0) {
          return of([]);
        }
        const serviceItems = (node.items || []).filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE);
        const services$ = this.getServiceRequests$(serviceItems, newSubscription);
        if (services$.length === 0) {
          return of([]);
        }
        return forkJoin(services$);
      }),
      tap(responses => this.handleResponses(nodeId, responses, newSubscription)),
    );
  }

  private handleResponses(nodeId: string, responses: Array<GeoServiceWithLayersModel | null>, newSubscription: Subject<null>) {
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
    const services = responses.filter((response): response is GeoServiceWithLayersModel => response !== null);
    if (services.length > 0) {
      this.store$.dispatch(addGeoServices({ services, parentNode: nodeId }));
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

  public addServiceToCatalog$(nodeId: string, serviceId: string) {
    return this.store$.select(selectCatalogNodeById(nodeId))
      .pipe(
        take(1),
        concatMap(node => {
          if (!node) {
            return of(null);
          }
          const updatedNode: ExtendedCatalogNodeModel = {
            ...node,
            items: [ ...(node.items || []), { id: serviceId, kind: CatalogItemKindEnum.GEO_SERVICE }],
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

}
