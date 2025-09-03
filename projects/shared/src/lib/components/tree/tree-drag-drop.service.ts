import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlatTreeModel, NodePositionChangedEventModel } from './models';
import { BrowserHelper } from '../../helpers';

export const treeNodeBaseClass = 'tree-node-wrapper';

type DragDropEventHandler = (e: DragEvent) => void;
type MouseEventHandler = (e: MouseEvent) => void;

export interface DropZoneOptions {
  dropInsideOnly?: boolean;
  getTargetElement(): HTMLElement | null;
  dragAllowed?(nodeid: string): boolean;
  dropAllowed(nodeid: string): boolean;
  dropInsideAllowed(nodeid: string): boolean;
  isExpandable(nodeid: string): boolean;
  isExpanded(nodeid: string): boolean;
  expandNode(nodeid: string): void;
  getParent(nodeid: string): string | null;
  nodePositionChanged(evt: NodePositionChangedEventModel): void;
  getExtendedDropzoneElement?(): HTMLElement | null;
  getRootNodeId?(): string | null;
}

@Injectable()
export class TreeDragDropService implements OnDestroy {

  private treeDragDropEnabled = new BehaviorSubject<boolean>(true);
  public treeDragDropEnabled$ = this.treeDragDropEnabled.asObservable();

  private readonly handleDragOverListener: DragDropEventHandler = e => this.handleDragOver(e);
  private readonly handleDragLeaveListener: DragDropEventHandler = e => this.handleDragLeave(e);
  private readonly handleDropListener: DragDropEventHandler = e => this.handleDrop(e);
  private readonly handleDragEndListener = () => this.handleDragEnd();
  private readonly handleMouseMoveListener: MouseEventHandler = e => this.handleMouseMove(e);

  private dragNode: FlatTreeModel | null = null;
  private dragNodeExpandOverWaitTimeMs = 300;
  private dragOverNodeId: string | null = null;
  private dragNodeExpandOverTime: number | null = null;
  private dragNodePosition: 'before' | 'after' | 'inside' = 'after';

  private beforeCls = `${treeNodeBaseClass}--drop-before`;
  private afterCls = `${treeNodeBaseClass}--drop-after`;
  private insideCls = `${treeNodeBaseClass}--drop-inside`;
  private lastOffsetY: number | null = null;

  public static readonly EXTENDED_DROPZONE_CLASS = "extended-dropzone";

  private dropZones: DropZoneOptions[] = [];

  private static getDragTarget(e: DragEvent): HTMLElement | null {
    if (!e.target) {
      return null;
    }
    return (e.target as HTMLElement).closest(`.${treeNodeBaseClass}`)
      || (e.target as HTMLElement).closest(`.${TreeDragDropService.EXTENDED_DROPZONE_CLASS}`);
  }

  private static getNodeId(treeNode: HTMLElement): string {
    return treeNode.getAttribute('data-nodeid') || '';
  }

  private static loopNodes(treeElement: HTMLElement, callback: (treeNode: HTMLElement) => void) {
    const nodes = treeElement.querySelectorAll(`.${treeNodeBaseClass}`);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < nodes.length; i++) {
      callback(nodes[i] as HTMLElement);
    }
  }

  public ngOnDestroy(): void {
    this.handleDragEnd();
  }

  public setDragDropEnabled(enable: boolean) {
    this.treeDragDropEnabled.next(enable);
  }

  public handleDragStart(event: DragEvent, dragNode: FlatTreeModel, dropZones: DropZoneOptions[]) {
    this.dropZones = dropZones;
    this.dragNode = dragNode;

    if (event.dataTransfer) {
      if (dropZones.length > 0 && event.dataTransfer.setDragImage) {
        const dragImage = document.createElement('div');
        dragImage.classList.add('tree-node__drag-image');
        dragImage.innerText = dragNode.label;
        dropZones[0].getTargetElement()?.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 0, BrowserHelper.isTouchDevice ? 75 : 25);
      }
      event.dataTransfer.setData('text/plain', dragNode.label);
      event.dataTransfer.effectAllowed = 'move';
    }

    this.dragOverNodeId = null;
    this.dragNodeExpandOverTime = 0;
    this.lastOffsetY = null;

    const dragEnd = () => {
      this.handleDragEnd();
      event.target?.removeEventListener('dragend', dragEnd);
    };
    event.target?.addEventListener('dragend', dragEnd);
    dropZones.forEach(dz => this.initDropZone(dz));
  }

  public dataSourceChanged(dropZones: DropZoneOptions[]) {
    dropZones.forEach(dropZone => {
      const treeElement = dropZone.getTargetElement();
      if (!treeElement || !treeElement.classList.contains(`mat-tree--drag-active`)) {
        return;
      }
      this.attachEventListenersToNodes(treeElement);
    });
  }

  private initDropZone(dropZone: DropZoneOptions) {
    const treeElement = dropZone.getTargetElement();
    if (!treeElement) {
      return;
    }
    const scrollContainer = treeElement.closest('.tree-wrapper') as HTMLElement;
    treeElement.classList.add(`mat-tree--drag-active`);
    scrollContainer.addEventListener('dragover', this.handleMouseMove);
    this.attachEventListenersToNodes(treeElement);
    if (dropZone.getExtendedDropzoneElement) {
      const extendedElement = dropZone.getExtendedDropzoneElement();
      if (extendedElement) {
        this.addEventListenersToElement(extendedElement);
      }
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    const scrollContainer = e.currentTarget as HTMLElement;
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    const offsetY = e.clientY - scrollContainerRect.top;
    const percentageY = offsetY / scrollContainerRect.height;
    if (percentageY <= .2 && scrollContainer.scrollTop !== 0) {
      scrollContainer.scrollTop -= 5;
    } else if (percentageY >= .8
      && Math.ceil(scrollContainer.scrollHeight - scrollContainer.scrollTop) > Math.ceil(scrollContainerRect.height)) {
      scrollContainer.scrollTop += 5;
    }
  };

  private handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    const element = TreeDragDropService.getDragTarget(e);
    if (!element || !this.dragNode) {
      return;
    }
    const nodeId = TreeDragDropService.getNodeId(element);
    const dropZone = this.dropZones.find(dz => dz.dropAllowed(nodeId)
      || (dz.getExtendedDropzoneElement && element === dz.getExtendedDropzoneElement()));
    if (!dropZone) {
      return;
    }

    if (nodeId !== this.dragOverNodeId) {
      if (this.dragNodeExpandOverTime) {
        window.clearTimeout(this.dragNodeExpandOverTime);
      }
      const shouldExpand = this.dragNode.id !== nodeId && dropZone.isExpandable(nodeId) && !dropZone.isExpanded(nodeId);
      if (shouldExpand) {
        this.dragNodeExpandOverTime = window.setTimeout(() => {
          dropZone.expandNode(nodeId);
        }, this.dragNodeExpandOverWaitTimeMs);
      }

      this.dragOverNodeId = nodeId;
    }

    const clientY = e.clientY;
    const offsetY = clientY - element.getBoundingClientRect().top;
    if (offsetY === this.lastOffsetY) {
      return;
    }
    this.lastOffsetY = offsetY;
    const percentageY = offsetY / element.offsetHeight;
    if ((dropZone.dropInsideOnly && dropZone.dropInsideAllowed(nodeId))
      || element.classList.contains(TreeDragDropService.EXTENDED_DROPZONE_CLASS)) {
      this.dragNodePosition = 'inside';
    } else {
      const beforePercentage = dropZone.dropInsideAllowed(nodeId) ? 0.25 : 0.5;
      const afterPercentage = dropZone.dropInsideAllowed(nodeId) ? 0.75 : 0.5;
      if (percentageY < beforePercentage) {
        this.dragNodePosition = 'before';
      } else if (percentageY >= afterPercentage) {
        this.dragNodePosition = 'after';
      } else {
        this.dragNodePosition = 'inside';
      }
    }

    const hasDropBeforeCls = element.classList.contains(this.beforeCls);
    const hasDropAfterCls = element.classList.contains(this.afterCls);
    const hasDropInsideCls = element.classList.contains(this.insideCls);
    const removeCls = [];
    if (hasDropBeforeCls && this.dragNodePosition !== 'before') {
      removeCls.push(this.beforeCls);
    }
    if (hasDropAfterCls && this.dragNodePosition !== 'after') {
      removeCls.push(this.afterCls);
    }
    if (hasDropInsideCls && this.dragNodePosition !== 'inside') {
      removeCls.push(this.insideCls);
    }
    if (!hasDropBeforeCls && this.dragNodePosition === 'before') {
      element.classList.add(this.beforeCls);
    }
    if (!hasDropAfterCls && this.dragNodePosition === 'after') {
      element.classList.add(this.afterCls);
    }
    if (!hasDropInsideCls && this.dragNodePosition === 'inside') {
      element.classList.add(this.insideCls);
    }
    removeCls.forEach(c => element.classList.remove(c));
  };

  private handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const element = TreeDragDropService.getDragTarget(e);
    if (!element || !this.dragNode) {
      return;
    }
    const nodeId = TreeDragDropService.getNodeId(element);
    const dropZone = this.dropZones.find(dz => dz.dropAllowed(nodeId)
      || (dz.getExtendedDropzoneElement && element === dz.getExtendedDropzoneElement()));
    if (!dropZone) {
      return;
    }



    if (nodeId !== this.dragNode.id) {
      const insideExpandableNode = this.dragNodePosition === 'inside' && dropZone.isExpandable(nodeId);
      let parent = insideExpandableNode ? nodeId : dropZone.getParent(nodeId);
      let sibling = nodeId;
      if (element.className.includes(TreeDragDropService.EXTENDED_DROPZONE_CLASS)) {
        parent = dropZone.getRootNodeId ? dropZone.getRootNodeId() : null;
        sibling = dropZone.getRootNodeId ? dropZone.getRootNodeId() ?? '' : '';
      }
      const prevParent = dropZone.getParent(this.dragNode.id);
      const eventData = {
        nodeId: this.dragNode.id,
        toParent: parent ? parent : null,
        fromParent: prevParent ? prevParent : null,
        position: this.dragNodePosition,
        sibling: sibling,
      };
      dropZone.nodePositionChanged(eventData);
    }
    this.handleDragEnd();
  };

  private handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    const element = TreeDragDropService.getDragTarget(e);
    if (!element) {
      return;
    }
    element.classList.remove(this.beforeCls);
    element.classList.remove(this.afterCls);
    element.classList.remove(this.insideCls);
  };

  private handleDragEnd = () => {
    if (!this.dropZones) {
      return;
    }
    this.dropZones.forEach(dropZone => {
      const treeElement = dropZone.getTargetElement();
      if (!treeElement) {
        return;
      }
      treeElement.classList.remove(`mat-tree--drag-active`);
      treeElement.querySelector('.tree-node__drag-image')?.remove();
      const scrollContainer = treeElement.closest('.tree-wrapper') as HTMLElement;
      scrollContainer.removeEventListener('dragover', this.handleMouseMoveListener);
      this.removeEventListenersFromNodes(treeElement);
      if (dropZone.getExtendedDropzoneElement) {
        const extendedElement = dropZone.getExtendedDropzoneElement();
        if (extendedElement) {
          this.removeEventListenersFromElement(extendedElement);
        }
      }
    });
  };

  private attachEventListenersToNodes(treeElement: HTMLElement) {
    TreeDragDropService.loopNodes(treeElement, treeNode => {
      this.addEventListenersToElement(treeNode);
    });
  }

  private removeEventListenersFromNodes(treeElement: HTMLElement) {
    TreeDragDropService.loopNodes(treeElement, treeNode => {
      this.removeEventListenersFromElement(treeNode);
    });
  }

  private addEventListenersToElement(element: HTMLElement) {
    if (element.hasAttribute('tree-listener-added')) {
      return;
    }
    element.setAttribute('tree-listener-added', 'true');
    element.addEventListener('dragover', this.handleDragOverListener);
    element.addEventListener('dragleave', this.handleDragLeaveListener);
    element.addEventListener('dragend', this.handleDragEndListener);
    element.addEventListener('drop', this.handleDropListener);
  }

  private removeEventListenersFromElement(element: HTMLElement) {
    element.removeEventListener('dragover', this.handleDragOverListener);
    element.removeEventListener('dragleave', this.handleDragLeaveListener);
    element.removeEventListener('dragend', this.handleDragEndListener);
    element.removeEventListener('drop', this.handleDropListener);
    element.classList.remove(this.beforeCls);
    element.classList.remove(this.afterCls);
    element.classList.remove(this.insideCls);
    element.removeAttribute('tree-listener-added');
  }

}
