import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { selectCatalogTree } from '../state/catalog.selectors';
import { BehaviorSubject, filter, map } from 'rxjs';
import { CatalogTreeModelMetadataTypes } from '../models/catalog-tree.model';
import { CatalogTreeHelper } from '../helpers/catalog-tree.helper';
import { NavigationEnd, Router } from '@angular/router';
import { RoutesEnum } from '../../routes';
import { CatalogTreeModelTypeEnum } from '../models/catalog-tree-model-type.enum';
import { CatalogTreeService } from '../services/catalog-tree.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class CatalogTreeComponent implements OnInit {

  private selectedNodeId = new BehaviorSubject<string>('');

  constructor(
    private treeService: TreeService<CatalogTreeModelMetadataTypes, CatalogTreeModelTypeEnum>,
    private store$: Store,
    private catalogTreeService: CatalogTreeService,
    private router: Router,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    const catalogTree$ = this.store$.select(selectCatalogTree)
      .pipe(
        filter(tree => !!tree && tree.length > 0),
        map((tree, idx) => {
          if (idx === 0) {
            this.expandTreeToSelectedItem(this.router.url);
          }
          return tree;
        }),
      );
    this.treeService.setDataSource(catalogTree$, () => true);
    this.treeService.setSelectedNode(this.selectedNodeId.asObservable());
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event: NavigationEnd) => {
        const deconstructedUrl = this.readNodesFromUrl(event.url);
        const lastItem = deconstructedUrl.pop();
        this.selectedNodeId.next(lastItem ? lastItem.treeNodeId : '');
      });
  }

  private readNodesFromUrl(url: string): Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> {
    const currentRoute = url
      .replace(RoutesEnum.CATALOG, '')
      .split('/')
      .filter(part => !!part);
    const parts: Array<{ type: CatalogTreeModelTypeEnum; treeNodeId: string; id: string }> = [];
    if (currentRoute.length >= 2 && currentRoute[0] === 'node') {
      parts.push({ type: CatalogTreeModelTypeEnum.CATALOG_NODE_TYPE, treeNodeId: CatalogTreeHelper.getIdForCatalogNode(currentRoute[1]), id: currentRoute[1] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'service') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_TYPE, treeNodeId: CatalogTreeHelper.getIdForServiceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 4 && currentRoute[2] === 'feature-source') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_SOURCE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureSourceNode(currentRoute[3]), id: currentRoute[3] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'feature-type') {
      parts.push({ type: CatalogTreeModelTypeEnum.FEATURE_TYPE_TYPE, treeNodeId: CatalogTreeHelper.getIdForFeatureTypeNode(currentRoute[5]), id: currentRoute[5] });
    }
    if (currentRoute.length >= 6 && currentRoute[4] === 'layer') {
      parts.push({ type: CatalogTreeModelTypeEnum.SERVICE_LAYER_TYPE, treeNodeId: CatalogTreeHelper.getIdForLayerNode(currentRoute[5]), id: currentRoute[5] });
    }
    return parts;
  }

  private expandTreeToSelectedItem(url: string) {
    const urlParts = this.readNodesFromUrl(url);
    if (urlParts.length === 0) {
      return;
    }
    this.catalogTreeService.expandTreeToSelectedItem(urlParts);
  }

}
