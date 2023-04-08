import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { NodePositionChangedEventModel, TreeDragDropService, TreeModel, TreeNodePosition, TreeService } from '@tailormap-viewer/shared';
import { Observable, of, Subject, take, takeUntil } from 'rxjs';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { MatDialog } from '@angular/material/dialog';
import { CreateSubFolderComponent } from './create-subfolder/create-sub-folder.component';

@Component({
  selector: 'tm-admin-application-layer-tree',
  templateUrl: './application-layer-tree.component.html',
  styleUrls: ['./application-layer-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeDragDropService],
})
export class ApplicationLayerTreeComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  @Input()
  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  @Output()
  public addSubFolder = new EventEmitter<{ nodeId: string; title: string }>();

  @Output()
  public nodePositionChanged = new EventEmitter<{ nodeId: string; position: TreeNodePosition; parentId?: string; sibling: string }>();

  constructor(
    private treeService: TreeService,
    private dialog: MatDialog,
    private ngZone: NgZone,
  ) {
    this.treeService.nodePositionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe((evt) => this.handleNodePositionChanged(evt));
  }

  public ngOnInit(): void {
    this.treeService.setDataSource(this.treeNodes$);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public handleNodePositionChanged(evt: NodePositionChangedEventModel) {
    this.ngZone.run(() => {
      this.nodePositionChanged.emit({
        nodeId: evt.nodeId,
        position: evt.position,
        parentId: evt.toParent || undefined,
        sibling: evt.sibling,
      });
    });
  }

  public onAddSubFolder(nodeId: string) {
    CreateSubFolderComponent.openDialog$(this.dialog)
      .pipe(take(1))
      .subscribe((title: string | null | undefined) => {
        if (title) {
          this.addSubFolder.emit({ nodeId, title });
        }
      });
  }

}
