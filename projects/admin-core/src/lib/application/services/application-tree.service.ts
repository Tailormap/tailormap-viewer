import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { addApplicationTreeNodes, setSelectedApplication } from '../state/application.actions';
import { selectApplicationById } from '../state/application.selectors';
import { take } from 'rxjs';
import * as ApplicationActions from '../state/application.actions';
import { AppTreeLevelNodeModel, AppTreeNodeModel } from '@tailormap-admin/admin-api';

@Injectable({
  providedIn: 'root',
})
export class ApplicationTreeService {

  public static ROOT_NODE_TITLE = $localize `Application layers`;

  constructor(
    private store$: Store,
  ) { }

  public setSelectedApplication(id: string | null) {
    this.store$.dispatch(setSelectedApplication({ applicationId: id }));
    if (id) {
      this.ensureApplicationHasRootNodes(id);
    }
  }

  private ensureApplicationHasRootNodes(id: string) {
    this.store$.select(selectApplicationById(id))
      .pipe(take(1))
      .subscribe(application => {
        if (!application) {
          return;
        }
        if ((application.contentRoot?.layerNodes || []).length === 0) {
          this.addNodeToTree(application.id, 'layer', [this.createRootNode()]);
        }
        if ((application.contentRoot?.baseLayerNodes || []).length === 0) {
          this.addNodeToTree(application.id, 'baseLayer', [this.createRootNode()]);
        }
      });
  }

  private addNodeToTree(applicationId: string, tree: 'layer' | 'baseLayer', nodes: AppTreeNodeModel[]) {
    this.store$.dispatch(addApplicationTreeNodes({ applicationId, tree, treeNodes: nodes }));
  }

  private createRootNode(): AppTreeLevelNodeModel {
    return {
      id: 'root',
      title: ApplicationTreeService.ROOT_NODE_TITLE,
      root: true,
      objectType: 'AppTreeLevelNode',
      childrenIds: [],
    };
  }

}
