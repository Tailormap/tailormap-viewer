import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LoadingStateEnum, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';
import { selectCatalogLoadError, selectCatalogLoadStatus, selectCatalogTree } from '../state/catalog.selectors';
import { loadCatalog } from '../state/catalog.actions';
import { map, Observable, of } from 'rxjs';

@Component({
  selector: 'tm-admin-catalog-tree',
  templateUrl: './catalog-tree.component.html',
  styleUrls: ['./catalog-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeService],
})
export class CatalogTreeComponent implements OnInit {

  public isLoading$: Observable<boolean> = of(false);
  public errorMessage$: Observable<string | null> = of(null);

  constructor(
    private treeService: TreeService,
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.isLoading$ = this.store$.select(selectCatalogLoadStatus)
      .pipe(map(loadStatus => loadStatus === LoadingStateEnum.LOADING));
    this.errorMessage$ = this.store$.select(selectCatalogLoadError)
      .pipe(map(error => error || null));
    this.store$.dispatch(loadCatalog());
    this.treeService.setDataSource(this.store$.select(selectCatalogTree));
  }

  public onRetryClick() {
    this.store$.dispatch(loadCatalog());
  }

}
