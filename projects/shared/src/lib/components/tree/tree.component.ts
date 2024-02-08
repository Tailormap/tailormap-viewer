import {
  ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit, Optional, TemplateRef, ViewChild,
} from '@angular/core';
import { TreeService } from './tree.service';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FlatTreeHelper } from './helpers/flat-tree.helper';
import { FlatTreeModel } from './models';
import { distinctUntilChanged, filter, Subject, take } from 'rxjs';
import { DropZoneOptions, TreeDragDropService, treeNodeBaseClass } from './tree-drag-drop.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'tm-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
})
export class TreeComponent implements OnInit, OnDestroy {

  @Input()
  public treeNodeTemplate?: TemplateRef<any>;

  @Input()
  public getDropZones?: (defaultTarget: HTMLElement, node?: FlatTreeModel) => DropZoneOptions[];

  @Input()
  public scrollToSelectedItem?: boolean;

  @Input()
  public useRadioInputs?: boolean;

  @Input()
  public expandOnGroupClick?: boolean;

  @ViewChild('treeElement', { static: false, read: CdkVirtualScrollViewport })
  private treeElement: CdkVirtualScrollViewport | undefined;

  public selectedNodeId: string | undefined;

  public treeDragDropServiceEnabled = false;

  public readOnlyMode = false;

  private checkedRadioNode: FlatTreeModel | undefined;

  private destroyed = new Subject();

  constructor(
    private treeService: TreeService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Optional() private treeDragDropService: TreeDragDropService,
  ) { }

  public ngOnInit(): void {
    this.treeService.selectedNode$
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged(),
      )
      .subscribe(selectedNodeId => {
        this.selectedNodeId = selectedNodeId;
        this.cdr.detectChanges();
      });
    this.treeService.readonlyMode$
      .pipe(takeUntil(this.destroyed))
      .subscribe(readOnlyMode => {
        this.readOnlyMode = readOnlyMode;
        this.treeDragDropServiceEnabled = false;
      });
    if (this.treeDragDropService) {
      this.treeDragDropService.treeDragDropEnabled$
        .pipe(takeUntil(this.destroyed))
        .subscribe(enabled => this.treeDragDropServiceEnabled = enabled);
      this.treeService.getTreeDataSource$()
        .pipe(takeUntil(this.destroyed), filter(dataSource => !!dataSource && dataSource.length > 0))
        .subscribe(() => {
          const el = this.treeElement?.elementRef.nativeElement;
          if (!el || !this.getDropZones) {
            return;
          }
          this.treeDragDropService.dataSourceChanged(this.getDropZones(el));
        });
    }
    if (this.scrollToSelectedItem) {
      this.treeService.getTreeDataSource$()
        .pipe(
          filter(dataSource => !!dataSource && dataSource.length > 0),
          debounceTime(50),
          take(1),
        )
        .subscribe(dataSource => {
          this.scrollIntoView(dataSource);
        });
    }
  }

  public getDataSource() {
    return this.treeService.getTreeDataSource$();
  }

  public hasChild(nodeData: FlatTreeModel) {
    return FlatTreeHelper.isExpandable(nodeData);
  }

  public isExpanded(node: FlatTreeModel) {
    return node.expanded;
  }

  public toggleGroupChecked(node: FlatTreeModel): void {
    if (this.readOnlyMode) {
      return;
    }
    this.toggleNodeChecked(node, this.treeService.getDescendants(node));
  }

  public toggleLeafChecked(node: FlatTreeModel): void {
    if (this.readOnlyMode) {
      return;
    }
    this.toggleNodeChecked(node);
  }

  public setNodeSelected(node: FlatTreeModel) {
    this.treeService.selectionStateChanged(node);
    if (this.useRadioInputs && !FlatTreeHelper.isExpandable(node)) {
      this.handleRadioChange(node);
    }
    if (this.expandOnGroupClick && FlatTreeHelper.isExpandable(node)) {
      this.treeService.toggleNodeExpanded(node);
    }
  }

  public toggleNodeExpansion($event: MouseEvent, node: FlatTreeModel) {
    $event.stopPropagation();
    this.treeService.toggleNodeExpanded(node);
  }

  public getNodeClassName(node: FlatTreeModel) {
    const cls = [
      treeNodeBaseClass,
      FlatTreeHelper.isExpandable(node) ? `${treeNodeBaseClass}--folder` : `${treeNodeBaseClass}--leaf`,
      `${treeNodeBaseClass}--level-${FlatTreeHelper.getLevel(node)}`,
      `${treeNodeBaseClass}--${!node.checkbox ? 'no-' : ''}checkbox`,
    ];
    return cls.join(' ');
  }

  public isIndeterminate(node: FlatTreeModel) {
    return this.treeService.isIndeterminate(node);
  }

  public isChecked(node: FlatTreeModel) {
    return this.treeService.isChecked(node);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private toggleNodeChecked(node: FlatTreeModel, descendants?: FlatTreeModel[]) {
    const stateChange: FlatTreeModel[] = [];
    const checked = descendants ? !this.treeService.descendantsAllSelected(node) : !this.treeService.isChecked(node);
    stateChange.push({ ...node, checked });
    if (descendants) {
      stateChange.push(...descendants.map(d => ({ ...d, checked })));
    }
    this.treeService.checkStateChanged(stateChange);
  }

  public handleDragStart(event: DragEvent, node: FlatTreeModel) {
    if (!this.treeDragDropService || !this.getDropZones || !this.treeElement) {
      event.preventDefault();
      return;
    }
    const dropZoneConfig = this.getDropZones(this.treeElement.elementRef.nativeElement, node);
    const dragAllowed = dropZoneConfig.some(dz => dz.dragAllowed ? dz.dragAllowed(node.id) : true);
    if (!dragAllowed) {
      event.preventDefault();
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.treeDragDropService.handleDragStart(event, node, dropZoneConfig);
    });
  }

  public handleRadioChange(node: FlatTreeModel) {
    const checkChange: FlatTreeModel[] = [];
    if (this.checkedRadioNode) {
      checkChange.push({ ...this.checkedRadioNode, checked: false });
    }
    checkChange.push({ ...node, checked: true });
    this.treeService.checkStateChanged(checkChange);
    this.checkedRadioNode = node;
  }

  public enableDrag($event: MouseEvent | TouchEvent) {
    if (!$event.target || !this.treeDragDropServiceEnabled) {
      return;
    }
    ($event.target as HTMLElement).closest(`.${treeNodeBaseClass}`)?.setAttribute('draggable', 'true');
  }

  public stopDrag($event: MouseEvent | TouchEvent) {
    if (!$event.target) {
      return;
    }
    ($event.target as HTMLElement).closest(`.${treeNodeBaseClass}`)?.setAttribute('draggable', 'false');
  }

  public treeTrackBy(idx: number, node: FlatTreeModel) {
    return node.id;
  }

  private scrollIntoView(treeModels: FlatTreeModel[]) {
    const idx = treeModels.findIndex(n => n.id === this.selectedNodeId);
    this.treeElement?.scrollToIndex(idx, 'smooth');
  }

  public depth(node: FlatTreeModel) {
    return node.level;
  }
}
