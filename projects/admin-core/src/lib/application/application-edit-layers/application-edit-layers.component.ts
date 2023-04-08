import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { selectAppLayerTreeForSelectedApplication, selectSelectedApplicationId } from '../state/application.selectors';
import { Observable, of, take } from 'rxjs';
import { AppTreeLayerNodeModel, AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { addApplicationTreeNodes, updateApplicationTreeOrder } from '../state/application.actions';
import { nanoid } from 'nanoid';
import { AddLayerEvent } from '../application-catalog-tree/application-catalog-tree.component';

@Component({
  selector: 'tm-admin-application-edit-layers',
  templateUrl: './application-edit-layers.component.html',
  styleUrls: ['./application-edit-layers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class ApplicationEditLayersComponent implements OnInit {

  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  constructor(
    private store$: Store,
    public applicationTreeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
  ) {}

  public ngOnInit(): void {
    this.treeNodes$ = this.store$.select(selectAppLayerTreeForSelectedApplication);
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
    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        this.store$.dispatch(addApplicationTreeNodes({
          applicationId,
          tree: 'layer',
          treeNodes: [node],
          parentId,
          position,
          sibling,
        }));
      });
  }

  public nodePositionChanged($event: { nodeId: string; position: TreeNodePosition; parentId?: string; sibling: string }) {
    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        this.store$.dispatch(updateApplicationTreeOrder({
          applicationId,
          nodeId: $event.nodeId,
          position: $event.position,
          parentId: $event.parentId,
          sibling: $event.sibling,
          tree: 'layer',
        }));
      });
  }
}
