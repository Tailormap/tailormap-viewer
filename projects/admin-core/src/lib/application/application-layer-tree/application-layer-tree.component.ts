import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import {
  DropZoneHelper, NodePositionChangedEventModel, TreeDragDropService, TreeModel, TreeNodePosition, TreeService,
} from '@tailormap-viewer/shared';
import { Observable, of, Subject, take, takeUntil } from 'rxjs';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationFolderNodeNameComponent } from './application-folder-node-name/application-folder-node-name.component';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'tm-admin-application-layer-tree',
  templateUrl: './application-layer-tree.component.html',
  styleUrls: ['./application-layer-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeDragDropService],
  standalone: false,
})
export class ApplicationLayerTreeComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  @Input()
  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  @Input()
  public filterTerm: string | null | undefined;

  @Input()
  public someExpanded: boolean | null | undefined;

  @Output()
  public addSubFolder = new EventEmitter<{ nodeId: string; title: string }>();

  @Output()
  public renameFolder = new EventEmitter<{ nodeId: string; title: string }>();

  @Output()
  public removeNode = new EventEmitter<{ nodeId: string }>();

  @Output()
  public nodePositionChanged = new EventEmitter<{ nodeId: string; position: TreeNodePosition; parentId?: string; sibling: string }>();

  @Output()
  public visibilityChanged = new EventEmitter<Array<{ nodeId: string; visible: boolean }>>();

  @Output()
  public nodeExpandedToggled = new EventEmitter<{ nodeId?: string; expandCollapseAll?: 'expand' | 'collapse' }>();

  @Output()
  public filterChanged = new EventEmitter<string | null>();

  public treeFilter = new FormControl('');

  constructor(
    private treeService: TreeService,
    private dialog: MatDialog,
    private ngZone: NgZone,
  ) {
    this.treeService.nodePositionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe((evt) => this.handleNodePositionChanged(evt));
    this.treeService.checkStateChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe((evt) => this.visibilityChanged.emit(evt.map((e) => ({ nodeId: e.id, visible: !!e.checked }))));
    this.treeService.nodeExpansionChangedSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe((evt) => this.nodeExpandedToggled.emit({ nodeId: evt.node.id }));
    this.treeFilter.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(filterTerm => this.filterChanged.emit(filterTerm));
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
    ApplicationFolderNodeNameComponent.openDialog$(this.dialog)
      .pipe(take(1))
      .subscribe((title: string | null | undefined) => {
        if (title) {
          this.addSubFolder.emit({ nodeId, title });
        }
      });
  }

  public onRenameSubFolder($event: { nodeId: string; title: string }) {
    ApplicationFolderNodeNameComponent.openDialog$(this.dialog, $event.title)
      .pipe(take(1))
      .subscribe((title: string | null | undefined) => {
        if (title) {
          this.renameFolder.emit({ nodeId: $event.nodeId, title });
        }
      });
  }

  public onDeleteNode(nodeId: string) {
    this.removeNode.emit({ nodeId });
  }

  public getDropZones() {
    return DropZoneHelper.getDefaultDropZones(this.treeService);
  }

  public expandCollapseAll(someExpanded: boolean | undefined | null) {
    this.nodeExpandedToggled.emit({ expandCollapseAll: someExpanded ? 'collapse' : 'expand' });
  }

}
