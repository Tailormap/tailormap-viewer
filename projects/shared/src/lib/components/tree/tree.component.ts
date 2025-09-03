import {
  ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit, TemplateRef, inject, HostListener, ElementRef, viewChild, effect,
  AfterViewChecked,
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
  standalone: false,
})
export class TreeComponent implements OnInit, OnDestroy, AfterViewChecked {
  private treeService = inject(TreeService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private treeDragDropService = inject(TreeDragDropService, { optional: true });

  @HostListener('window:resize', ['$event'])
  public onResize() {
    this.updateDropzoneHeight();
  }

  @Input()
  public treeNodeTemplate?: TemplateRef<any>;

  @Input()
  public hideRootCollapseArrow = false;

  @Input()
  public getDropZones?: (defaultTarget: HTMLElement, node?: FlatTreeModel) => DropZoneOptions[];

  @Input()
  public set scrollToItem(scrollToItem: string | undefined | null) {
    if (!scrollToItem) {
      return;
    }
    this.treeService.getTreeDataSource$()
      .pipe(
        filter(dataSource => !!dataSource && dataSource.length > 0),
        debounceTime(50),
        take(1),
      )
      .subscribe(dataSource => {
        const idx = dataSource.findIndex(n => n.id === scrollToItem);
        this.treeElement()?.scrollToIndex(idx, 'smooth');
      });
  }

  @Input()
  public useRadioInputs?: boolean;

  @Input()
  public expandOnGroupClick?: boolean;

  @Input()
  public dragHandleSelector?: string;

  @Input()
  public extendedDropzone?: boolean;

  private treeElement = viewChild('treeElement', { read: CdkVirtualScrollViewport });

  private extendedDropzoneEl = viewChild('extendedDropzone', { read: ElementRef });

  public selectedNodeId: string | undefined;

  public treeDragDropServiceEnabled = false;

  public readOnlyMode = false;

  private checkedRadioNode: FlatTreeModel | undefined;

  private destroyed = new Subject();

  public extendedDropzoneClass: string = TreeDragDropService.EXTENDED_DROPZONE_CLASS;

  public dataSource$ = this.treeService.getTreeDataSource$();

  private prevTreeHeight = 0;

  constructor() {
    effect(() => {
      const treeElement = this.treeElement();
      if (treeElement) {
        this.updateDropzoneHeight();
      }
    });
  }

  public ngAfterViewChecked(): void {
    const treeHeight = this.treeElement()?.elementRef.nativeElement.offsetHeight || 0;
    if (this.prevTreeHeight !== treeHeight) {
      // Keep previous height to avoid calling checkViewportSize too often
      this.prevTreeHeight = treeHeight;
      this.treeElement()?.checkViewportSize();
    }
  }

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
          const el = this.treeElement()?.elementRef.nativeElement;
          this.updateDropzoneHeight();
          if (!el || !this.getDropZones) {
            return;
          }
          this.treeDragDropService?.dataSourceChanged(this.getDropZones(el));
        });
    }
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
    if (node.className) {
      cls.push(node.className);
    }
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
    const treeElement = this.treeElement();
    if (!this.treeDragDropService || !this.getDropZones || !treeElement) {
      event.preventDefault();
      return;
    }
    const dropZoneConfig = this.getDropZones(treeElement.elementRef.nativeElement, node);
    const dragAllowed = dropZoneConfig.some(dz => dz.dragAllowed ? dz.dragAllowed(node.id) : true);
    if (!dragAllowed) {
      event.preventDefault();
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.treeDragDropService?.handleDragStart(event, node, dropZoneConfig);
    });
  }

  public handleRadioChange(node: FlatTreeModel, $event: MouseEvent) {
    $event.stopPropagation();
    const checkChange: FlatTreeModel[] = [];
    if (this.checkedRadioNode) {
      checkChange.push({ ...this.checkedRadioNode, checked: false });
    }
    checkChange.push({ ...node, checked: !node.checked });

    this.treeService.checkStateChanged(checkChange);
    this.checkedRadioNode = node;
  }

  public enableDrag($event: MouseEvent | TouchEvent) {
    if (!$event.target || !this.treeDragDropServiceEnabled) {
      return;
    }
    const treeNode = ($event.target as HTMLElement).closest(`.${treeNodeBaseClass}`);
    if (this.dragHandleSelector && treeNode) {
      const dragHandle = ($event.target as HTMLElement).closest(this.dragHandleSelector);
      if (!dragHandle || !treeNode.contains(dragHandle)) {
        return;
      }
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

  public depth(node: FlatTreeModel) {
    return node.level;
  }

  private updateDropzoneHeight() {
    setTimeout(() => {
      const dropzoneEl = this.extendedDropzoneEl();
      const treeElement = this.treeElement();
      if (!dropzoneEl || !treeElement) {
        return;
      }
      const viewportHeight = treeElement.elementRef.nativeElement.offsetHeight;
      const contentHeight = treeElement.measureRenderedContentSize();
      const dropzoneHeight = Math.max(0, viewportHeight - contentHeight);
      dropzoneEl.nativeElement.style.height = `${dropzoneHeight}px`;
    }, 100);
  }

}
