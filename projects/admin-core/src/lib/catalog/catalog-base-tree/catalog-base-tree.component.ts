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
    if (this.isFormFieldFocused()) {
      return;
    }
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
    if (this.isFormFieldFocused()) {
      return;
    }
    $event.preventDefault();
    const selectedNode = this.treeService.selectNextNode();
    if (selectedNode) {
      const routerLink = CatalogTreeHelper.getRouterLink(selectedNode);
      if (routerLink) {
        this.router.navigateByUrl(routerLink);
      }
    }
  }

  @HostListener('window:keydown.arrowleft', ['$event'])
  public onArrowLeft($event: KeyboardEvent) {
    if (this.isFormFieldFocused()) {
      return;
    }
    $event.preventDefault();
    this.treeService.selectedNode$
      .pipe(take(1))
      .subscribe(selectedId => {
        if (!selectedId) {
          return;
        }
        const node = this.treeService.getNode(selectedId);
        if (!node) {
          return;
        }
        if (CatalogTreeHelper.isExpandableNode(node) && node.expanded) {
          // collapse selected expandable node
          this.treeService.toggleNodeExpanded(node);
        }
      });
  }

  @HostListener('window:keydown.arrowright', ['$event'])
  public onArrowRight($event: KeyboardEvent) {
    if (this.isFormFieldFocused()) {
      return;
    }
    $event.preventDefault();
    this.treeService.selectedNode$
      .pipe(take(1))
      .subscribe(selectedId => {
        if (!selectedId) {
          return;
        }
        const node = this.treeService.getNode(selectedId);
        if (!node) {
          return;
        }
        if (CatalogTreeHelper.isExpandableNode(node) && !node.expanded) {
          // expand selected expandable node
          this.treeService.expandNode(node.id);
        }
      });
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

  private isFormFieldFocused(): boolean {
    const ae = document.activeElement as HTMLElement | null;
    if (!ae) {
      return false;
    }
    const tag = ae.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return true;
    }
    return ae.isContentEditable;
  }

}
