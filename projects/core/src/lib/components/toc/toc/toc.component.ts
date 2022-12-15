import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Observable, of, Subject, takeUntil } from 'rxjs';
import { BaseTreeModel, TreeService } from '@tailormap-viewer/shared';
import { map } from 'rxjs/operators';
import { MenubarService } from '../../menubar';
import { TocMenuButtonComponent } from '../toc-menu-button/toc-menu-button.component';
import { Store } from '@ngrx/store';
import { setLayerVisibility, setSelectedLayerId, toggleLevelExpansion } from '../../../map/state/map.actions';
import { selectLayerTree, selectSelectedNode } from '../../../map/state/map.selectors';
import { AppLayerModel, BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { MapService } from '@tailormap-viewer/map';

interface AppLayerTreeModel extends BaseTreeModel {
  metadata: AppLayerModel;
}
const isAppLayerTreeModel = (node: BaseTreeModel): node is AppLayerTreeModel => !!node.metadata && node.metadata.layerName;

@Component({
  selector: 'tm-toc',
  templateUrl: './toc.component.html',
  styleUrls: [ './toc.component.css', '../../../../../assets/layer-tree-style.css' ],
  providers: [TreeService],
})
export class TocComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public visible$: Observable<boolean> = of(false);
  public scale: number | null = null;

  private infoTreeNodeId = new BehaviorSubject<string | null>(null);
  public infoTreeNodeId$ = this.infoTreeNodeId.asObservable();

  constructor(
    private store$: Store,
    private treeService: TreeService<AppLayerModel>,
    private menubarService: MenubarService,
    private mapService: MapService,
  ) {}

  public ngOnInit(): void {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.TOC);
    this.mapService.getMapViewDetails$()
      .pipe(takeUntil(this.destroyed), map(resolution => resolution.scale))
      .subscribe(scale => this.scale = scale);

    this.treeService.setDataSource(
      this.store$.select(selectLayerTree),
    );
    this.treeService.setSelectedNode(this.store$.select(selectSelectedNode));
    this.treeService.checkStateChangedSource$
      .pipe(
        takeUntil(this.destroyed),
        map(checkChange => checkChange
          .filter(isAppLayerTreeModel)
          .map(node => ({ id: node.metadata.id, checked: !!node.checked }))),
      )
      .subscribe(checkChanged => this.store$.dispatch(setLayerVisibility({ visibility: checkChanged })));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(node => this.store$.dispatch(toggleLevelExpansion({ id: node.id })));
    this.treeService.selectionStateChangedSource$
      .pipe(
        takeUntil(this.destroyed),
        filter(isAppLayerTreeModel),
        map(node => node.metadata.id),
      )
      .subscribe(layerId => this.store$.dispatch(setSelectedLayerId({ layerId })));
    this.menubarService.registerComponent(TocMenuButtonComponent);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public showTreeNodeInfo(nodeId: string) {
    this.infoTreeNodeId.next(nodeId);
  }

  public layerInfoClosed() {
    this.infoTreeNodeId.next(null);
  }

}
