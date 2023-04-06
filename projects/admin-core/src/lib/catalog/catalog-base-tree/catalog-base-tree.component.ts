import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, Input, TemplateRef } from '@angular/core';
import { LoadingStateEnum, TreeService } from '@tailormap-viewer/shared';
import { CatalogTreeModel, CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { Store } from '@ngrx/store';
import { selectCatalogLoadError, selectCatalogLoadStatus } from '../state/catalog.selectors';
import { map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { expandTree, loadCatalog } from '../state/catalog.actions';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { CatalogTreeService } from '../services/catalog-tree.service';

@Component({
  selector: 'tm-admin-catalog-base-tree',
  templateUrl: './catalog-base-tree.component.html',
  styleUrls: ['./catalog-base-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogBaseTreeComponent implements OnInit, OnDestroy {

  public isLoading$: Observable<boolean> = of(false);
  public errorMessage$: Observable<string | null> = of(null);
  private destroyed = new Subject();

  @Input()
  public treeNodeTemplate?: TemplateRef<any>;

  constructor(
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private store$: Store,
    private catalogTreeService: CatalogTreeService,
  ) {
    this.isLoading$ = this.store$.select(selectCatalogLoadStatus)
      .pipe(map(loadStatus => loadStatus === LoadingStateEnum.LOADING));
    this.errorMessage$ = this.store$.select(selectCatalogLoadError)
      .pipe(map(error => error || null));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ node, expanded }) => this.toggleExpansion(node, expanded));
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.LOADED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

  public ngOnInit(): void {
  }

  private toggleExpansion(node: CatalogTreeModel, expanded: boolean) {
    if (CatalogTreeHelper.isExpandableNode(node) && node.metadata && node.type) {
      this.store$.dispatch(expandTree({ id: node.metadata.id, nodeType: node.type }));
    }
    if (expanded && CatalogTreeHelper.isCatalogNode(node) && !!node.metadata) {
      this.catalogTreeService.loadCatalogNodeItems$(node.metadata.id).subscribe();
    }
  }

  public onRetryClick() {
    this.store$.dispatch(loadCatalog());
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
