import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import {
  isLoadingApplicationServices,
  selectAppLayerTreeForSelectedApplication, selectBaseLayerTreeForSelectedApplication,
  selectSelectedApplication,
  selectSelectedApplicationId,
} from '../state/application.selectors';
import { BehaviorSubject, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import {
  addApplicationTreeNodes, removeApplicationTreeNode, setSelectedApplication, updateApplicationTreeNode,
  updateApplicationTreeNodeVisibility,
  updateApplicationTreeOrder,
} from '../state/application.actions';
import { nanoid } from 'nanoid';
import { AddLayerEvent } from '../application-catalog-tree/application-catalog-tree.component';
import { ApplicationService } from '../services/application.service';

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

  private selectedNodeIdSubject = new BehaviorSubject<string>('');
  public selectedNodeId$ = this.selectedNodeIdSubject.asObservable();

  private destroyed = new Subject();

  public hasChanges = false;

  @Input()
  public applicationStateTree: 'layer' | 'baseLayer' = 'layer';

  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  public loadingServices$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    public applicationTreeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private applicationService: ApplicationService,
  ) {}

  public ngOnInit(): void {
    this.treeNodes$ = this.applicationStateTree === 'baseLayer'
      ? this.store$.select(selectBaseLayerTreeForSelectedApplication)
      : this.store$.select(selectAppLayerTreeForSelectedApplication);
    this.loadingServices$ = this.store$.select(isLoadingApplicationServices);

    if (this.applicationStateTree === 'layer') {
      this.applicationTreeService.setSelectedNode(this.selectedNodeId$);
      this.applicationTreeService.selectionStateChangedSource$
        .pipe(takeUntil(this.destroyed))
        .subscribe(node => {
          console.log(node);
          this.selectedNodeIdSubject.next(node.id);
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
    this.executeAction(applicationId => {
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
    this.executeAction(applicationId => {
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
    this.executeAction(applicationId => {
      this.store$.dispatch(updateApplicationTreeNodeVisibility({
        applicationId,
        tree: this.applicationStateTree,
        visibility: $event,
      }));
    });
  }

  public renameFolder($event: { nodeId: string; title: string }) {
    const updatedNode: Partial<AppTreeLevelNodeModel> = { title: $event.title };
    this.executeAction(applicationId => {
      this.store$.dispatch(updateApplicationTreeNode({
        applicationId,
        tree: this.applicationStateTree,
        nodeId: $event.nodeId,
        updatedNode,
      }));
    });
  }

  public removeNode($event: { nodeId: string }) {
    this.executeAction(applicationId => {
      this.store$.dispatch(removeApplicationTreeNode({
        applicationId,
        tree: this.applicationStateTree,
        nodeId: $event.nodeId,
      }));
    });
  }

  public save() {
    if (!this.hasChanges) {
      return;
    }
    this.savingSubject.next(true);
    this.store$.select(selectSelectedApplication)
      .pipe(take(1))
      .subscribe(application => {
        if (!application) {
          this.savingSubject.next(false);
          return;
        }
        const contentRoot = application.contentRoot;
        if (!contentRoot) {
          this.savingSubject.next(false);
          return;
        }
        this.applicationService.updateApplicationTree$(application.id, contentRoot)
          .pipe(take(1))
          .subscribe(success => {
            if (success) {
              this.hasChanges = false;
            }
            this.savingSubject.next(false);
          });
      });
  }

  public clearSelectedApplication() {
    this.store$.dispatch(setSelectedApplication({ applicationId: null }));
  }

  private executeAction(action: (applicationId: string) => void) {
    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        this.hasChanges = true;
        action(applicationId);
      });
  }

}
