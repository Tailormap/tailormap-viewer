import { Injectable } from '@angular/core';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { expandTree, updateFeatureSourceNodeIds, updateGeoServiceNodeIds } from '../state/catalog.actions';
import { concatMap, filter, forkJoin, map, Observable, of, Subject, take, tap } from 'rxjs';
import {
  selectCatalog,
  selectCatalogNodeById, selectFeatureSourcesWithoutCatalogId, selectGeoServicesWithoutCatalogId, selectParentsForCatalogNode,
} from '../state/catalog.selectors';
import { CatalogItemKindEnum, FeatureSourceModel, GeoServiceWithLayersModel } from '@tailormap-admin/admin-api';
import { Store } from '@ngrx/store';
import { CatalogService } from './catalog.service';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';

@Injectable({
  providedIn: 'root',
})
export class CatalogTreeService {

  private loadServiceSubscriptions = new Map<string, Subject<null>>();

  constructor(
    private store$: Store,
    private catalogService: CatalogService,
  ) {
    // Load items for root node on init
    this.store$.select(selectCatalog)
      .pipe(
        filter(catalog => !!catalog && catalog.length > 0),
        take(1),
      )
      .subscribe(catalog => {
        const root = catalog.find(n => n.root);
        if (root) {
          this.loadCatalogNodeItems$(root.id, true).subscribe();
        }
      });
  }

  public expandTreeToUrl(url: string | null) {
    const urlParts = CatalogTreeHelper.readNodesFromUrl(url);
    if (urlParts.length === 0) {
      return;
    }
    this.expandTreeToSelectedItem(urlParts);
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
    if (!includeParents) {
      return forkJoin([this.loadCatalogChildren$(nodeId)]);
    }
    return this.store$.select(selectParentsForCatalogNode(nodeId))
      .pipe(
        take(1),
        concatMap(parentIds => {
          return forkJoin([
            ...parentIds.map(id => this.loadCatalogChildren$(id)),
            this.loadCatalogChildren$(nodeId),
          ]);
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
        const serviceItems = (node.items || [])
          .filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE)
          .map(item => item.id);
        const featureSourceItems = (node.items || [])
          .filter(item => item.kind === CatalogItemKindEnum.FEATURE_SOURCE)
          .map(item => item.id);
        return [ serviceItems, featureSourceItems ];
      }),
      tap(([ geoServiceItems, featureSourceItems ]) => {
        this.updateNodeIdForExistingItems(featureSourceItems, geoServiceItems, nodeId);
      }),
      concatMap(([ serviceItems, featureSourceItems ]) => {
        const services$ = this.catalogService.getServices$(serviceItems, newSubscription, nodeId);
        const featureSources$ = this.catalogService.getFeatureSources$(featureSourceItems, newSubscription, nodeId);
        const requests$: Array<Observable<GeoServiceWithLayersModel[] | FeatureSourceModel[]>> = [];
        if (services$) {
          requests$.push(services$);
        }
        if (featureSources$) {
          requests$.push(featureSources$);
        }
        if (services$ === null && featureSources$ === null) {
          return of([]);
        }
        return forkJoin(requests$);
      }),
    );
  }

  private cancelCurrentSubscription(nodeId: string) {
    const currentSubscription = this.loadServiceSubscriptions.get(nodeId);
    if (currentSubscription) {
      currentSubscription.next(null);
      currentSubscription.complete();
    }
  }

  private updateNodeIdForExistingItems(
    featureSourceItems: undefined | string[],
    geoServiceItems: undefined | string[],
    nodeId: string,
  ) {
    if (typeof featureSourceItems !== 'undefined') {
      const featureSourceIds = new Set(featureSourceItems);
      this.store$.select(selectFeatureSourcesWithoutCatalogId)
        .pipe(take(1))
        .subscribe(fs => {
          const featuresWithoutNodeId = fs.filter(id => featureSourceIds.has(id));
          if (featuresWithoutNodeId.length > 0) {
            this.store$.dispatch(updateFeatureSourceNodeIds({ featureSources: featuresWithoutNodeId, nodeId }));
          }
        });
    }
    if (typeof geoServiceItems !== 'undefined') {
      const geoServiceIds = new Set(geoServiceItems);
      this.store$.select(selectGeoServicesWithoutCatalogId)
        .pipe(take(1))
        .subscribe(s => {
          const geoServicesWithoutNodeId = s.filter(id => geoServiceIds.has(id));
          if (geoServicesWithoutNodeId.length > 0) {
            this.store$.dispatch(updateGeoServiceNodeIds({ geoServices: geoServicesWithoutNodeId, nodeId }));
          }
        });
    }
  }

}
