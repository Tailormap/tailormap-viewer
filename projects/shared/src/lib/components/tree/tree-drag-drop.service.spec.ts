import { FlatTreeModel } from './models';
import { TreeDragDropService } from './tree-drag-drop.service';

describe('Tree Drag Drop Service', () => {

  const service = new TreeDragDropService();

  const createTreeNode = (id: number) => {
    const node = document.createElement('div');
    node.className = 'tree-node-wrapper';
    node.style.height = '10px';
    node.style.top = ((id - 1) * 10) + 'px';
    node.setAttribute('data-nodeid', 'node-' + id);
    return node;
  };

  const createNodes = (id: number): FlatTreeModel => {
    return {
      id: 'node-' + id,
      checkbox: true,
      checked: true,
      expandable: false,
      expanded: false,
      label: 'Item ' + id,
      level: 0,
    };
  };

  const treeEl: HTMLDivElement = document.createElement('div');
  const treeWrapper: HTMLDivElement = document.createElement('div');
  let treeNode1: HTMLDivElement;
  let treeNode2: HTMLDivElement;
  let treeNode3: HTMLDivElement;
  let treeNode4: HTMLDivElement;
  let dataNodes: FlatTreeModel[];

  beforeAll(() => {
    treeWrapper.className = 'tree-wrapper';
    treeWrapper.style.height = '50px';
    treeWrapper.appendChild(treeEl);
    treeNode1 = createTreeNode(1);
    treeEl.appendChild(treeNode1);
    treeNode2 = createTreeNode(2);
    treeEl.appendChild(treeNode2);
    treeNode3 = createTreeNode(3);
    treeEl.appendChild(treeNode3);
    treeNode4 = createTreeNode(4);
    treeEl.appendChild(treeNode4);
    dataNodes = [
      createNodes(1),
      createNodes(2),
      createNodes(3),
      createNodes(4),
    ];
  });

  it ('handles drag drop', () => {
    const positionChangedFn = vi.fn();
    const dragStartEvent = new Event('dragstart') as DragEvent;
    service.handleDragStart(dragStartEvent, dataNodes[0], [{
      getTargetElement: (): HTMLDivElement => {
        return treeEl;
      },
      dropInsideAllowed: (_id: string): boolean => {
        return false;
      },
      expandNode: (_id: string) => {
        return null;
      },
      dropAllowed: (id: string): boolean => {
        return dataNodes.findIndex(d => d.id === id) !== -1;
      },
      getParent: (_id: string): string | null => {
        return null;
      },
      isExpandable: (_id: string): boolean => {
        return false;
      },
      isExpanded: (_id: string): boolean => {
        return false;
      },
      nodePositionChanged: positionChangedFn,
    }]);
    treeWrapper.dispatchEvent(new Event('dragover', {
      // @ts-expect-error property does exist on a drag event
      clientY: 0,
    }));
    expect(treeEl.classList).toContain('mat-tree--drag-active');
    treeNode2.dispatchEvent(new Event('dragover', {
      // @ts-expect-error property does exist on a drag event
      clientY: 0,
    }));
    treeNode2.dispatchEvent(new Event('dragleave'));
    treeNode3.dispatchEvent(new Event('dragover', {
      // @ts-expect-error property does exist on a drag event
      clientY: 20,
    }));
    treeNode3.dispatchEvent(new Event('drop'));
    expect(positionChangedFn).toHaveBeenCalledTimes(1);
    expect(positionChangedFn).toHaveBeenCalledWith(
      {
        nodeId: 'node-1',
        toParent: null,
        fromParent: null,
        position: 'inside',
        sibling: 'node-3',
      },
    );
    expect(treeEl.classList).not.toContain('mat-tree--drag-active');
  });

});
