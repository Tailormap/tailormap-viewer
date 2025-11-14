import { Component, ChangeDetectionStrategy, OnDestroy, Input, TemplateRef, NgZone, inject, HostListener } from '@angular/core';
import { DropZoneOptions, LoadingStateEnum, TreeService } from '@tailormap-viewer/shared';
import { CatalogTreeModel, CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { Store } from '@ngrx/store';
import { selectCatalogLoadError, selectCatalogLoadStatus } from '../state/catalog.selectors';
import { map, Observable, of, Subject, take, takeUntil } from 'rxjs';
import { expandTree, loadCatalog } from '../state/catalog.actions';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { Router } from '@angular/router';

@Component({
  selector: 'tm-admin-catalog-base-tree',
  templateUrl: './catalog-base-tree.component.html',
  styleUrls: ['./catalog-base-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CatalogBaseTreeComponent implements OnDestroy {
  private treeService = inject<TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>>(TreeService);
  private store$ = inject(Store);
  private ngZone = inject(NgZone);
  private router = inject(Router);


  public isLoading$: Observable<boolean> = of(false);
  public errorMessage$: Observable<string | null> = of(null);
  private destroyed = new Subject();

  @Input()
  public treeNodeTemplate?: TemplateRef<any>;

  @Input()
  public getDropZones?: (defaultTarget: HTMLElement) => DropZoneOptions[];

  @Input()
  public scrollToItem?: string | null;

  @HostListener('window:keydown.arrowup', ['$event'])
  public onArrowUp($event: KeyboardEvent) {
    $event.preventDefault();
    const selectedNode = this.treeService.selectPreviousNode();
    if (selectedNode) {
      const routerLink = CatalogTreeHelper.getRouterLink(selectedNode);
      if (routerLink) {
        this.router.navigateByUrl(routerLink);
      }
    }
  }

  @HostListener('window:keydown.arrowdown', ['$event'])
  public onArrowDown($event: KeyboardEvent) {
    console.debug('down');
    $event.preventDefault();
    const selectedNode = this.treeService.selectNextNode();
    if (selectedNode) {
      const routerLink = CatalogTreeHelper.getRouterLink(selectedNode);
      if (routerLink) {
        this.router.navigateByUrl(routerLink);
      }
    }
  }

  constructor() {
    this.isLoading$ = this.store$.select(selectCatalogLoadStatus)
      .pipe(map(loadStatus => loadStatus === LoadingStateEnum.LOADING));
    this.errorMessage$ = this.store$.select(selectCatalogLoadError)
      .pipe(map(error => error || null));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ node }) => this.ngZone.run(() => this.toggleExpansion(node)));
    this.store$.select(selectCatalogLoadStatus)
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadCatalog());
        }
      });
  }

  private toggleExpansion(node: CatalogTreeModel) {
    if (CatalogTreeHelper.isExpandableNode(node) && node.metadata && node.type) {
      this.store$.dispatch(expandTree({ id: node.metadata.id, nodeType: node.type, toggle: true }));
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
