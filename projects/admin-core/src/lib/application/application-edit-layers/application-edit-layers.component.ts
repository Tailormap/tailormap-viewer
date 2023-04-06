import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreeModel, TreeService } from '@tailormap-viewer/shared';
import { CatalogTreeModelMetadataTypes } from '../../catalog/models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../../catalog/models/catalog-tree-model-type.enum';
import { selectAppLayerTreeForSelectedApplication, selectSelectedApplicationId } from '../state/application.selectors';
import { Observable, of, take } from 'rxjs';
import { AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { addApplicationTreeNodes } from '../state/application.actions';
import { nanoid } from 'nanoid';

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

  public addSubFolder(parentId: string) {
    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        const node: AppTreeLevelNodeModel = {
          id: nanoid(),
          description: '',
          objectType: 'AppTreeLevelNode',
          title: $localize `New folder`,
          root: false,
          childrenIds: [],
        };
        this.store$.dispatch(addApplicationTreeNodes({
          applicationId,
          tree: 'layer',
          treeNodes: [node],
          parentId,
        }));
      });
  }
}
