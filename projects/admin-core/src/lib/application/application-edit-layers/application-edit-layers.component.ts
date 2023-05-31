import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import {
  isLoadingApplicationServices, selectAppLayerNodesForSelectedApplication,
  selectAppLayerTreeForSelectedApplication, selectBaseLayerNodesForSelectedApplication, selectBaseLayerTreeForSelectedApplication,
} from '../state/application.selectors';
import { BehaviorSubject, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import {
  AppLayerSettingsModel, AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel,
} from '@tailormap-admin/admin-api';
import {
  addApplicationTreeNodes, removeApplicationTreeNode, toggleApplicationNodeExpanded, updateApplicationNodeSettings,
  updateApplicationTreeNode,
  updateApplicationTreeNodeVisibility,
  updateApplicationTreeOrder,
} from '../state/application.actions';
import { nanoid } from 'nanoid';
import { AddLayerEvent } from '../application-catalog-tree/application-catalog-tree.component';
import { ApplicationTreeHelper } from '../helpers/application-tree.helper';
import { ApplicationModelHelper } from '../helpers/application-model.helper';

@Component({
  selector: 'tm-admin-application-edit-layers',
  templateUrl: './application-edit-layers.component.html',
  styleUrls: ['./application-edit-layers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class ApplicationEditLayersComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private selectedNodeIdSubject = new BehaviorSubject<TreeModel<AppTreeNodeModel> | null>(null);
  public selectedNode$ = this.selectedNodeIdSubject.asObservable();
  public selectedLayerNode$: Observable<TreeModel<AppTreeLayerNodeModel> | null> = this.selectedNode$.pipe(
    map(node => ApplicationTreeHelper.isLayerTreeNode(node) ? node : null),
  );

  private destroyed = new Subject();

  @Input()
  public applicationStateTree: 'layer' | 'baseLayer' = 'layer';

  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  public loadingServices$: Observable<boolean> = of(false);
  public catalogTreeOpened = true;

  constructor(
    private store$: Store,
    public applicationTreeService: TreeService<AppTreeNodeModel>,
  ) {}

  public ngOnInit(): void {
    this.treeNodes$ = this.applicationStateTree === 'baseLayer'
      ? this.store$.select(selectBaseLayerTreeForSelectedApplication)
      : this.store$.select(selectAppLayerTreeForSelectedApplication);

    this.loadingServices$ = this.store$.select(isLoadingApplicationServices);

    if (this.applicationStateTree === 'layer') {
      this.applicationTreeService.setSelectedNode(this.selectedNode$
        .pipe(map(node => node?.id || '')),
      );
      this.applicationTreeService.selectionStateChangedSource$
        .pipe(takeUntil(this.destroyed))
        .subscribe(node => {
          if (!node.metadata) {
            this.selectedNodeIdSubject.next(null);
            return;
          }
          this.selectedNodeIdSubject.next(node);
        });
    }
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public addSubFolder(params: { nodeId: string; title: string }) {
    const node: AppTreeLevelNodeModel = {
      id: nanoid(),
      description: '',
      objectType: 'AppTreeLevelNode',
      title: params.title,
      root: false,
      childrenIds: [],
    };
    this.addNode(node, params.nodeId);
  }

  public addLayer($event: AddLayerEvent) {
    const layer = $event.layer;
    const nodes$ = this.applicationStateTree === 'baseLayer'
      ? this.store$.select(selectBaseLayerNodesForSelectedApplication)
      : this.store$.select(selectAppLayerNodesForSelectedApplication);
    nodes$
      .pipe(take(1))
      .subscribe(nodes => {
        const node = ApplicationModelHelper.newApplicationTreeLayerNode(layer, nodes);
        this.addNode(node, $event.toParent || undefined, $event.position, $event.sibling);
      });
  }

  private addNode(
    node: AppTreeNodeModel,
    parentId?: string,
    position?: TreeNodePosition,
    sibling?: string,
  ) {
    this.store$.dispatch(addApplicationTreeNodes({
      tree: this.applicationStateTree,
      treeNodes: [node],
      parentId,
      position,
      sibling,
    }));
  }

  public nodePositionChanged($event: { nodeId: string; position: TreeNodePosition; parentId?: string; sibling: string }) {
    this.store$.dispatch(updateApplicationTreeOrder({
      nodeId: $event.nodeId,
      position: $event.position,
      parentId: $event.parentId,
      sibling: $event.sibling,
      tree: this.applicationStateTree,
    }));
  }

  public visibilityChanged($event: Array<{ nodeId: string; visible: boolean }>) {
    this.store$.dispatch(updateApplicationTreeNodeVisibility({
      tree: this.applicationStateTree,
      visibility: $event,
    }));
  }

  public renameFolder($event: { nodeId: string; title: string }) {
    const updatedNode: Partial<AppTreeLevelNodeModel> = { title: $event.title };
    this.store$.dispatch(updateApplicationTreeNode({
      tree: this.applicationStateTree,
      nodeId: $event.nodeId,
      updatedNode,
    }));
  }

  public removeNode($event: { nodeId: string }) {
    this.store$.dispatch(removeApplicationTreeNode({
      tree: this.applicationStateTree,
      nodeId: $event.nodeId,
      parentId: this.applicationTreeService.getParent($event.nodeId),
    }));
  }

  public toggleCatalogTree() {
    this.catalogTreeOpened = !this.catalogTreeOpened;
  }

  public layerSettingsChanged($event: { nodeId: string; settings: AppLayerSettingsModel | null }) {
    this.store$.dispatch(updateApplicationNodeSettings({
      nodeId: $event.nodeId,
      settings: $event.settings,
    }));
  }

  public nodeExpandedToggled(nodeId: string) {
    this.store$.dispatch(toggleApplicationNodeExpanded({ nodeId, tree: this.applicationStateTree }));
  }

}
