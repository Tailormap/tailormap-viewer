import { Injectable, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CatalogItemKindEnum, CatalogNodeModel, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';
import { catchError, combineLatest, concatMap, map, of, Subject, switchMap, take, tap } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import {
  selectCatalog, selectCatalogNodeById, selectFeatureSources, selectGeoServices,
} from '../state/catalog.selectors';
import { updateCatalog } from '../state/catalog.actions';
import { nanoid } from 'nanoid';
import { AdminSnackbarService } from '../../shared/services/admin-snackbar.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminSseService, EventType } from '../../shared/services/admin-sse.service';
import { MoveCatalogNodeModel } from '../models/move-catalog-node.model';
import { CatalogTreeMoveHelper } from '../helpers/catalog-tree-move.helper';
import { DebounceHelper } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {
  private store$ = inject(Store);
  private adminApiService = inject(TAILORMAP_ADMIN_API_V1_SERVICE);
  private adminSnackbarService = inject(AdminSnackbarService);
  private sseService = inject(AdminSseService);


  private destroyed = new Subject<null>();

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
    return this.store$.select(selectCatalog)
      .pipe(
        take(1),
        switchMap(catalog => {
          const items = this.findItemsForNodeRecursively(node, catalog);
          const serviceItems = items
            .filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE)
            .map(item => item.id);
          const featureSourceItems = items
            .filter(item => item.kind === CatalogItemKindEnum.FEATURE_SOURCE)
            .map(item => item.id);
          const serviceIds = new Set(serviceItems);
          const featureSourceIds = new Set(featureSourceItems);
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
          this.adminSnackbarService.showMessage($localize `:@@admin-core.catalog.error-updating-catalog:Error while updating catalog.`);
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

  private findItemsForNodeRecursively(node: CatalogNodeModel, catalog: CatalogNodeModel[]) {
    const items = [...(node.items || [])];
    if (node.children) {
      node.children.forEach(childId => {
        const child = catalog.find(c => c.id === childId);
        if (child) {
          items.push(...this.findItemsForNodeRecursively(child, catalog));
        }
      });
    }
    return items;
  }

}
