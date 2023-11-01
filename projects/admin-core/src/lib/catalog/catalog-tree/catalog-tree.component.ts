import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, OnInit } from '@angular/core';
import { DropZoneOptions, RouterHistoryService, TreeDragDropService, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { selectCatalogTree } from '../state/catalog.selectors';
import { BehaviorSubject, filter, map } from 'rxjs';
import { CatalogTreeModel, CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { Routes } from '../../routes';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { CatalogTreeService } from '../services/catalog-tree.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { CatalogService } from '../services/catalog.service';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class CatalogTreeComponent implements OnInit {

  private selectedNodeId = new BehaviorSubject<string>('');

  constructor(
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private treeDragDropService: TreeDragDropService,
    private store$: Store,
    private catalogTreeService: CatalogTreeService,
    private history: RouterHistoryService,
    private destroyRef: DestroyRef,
    private catalogService: CatalogService,
    private ngZone: NgZone,
  ) { }

  public ngOnInit(): void {
    const catalogTree$ = this.store$.select(selectCatalogTree)
      .pipe(
        filter(tree => !!tree && tree.length > 0),
        map((tree, idx) => {
          if (idx === 0) {
            this.expandTreeToSelectedItem(this.history.getCurrentUrl());
          }
          return tree;
        }),
      );
    this.treeService.setDataSource(catalogTree$, () => true);
    this.treeService.setSelectedNode(this.selectedNodeId.asObservable());
    this.history.getCurrentUrl$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((url: string | null) => {
        const deconstructedUrl = this.readNodesFromUrl(url);
        const lastItem = deconstructedUrl.pop();
        this.selectedNodeId.next(lastItem ? lastItem.treeNodeId : '');
      });
  }

  private readNodesFromUrl(url: string | null): Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> {
    if (url === null) {
      return [];
    }
    const currentRoute = url
      .substring(url.indexOf('/admin') === 0 ? 6 : 0) // remove /admin from URL if url starts with /admin
      .replace(Routes.CATALOG, '')
      .split('/')
      .filter(part => !!part);
    const parts: Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> = [];
    if (currentRoute.length >= 2 && currentRoute[0] === 'node') {
      parts.push({ type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE, treeNodeId: CatalogTreeHelper.getIdForCatalogNode(currentRoute[1]), id: currentRoute[1] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'service') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_TYPE, treeNodeId: CatalogTreeHelper.getIdForServiceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'feature-source') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureSourceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'feature-type') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureTypeNode(currentRoute[5]), id: currentRoute[5] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'layer') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE, treeNodeId: CatalogTreeHelper.getIdForLayerNode(currentRoute[5]), id: currentRoute[5] });
    }
    return parts;
  }

  private expandTreeToSelectedItem(url: string | null) {
    const urlParts = this.readNodesFromUrl(url);
    if (urlParts.length === 0) {
      return;
    }
    this.catalogTreeService.expandTreeToSelectedItem(urlParts);
  }

  private isDraggableNode(nodeId: string): boolean {
    const node = this.treeService?.getNode(nodeId);
    if (!node?.metadata) {
      return false;
    }
    return CatalogTreeHelper.isCatalogNode(node)
      || CatalogTreeHelper.isServiceNode(node)
      || CatalogTreeHelper.isFeatureSource(node);
  }

  private getDraggableNodeType(node?: CatalogTreeModel): 'node' | CatalogItemKindEnum | null {
    if (!node) {
      return null;
    }
    if (CatalogTreeHelper.isCatalogNode(node)) {
      return 'node';
    }
    if (CatalogTreeHelper.isServiceNode(node)) {
      return CatalogItemKindEnum.GEO_SERVICE;
    }
    if (CatalogTreeHelper.isFeatureSource(node)) {
      return CatalogItemKindEnum.FEATURE_SOURCE;
    }
    return null;
  }

  public getDropZones() {
      return (target: HTMLDivElement): DropZoneOptions[] => [{
        getTargetElement: () => target,
        dragAllowed: (nodeId: string): boolean => this.isDraggableNode(nodeId),
        dropAllowed: (nodeId: string): boolean => this.isDraggableNode(nodeId),
        dropInsideAllowed: (nodeId) => {
          const node = this.treeService?.getNode(nodeId);
          if (!node?.metadata) {
            return false;
          }
          return CatalogTreeHelper.isCatalogNode(node);
        },
        isExpandable: (nodeId) => !!this.treeService?.isExpandable(nodeId),
        isExpanded: (nodeId) => !!this.treeService?.isExpanded(nodeId),
        expandNode: () => {
          // No automatic expansion because of lazy loading
          return;
        },
        getParent: (nodeId) => this.treeService?.getParent(nodeId) || null,
        nodePositionChanged: (evt) => this.ngZone.run(() => {
          const fromParent = evt.fromParent ? this.treeService.getNode(evt.fromParent) : null;
          const toParent = evt.toParent ? this.treeService.getNode(evt.toParent) : null;
          const sibling = this.treeService.getNode(evt.sibling);
          const node = this.treeService.getNode(evt.nodeId);
          const siblingType = this.getDraggableNodeType(sibling);
          const nodeType = this.getDraggableNodeType(node);
          if (!node || !node.metadata || !sibling || !sibling.metadata || !siblingType || !nodeType) {
            return;
          }
          this.catalogService.moveCatalogNode$({
            fromParent: fromParent?.metadata?.id || null,
            toParent: toParent?.metadata?.id || null,
            sibling: sibling.metadata.id,
            siblingType,
            node: node.metadata.id,
            nodeType,
            position: evt.position,
          }).subscribe();
        }),
      }];
  }
}
