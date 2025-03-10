import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import {
  isLoadingApplicationServices, selectAppLayerNodesForSelectedApplication, selectAppLayerTreeForSelectedApplication,
  selectApplicationBaseLayerTreeFilterTerm, selectApplicationLayerTreeFilterTerm,
  selectBaseLayerNodesForSelectedApplication, selectBaseLayerTreeForSelectedApplication, selectDraftApplicationCrs,
  selectSomeExpandedAppLayerForSelectedApplication,
  selectSomeExpandedBaseLayersForSelectedApplication, selectTerrainLayerNodesForSelectedApplication,
  selectTerrainLayerTreeForSelectedApplication,
} from '../state/application.selectors';
import {
  BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, take, takeUntil,
} from 'rxjs';
import { AppLayerSettingsModel, AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import {
  addApplicationTreeNodes, removeApplicationTreeNode, setApplicationTreeFilterTerm, toggleApplicationNodeExpanded,
  toggleApplicationNodeExpandedAll,
  updateApplicationNodeSettings,
  updateApplicationTreeNode, updateApplicationTreeNodeVisibility, updateApplicationTreeOrder,
} from '../state/application.actions';
import { nanoid } from 'nanoid';
import { AddLayerEvent } from '../application-catalog-tree/application-catalog-tree.component';
import { ApplicationTreeHelper } from '../helpers/application-tree.helper';
import { ApplicationModelHelper } from '../helpers/application-model.helper';
import { selectGeoServiceAndLayerByName } from '../../catalog/state/catalog.selectors';
import { expandTree } from '../../catalog/state/catalog.actions';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { CatalogTreeHelper } from '../../catalog/helpers/catalog-tree.helper';

@Component({
  selector: 'tm-admin-application-edit-layers',
  templateUrl: './application-edit-layers.component.html',
  styleUrls: ['./application-edit-layers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
  standalone: false,
})
export class ApplicationEditLayersComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  private selectedNodeIdSubject = new BehaviorSubject<TreeModel<AppTreeNodeModel> | null>(null);
  public selectedNode$ = this.selectedNodeIdSubject.asObservable();
  public selectedLayerNode$: Observable<TreeModel<AppTreeLayerNodeModel> | null> = this.selectedNode$.pipe(
    map(node => ApplicationTreeHelper.isLayerTreeNode(node) ? node : null),
  );
  public selectedServiceLayer$ = this.selectedLayerNode$.pipe(
    switchMap(node => {
      if (!node || !node.metadata || !node.metadata.serviceId || !node.metadata.layerName) {
        return of(null);
      }
      return this.store$.select(selectGeoServiceAndLayerByName(node.metadata.serviceId, node.metadata.layerName));
    }),
  );

  private destroyed = new Subject();

  @Input()
  public applicationStateTree: 'layer' | 'baseLayer' | 'terrainLayer' = 'layer';

  @Input()
  public useRadioInputs = false;

  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);
  public someExpanded$: Observable<boolean> = of(false);

  public loadingServices$: Observable<boolean> = of(false);
  public catalogTreeOpened = true;
  public draftApplicationCrs$: Observable<string | undefined> = of(undefined);

  private selectedCatalogItemSubject = new BehaviorSubject<string | null>(null);
  public selectedCatalogItem$ = this.selectedCatalogItemSubject.asObservable();

  public filterTerm$: Observable<string | undefined> = of('');

  constructor(
    private store$: Store,
    public applicationTreeService: TreeService<AppTreeNodeModel>,
  ) {}

  public ngOnInit(): void {
    this.setDataSources();
    this.loadingServices$ = this.store$.select(isLoadingApplicationServices);

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

    this.selectedServiceLayer$
      .pipe(
        takeUntil(this.destroyed),
        map(s => s?.layer.id),
        filter(layerId => !!layerId),
        distinctUntilChanged(),
      )
      .subscribe(layerId => {
        if (!layerId) {
          return;
        }
        this.store$.dispatch(expandTree({ id: layerId, nodeType: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE }));
        this.selectedCatalogItemSubject.next(CatalogTreeHelper.getIdForLayerNode(layerId));
      });

    this.draftApplicationCrs$ = this.store$.select(selectDraftApplicationCrs);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private setDataSources() {
    if (this.applicationStateTree === 'layer') {
      this.treeNodes$ = this.store$.select(selectAppLayerTreeForSelectedApplication);
      this.someExpanded$ = this.store$.select(selectSomeExpandedAppLayerForSelectedApplication);
      this.filterTerm$ = this.store$.select(selectApplicationLayerTreeFilterTerm);
    } else if (this.applicationStateTree === 'baseLayer') {
      this.treeNodes$ = this.store$.select(selectBaseLayerTreeForSelectedApplication);
      this.someExpanded$ = this.store$.select(selectSomeExpandedBaseLayersForSelectedApplication);
      this.filterTerm$ = this.store$.select(selectApplicationBaseLayerTreeFilterTerm);
    } else {
      this.treeNodes$ = this.store$.select(selectTerrainLayerTreeForSelectedApplication)
      this.someExpanded$ = of(false);
      this.filterTerm$ = of('');
    }
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
    combineLatest([
        this.store$.select(selectBaseLayerNodesForSelectedApplication),
        this.store$.select(selectAppLayerNodesForSelectedApplication),
        this.store$.select(selectTerrainLayerNodesForSelectedApplication),
    ])
      .pipe(take(1))
      .subscribe(([ backgroundNodes, layerNodes, terrainLayerNodes ]) => {
        const node = ApplicationModelHelper.newApplicationTreeLayerNode(layer, [ ...backgroundNodes, ...layerNodes, ...terrainLayerNodes ]);
        if (this.useRadioInputs) {
          node.visible = false;
        }
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

  public nodeExpandedToggled($event: { nodeId?: string; expandCollapseAll?: 'expand' | 'collapse' }) {
    if ($event.expandCollapseAll) {
      this.store$.dispatch(toggleApplicationNodeExpandedAll({ expandCollapse: $event.expandCollapseAll, tree: this.applicationStateTree }));
      return;
    }
    if (!$event.nodeId) {
      return;
    }
    this.store$.dispatch(toggleApplicationNodeExpanded({ nodeId: $event.nodeId, tree: this.applicationStateTree }));
  }

  public filterChanged(filterTerm: string | null) {
    this.store$.dispatch(setApplicationTreeFilterTerm({ filterTerm, tree: this.applicationStateTree }));
  }

}
