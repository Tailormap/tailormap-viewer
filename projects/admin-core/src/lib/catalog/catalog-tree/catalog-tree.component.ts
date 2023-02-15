import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { LoadingStateEnum, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { selectCatalogLoadError, selectCatalogLoadStatus, selectCatalogTree } from '../state/catalog.selectors';
import { expandTree, loadCatalog } from '../state/catalog.actions';
import { filter, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { CatalogTreeModel } from '../models/catalog-tree.model';
import { CatalogHelper } from '../helpers/catalog.helper';
import { CatalogService } from '../services/catalog.service';
import { Router } from '@angular/router';
import { RoutesEnum } from '../../routes';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class CatalogTreeComponent implements OnInit, OnDestroy {

  public isLoading$: Observable<boolean> = of(false);
  public errorMessage$: Observable<string | null> = of(null);
  private destroyed = new Subject();

  constructor(
    private treeService: TreeService,
    private store$: Store,
    private catalogService: CatalogService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.isLoading$ = this.store$.select(selectCatalogLoadStatus)
      .pipe(map(loadStatus => loadStatus === LoadingStateEnum.LOADING));
    this.errorMessage$ = this.store$.select(selectCatalogLoadError)
      .pipe(map(error => error || null));
    this.treeService.setDataSource(this.store$.select(selectCatalogTree));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ node, expanded }) => this.toggleExpansion(node, expanded));
    this.treeService.selectionStateChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(node => this.navigateToDetails(node));

    this.store$.dispatch(loadCatalog());
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onRetryClick() {
    this.store$.dispatch(loadCatalog());
  }

  private toggleExpansion(node: CatalogTreeModel, expanded: boolean) {
    if (CatalogHelper.isExpandableNode(node)) {
      this.store$.dispatch(expandTree({ node }));
    }
    if (expanded && CatalogHelper.isCatalogNode(node) && !!node.metadata) {
      this.catalogService.loadCatalogNodeItems(node.metadata);
    }
  }

  private navigateToDetails(node: CatalogTreeModel) {
    if (!node.metadata) {
      return;
    }
    let baseUrl: string | undefined;
    if (CatalogHelper.isServiceNode(node)) {
      baseUrl = RoutesEnum.CATALOG_SERVICE.replace(':id', node.metadata.id);
    }
    if (CatalogHelper.isLayerNode(node) && !node.metadata.virtual) {
      baseUrl = RoutesEnum.CATALOG_LAYER.replace(':serviceId', node.metadata.serviceId).replace(':id', node.metadata.id);
    }
    if (typeof baseUrl === 'undefined') {
      return;
    }
    this.router.navigateByUrl([ RoutesEnum.CATALOG, baseUrl ].join('/'));
  }

}
