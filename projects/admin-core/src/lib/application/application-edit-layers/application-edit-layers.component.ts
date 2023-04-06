import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeDragDropService, TreeModel, TreeService } from '@tailormap-viewer/shared';
import { selectServiceLayerTree } from '../../catalog/state/catalog.selectors';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { CatalogTreeHelper } from '../../catalog/helpers/catalog-tree.helper';

@Component({
  selector: 'tm-admin-application-edit-layers',
  templateUrl: './application-edit-layers.component.html',
  styleUrls: ['./application-edit-layers.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class ApplicationEditLayersComponent implements OnInit {

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

}
