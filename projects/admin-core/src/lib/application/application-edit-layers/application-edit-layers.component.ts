import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import {
  isLoadingApplicationServices,
  selectAppLayerTreeForSelectedApplication, selectBaseLayerTreeForSelectedApplication,
  selectDraftApplication,
  selectSelectedApplicationId,
} from '../state/application.selectors';
import { BehaviorSubject, map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import {
  AppLayerSettingsModel, ApplicationModel, AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel,
} from '@tailormap-admin/admin-api';
import {
  addApplicationTreeNodes, clearSelectedApplication, removeApplicationTreeNode, updateApplicationNodeSettings, updateApplicationTreeNode,
  updateApplicationTreeNodeVisibility,
  updateApplicationTreeOrder,
} from '../state/application.actions';
import { nanoid } from 'nanoid';
import { AddLayerEvent } from '../application-catalog-tree/application-catalog-tree.component';
import { ApplicationService } from '../services/application.service';
import { ApplicationTreeHelper } from '../helpers/application-tree.helper';

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

  public hasChanges: Array<'tree'|'settings'> = [];

  @Input()
  public applicationStateTree: 'layer' | 'baseLayer' = 'layer';

  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  public loadingServices$: Observable<boolean> = of(false);
  public catalogTreeOpened = true;

  constructor(
    private store$: Store,
    public applicationTreeService: TreeService<AppTreeNodeModel>,
    private applicationService: ApplicationService,
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
    const node: AppTreeLayerNodeModel = {
      id: 'lyr_' + $event.layer.id,
      description: '',
      objectType: 'AppTreeLayerNode',
      layerName: $event.layer.name,
      serviceId: $event.layer.serviceId,
      visible: true,
    };
    this.addNode(node, $event.toParent || undefined, $event.position, $event.sibling);
  }

  private addNode(
    node: AppTreeNodeModel,
    parentId?: string,
    position?: TreeNodePosition,
    sibling?: string,
  ) {
    this.executeAction('tree', applicationId => {
      this.store$.dispatch(addApplicationTreeNodes({
        applicationId,
        tree: this.applicationStateTree,
        treeNodes: [node],
        parentId,
        position,
        sibling,
      }));
    });
  }

  public nodePositionChanged($event: { nodeId: string; position: TreeNodePosition; parentId?: string; sibling: string }) {
    this.executeAction('tree', applicationId => {
      this.store$.dispatch(updateApplicationTreeOrder({
        applicationId,
        nodeId: $event.nodeId,
        position: $event.position,
        parentId: $event.parentId,
        sibling: $event.sibling,
        tree: this.applicationStateTree,
      }));
    });
  }

  public visibilityChanged($event: Array<{ nodeId: string; visible: boolean }>) {
    this.executeAction('tree', applicationId => {
      this.store$.dispatch(updateApplicationTreeNodeVisibility({
        applicationId,
        tree: this.applicationStateTree,
        visibility: $event,
      }));
    });
  }

  public renameFolder($event: { nodeId: string; title: string }) {
    const updatedNode: Partial<AppTreeLevelNodeModel> = { title: $event.title };
    this.executeAction('tree', applicationId => {
      this.store$.dispatch(updateApplicationTreeNode({
        applicationId,
        tree: this.applicationStateTree,
        nodeId: $event.nodeId,
        updatedNode,
      }));
    });
  }

  public removeNode($event: { nodeId: string }) {
    this.executeAction('tree', applicationId => {
      this.store$.dispatch(removeApplicationTreeNode({
        applicationId,
        tree: this.applicationStateTree,
        nodeId: $event.nodeId,
      }));
    });
  }

  public save() {
    if (this.hasChanges.length === 0) {
      return;
    }
    this.savingSubject.next(true);
    this.store$.select(selectDraftApplication)
      .pipe(take(1))
      .subscribe(application => {
        if (!application || this.hasChanges.length === 0) {
          this.savingSubject.next(false);
          return;
        }
        this.savingSubject.next(true);
        const updatedApplication: Partial<ApplicationModel> = {};
        if (this.hasChanges.includes('tree')) {
          updatedApplication.contentRoot = application.contentRoot;
        }
        if (this.hasChanges.includes('settings')) {
          updatedApplication.settings = application.settings;
        }
        this.applicationService.updateApplication$(application.id, updatedApplication)
          .pipe(take(1))
          .subscribe(success => {
            if (success) {
              this.hasChanges = [];
            }
            this.savingSubject.next(false);
          });
      });
  }

  public clearSelectedApplication() {
    this.store$.dispatch(clearSelectedApplication());
  }

  public toggleCatalogTree() {
    this.catalogTreeOpened = !this.catalogTreeOpened;
  }

  public layerSettingsChanged($event: { nodeId: string; settings: AppLayerSettingsModel | null }) {
    this.executeAction('settings', applicationId => {
      this.store$.dispatch(updateApplicationNodeSettings({
        applicationId,
        nodeId: $event.nodeId,
        settings: $event.settings,
      }));
    });
  }

  private executeAction(whatChanged: 'tree' | 'settings', action: (applicationId: string) => void) {
    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        this.hasChanges.push(whatChanged);
        action(applicationId);
      });
  }

}
