import { Component, ElementRef, Input, NgZone, OnDestroy, Optional, TemplateRef, ViewChild } from '@angular/core';
import { TreeService } from './tree.service';
import { takeUntil } from 'rxjs/operators';
import { FlatTreeHelper } from './helpers/flat-tree.helper';
import { FlatTreeModel } from './models';
import { Subject } from 'rxjs';
import { DropZoneOptions, TreeDragDropService, treeNodeBaseClass } from './tree-drag-drop.service';

@Component({
  selector: 'tm-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
})
export class TreeComponent implements OnDestroy {

  @Input()
  public treeNodeTemplate?: TemplateRef<any>;

  @Input()
  public additionalDropZones?: DropZoneOptions[];

  @Input()
  public useRadioInputs?: boolean;

  @Input()
  public expandOnGroupClick?: boolean;

  @ViewChild('treeElement', { static: false, read: ElementRef })
  private treeElement: ElementRef<HTMLDivElement> | undefined;

  public selectedNodeId: string | undefined;

  public treeDragDropServiceEnabled = false;

  public readOnlyMode = false;

  private scrollLeft = 0;

  private checkedRadioNode: FlatTreeModel | undefined;

  private destroyed = new Subject();

  constructor(
    private treeService: TreeService,
    private ngZone: NgZone,
    @Optional() private treeDragDropService: TreeDragDropService,
  ) {
    this.treeService.selectedNode$
      .pipe(takeUntil(this.destroyed))
      .subscribe(selectedNodeId => this.selectedNodeId = selectedNodeId);
    this.treeService.readonlyMode$
      .pipe(takeUntil(this.destroyed))
      .subscribe(readOnlyMode => {
        this.readOnlyMode = readOnlyMode;
        this.treeDragDropServiceEnabled = false;
      });
    if (treeDragDropService) {
      this.treeDragDropService.treeDragDropEnabled$
        .pipe(takeUntil(this.destroyed))
        .subscribe(enabled => this.treeDragDropServiceEnabled = enabled);
    }
    this.checkedRadioNode = this.getTreeControl().dataNodes.find(node => node.checked);
  }

  public getDataSource() {
    return this.treeService.getTreeDataSource();
  }

  public getTreeControl() {
    return this.treeService.getTreeControl();
  }

  public hasChild(idx: number, nodeData: FlatTreeModel) {
    return FlatTreeHelper.isExpandable(nodeData);
  }

  public isExpanded(node: FlatTreeModel) {
    return this.treeService.getTreeControl().isExpanded(node);
  }

  public toggleGroupChecked(node: FlatTreeModel): void {
    if (this.readOnlyMode) {
      return;
    }
    this.toggleNodeChecked(node, this.treeService.getTreeControl().getDescendants(node));
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
    ];
    if (!node.checkbox) {
      cls.push(`${treeNodeBaseClass}--no-checkbox`);
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
    if (!this.treeDragDropService || !this.treeElement) {
      return;
    }
    const dragElement = this.treeElement.nativeElement;
    const dropZoneConfig: DropZoneOptions = {
      getTargetElement: () => dragElement,
      dropAllowed: (nodeId) => this.treeService.hasNode(nodeId),
      dropInsideAllowed: (nodeId) => this.treeService.isExpandable(nodeId),
      isExpandable: (nodeId) => this.treeService.isExpandable(nodeId),
      isExpanded: (nodeId) => this.treeService.isExpanded(nodeId),
      expandNode: (nodeId) => this.treeService.expandNode(nodeId),
      getParent: (nodeId) => this.treeService.getParent(nodeId),
      nodePositionChanged: evt => this.treeService.nodePositionChanged(evt),
    };
    this.ngZone.runOutsideAngular(() => {
      this.treeDragDropService.handleDragStart(event, node, [ dropZoneConfig, ...(this.additionalDropZones || []) ]);
    });
  }

  public handleTreeScroll(currentTarget: EventTarget | null) {
    if (!currentTarget) {
      return;
    }
    const targetIsHTMLElement = (target: EventTarget): target is HTMLElement => !!(target as HTMLElement).nodeName;
    if (targetIsHTMLElement(currentTarget) && this.scrollLeft !== currentTarget.scrollLeft) {
      this.scrollLeft = currentTarget.scrollLeft;
      currentTarget.style.setProperty('--scroll-pos', this.scrollLeft + 'px');
    }
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

}
