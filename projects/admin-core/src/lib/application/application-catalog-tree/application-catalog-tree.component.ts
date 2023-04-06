import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { DropZoneOptions, NodePositionChangedEventModel, TreeDragDropService, TreeModel, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { selectServiceLayerTree } from '../../catalog/state/catalog.selectors';
import { CatalogTreeHelper } from '../../catalog/helpers/catalog-tree.helper';

@Component({
  selector: 'tm-admin-application-catalog-tree',
  templateUrl: './application-catalog-tree.component.html',
  styleUrls: ['./application-catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class ApplicationCatalogTreeComponent implements OnInit {

  @Input()
  public applicationTreeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum> | undefined;

  public additionalDropZones: DropZoneOptions[] = [{
    dropInsideOnly: true,
    getTargetElement: () => document.querySelector('.application-tree mat-tree'),
    dropAllowed: () => true,
    dropInsideAllowed: (nodeId) => {
      console.log(nodeId, this.applicationTreeService, this.applicationTreeService?.getDataNodes(), this.applicationTreeService?.isExpandable(nodeId));
      return !!this.applicationTreeService?.isExpandable(nodeId);
    },
    isExpandable: (nodeId) => !!this.applicationTreeService?.isExpandable(nodeId),
    isExpanded: (nodeId) => !!this.applicationTreeService?.isExpanded(nodeId),
    expandNode: (nodeId) => !!this.applicationTreeService?.expandNode(nodeId),
    getParent: (nodeId) => this.applicationTreeService?.getParent(nodeId) || null,
    nodePositionChanged: (evt) => this.addLayer(evt),
  }];

  constructor(
    private store$: Store,
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
  ) {}

  public ngOnInit(): void {
    this.treeService.setDataSource(this.store$.select(selectServiceLayerTree));
  }

  public selectableNode(node: TreeModel<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>): boolean {
    return CatalogTreeHelper.isLayerNode(node) && !!node.metadata && !node.metadata.virtual;
  }

  public addLayer(evt: NodePositionChangedEventModel) {
    console.log(evt);
  }

}
