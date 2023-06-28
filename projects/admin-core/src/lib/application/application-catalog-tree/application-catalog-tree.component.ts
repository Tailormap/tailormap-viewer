import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, NgZone } from '@angular/core';
import {
  DropZoneOptions, NodePositionChangedEventModel, TreeDragDropService, TreeModel, TreeNodePosition, TreeService,
} from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { selectServiceLayerTree } from '../../catalog/state/catalog.selectors';
import { CatalogTreeHelper } from '../../catalog/helpers/catalog-tree.helper';
import { ExtendedGeoServiceLayerModel } from '../../catalog/models/extended-geo-service-layer.model';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';

export interface AddLayerEvent {
  layer: ExtendedGeoServiceLayerModel;
  position: TreeNodePosition;
  sibling: string;
  toParent: string | null;
}

@Component({
  selector: 'tm-admin-application-catalog-tree',
  templateUrl: './application-catalog-tree.component.html',
  styleUrls: ['./application-catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class ApplicationCatalogTreeComponent implements OnInit {

  @Input()
  public applicationTreeService: TreeService<AppTreeNodeModel> | undefined;

  @Output()
  public addLayer = new EventEmitter<AddLayerEvent>();

  constructor(
    private store$: Store,
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private ngZone: NgZone,
  ) {}

  public ngOnInit(): void {
    this.treeService.setDataSource(this.store$.select(selectServiceLayerTree));
  }

  public selectableNode(node: TreeModel<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>): node is TreeModel<ExtendedGeoServiceLayerModel, CatalogTreeModelTypeEnum> {
    return CatalogTreeHelper.isLayerNode(node) && !!node.metadata && !node.metadata.virtual;
  }

  public getDropZones(): () => DropZoneOptions[] {
    return () => [{
      dropInsideOnly: true,
      getTargetElement: () => document.querySelector('.application-tree mat-tree'),
      dragAllowed: (nodeid: string) => {
        const node = this.treeService.getNode(nodeid);
        return !!node && this.selectableNode(node);
      },
      dropAllowed: () => true,
      dropInsideAllowed: (nodeId) => !!this.applicationTreeService?.isExpandable(nodeId),
      isExpandable: (nodeId) => !!this.applicationTreeService?.isExpandable(nodeId),
      isExpanded: (nodeId) => !!this.applicationTreeService?.isExpanded(nodeId),
      expandNode: (nodeId) => !!this.applicationTreeService?.expandNode(nodeId),
      getParent: (nodeId) => this.applicationTreeService?.getParent(nodeId) || null,
      nodePositionChanged: (evt) => this.onNodePositionChanged(evt),
    }];
  }

  private onNodePositionChanged(evt: NodePositionChangedEventModel) {
    const node = this.treeService.getNode(evt.nodeId);
    this.ngZone.run(() => {
      if (node && !!node.metadata && this.selectableNode(node)) {
        this.addLayer.emit({
          layer: node.metadata,
          position: evt.position,
          sibling: evt.sibling,
          toParent: evt.toParent,
        });
      }
    });
  }
}
