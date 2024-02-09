import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, OnInit } from '@angular/core';
import { DropZoneOptions, RouterHistoryService, TreeDragDropService, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { selectCatalogTree } from '../state/catalog.selectors';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { CatalogTreeModel, CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogItemKindEnum } from '@tailormap-admin/admin-api';
import { CatalogService } from '../services/catalog.service';
import { expandTree, setCatalogFilterTerm } from '../state/catalog.actions';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class CatalogTreeComponent implements OnInit {

  private selectedNodeId = new BehaviorSubject<string>('');

  public catalogFilter = new FormControl('');

  private scrollToItem = new BehaviorSubject<string | undefined>(undefined);
  public scrollToItem$ = this.scrollToItem.asObservable();

  private hasFilter= false;

  constructor(
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private treeDragDropService: TreeDragDropService,
    private store$: Store,
    private history: RouterHistoryService,
    private destroyRef: DestroyRef,
    private catalogService: CatalogService,
    private ngZone: NgZone,
  ) { }

  public ngOnInit(): void {
    const catalogTree$ = this.store$.select(selectCatalogTree);
    this.treeService.setDataSource(catalogTree$);
    this.treeService.setSelectedNode(this.selectedNodeId.asObservable());

    let firstRun = true;
    combineLatest([
      catalogTree$.pipe(filter(tree => !!tree && tree.length > 0)),
      this.history.getCurrentUrl$(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef), filter(([tree]) => tree.length > 0))
      .subscribe(([ _tree, url ]) => {
        const node = CatalogTreeHelper.readNodeFromUrl(url);
        if (firstRun && this.history.isFirstNavigation(url) && node !== null) {
          // First time expand current node based on URL
          this.store$.dispatch(expandTree({ id: node.id, nodeType: node.type }));
          this.scrollToItem.next(node.treeNodeId);
          firstRun = false;
        }
        this.selectedNodeId.next(node ? node.treeNodeId : '');
      });

    this.catalogFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged(), debounceTime(250))
      .subscribe(filterTerm => {
        // We had a filter, not anymore, scroll to selected item
        if (this.hasFilter && !filterTerm) {
          this.scrollToItem.next(this.selectedNodeId.value);
        }
        this.store$.dispatch(setCatalogFilterTerm({ filterTerm }));
        this.hasFilter = !!filterTerm;
      });
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
      return (target: HTMLElement): DropZoneOptions[] => [{
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
        expandNode: (nodeId) => {
          const node = this.treeService?.getNode(nodeId);
          if (node && CatalogTreeHelper.isCatalogNode(node)) {
            this.treeService.expandNode(nodeId);
          }
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
