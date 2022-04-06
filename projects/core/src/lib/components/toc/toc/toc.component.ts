import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { TreeService } from '@tailormap-viewer/shared';
import { map } from 'rxjs/operators';
import { TocService } from '../services/toc.service';
import { MenubarService } from '../../menubar';
import { TocMenuButtonComponent } from '../toc-menu-button/toc-menu-button.component';
import { Store } from '@ngrx/store';
import { setLayerVisibility, setSelectedLayerId } from '../../../map/state/map.actions';
import { selectLayerTree, selectSelectedLayerId } from '../../../map/state/map.selectors';
import { AppLayerModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-toc',
  templateUrl: './toc.component.html',
  styleUrls: ['./toc.component.css', '../../../../../assets/layer-tree-style.css'],
  providers: [ TreeService ],
})
export class TocComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public visible$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private treeService: TreeService<AppLayerModel>,
    private menubarService: MenubarService,
    private tocService: TocService,
  ) {}

  public ngOnInit(): void {
    this.visible$ = this.tocService.isVisible$();
    this.treeService.setDataSource(
      this.store$.select(selectLayerTree),
    );
    this.treeService.setSelectedNode(
      this.store$.select(selectSelectedLayerId).pipe(map(id => typeof id !== 'undefined' ? `${id}` : '')),
    );
    this.treeService.checkStateChangedSource$
      .pipe(
        takeUntil(this.destroyed),
        map(checkChange => {
          const changedLayers: Record<number, boolean> = {};
          checkChange.forEach(node => {
            if (node.metadata) {
              changedLayers[node.metadata.id] = !!node.checked;
            }
          });
          return changedLayers;
        }),
      )
      .subscribe(checkChanged => this.store$.dispatch(setLayerVisibility({ visibility: checkChanged })));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(nodeId => console.log(nodeId));
    this.treeService.selectionStateChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(layerId => this.store$.dispatch(setSelectedLayerId({ layerId })));

    this.menubarService.registerComponent(TocMenuButtonComponent);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public closeToc() {
    this.tocService.toggleVisible();
  }

}
