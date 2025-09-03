import { TreeDragDropService } from './tree-drag-drop.service';
import { TreeService } from './tree.service';
import { render, screen } from '@testing-library/angular';
import { TreeComponent } from './tree.component';
import { BehaviorSubject } from 'rxjs';
import { BaseTreeModel, TreeModel } from './models';
import userEvent from '@testing-library/user-event';
import { getTreeModelMock } from './mock-data/tree-model.mock-data';
import { SharedImportsModule } from '../../shared-imports.module';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

const getTree = () => [
  getTreeModelMock(),
  getTreeModelMock({
    id: '2',
    label: 'Item 2',
    children: [
      getTreeModelMock({ id: '2_1', label: 'Item 2 - 1' }),
      getTreeModelMock({
        id: '2_2',
        label: 'Item 2 - 2',
        children: [
          getTreeModelMock({ id: '2_2_1', label: 'Item 2 - 2 - 1' }),
          getTreeModelMock({ id: '2_2_2', label: 'Item 2 - 2 - 2' }),
        ],
      }),
      getTreeModelMock({ id: '2_2', label: 'Item 2 - 2' }),
    ],
  }),
  getTreeModelMock({ id: '3', label: 'Item 3' }),
];

describe('TreeComponent', () => {

  test('renders tree', async () => {
    const ngZoneRunMock = jest.fn((cb: () => void) => cb());
    const ngZoneOutsideMock = jest.fn();
    const treeService = new TreeService();
    const { fixture } = await render(TreeComponent, {
      providers: [
        { provide: TreeService, useValue: treeService },
        { provide: TreeDragDropService, useValue: undefined },
      ],
      imports: [
        SharedImportsModule,
        MatIconTestingModule,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
      ],
    });
    expect(fixture.componentInstance).toBeTruthy();

    // setup service
    const tree = getTree();
    const treeData = new BehaviorSubject<TreeModel[]>(tree);
    // catch expand
    const expandNodes = (n: TreeModel, node: BaseTreeModel): TreeModel => {
      if (n.id === node.id) {
        return { ...n, expanded: !n.expanded };
      }
      if (typeof n.children !== 'undefined') {
        return { ...n, children: n.children.map(c => expandNodes(c, node) ) };
      }
      return n;
    };
    treeService.nodeExpansionChangedSource$
      .subscribe(({ node }) => {
        treeData.next(treeData.value.map(n => expandNodes(n, node)));
      });
    treeService.setDataSource(treeData.asObservable());

    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.queryByText('Item 2 - 1')).toBeNull();

    await userEvent.click(await screen.findByRole('button', { name: 'expand Item 2' }));
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 1')).toBeInTheDocument();
    expect(await screen.queryByText('Item 2 - 2 - 1')).toBeNull();

    await userEvent.click(await screen.findByRole('button', { name: 'expand Item 2 - 2' }));
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 2 - 1')).toBeInTheDocument();
  });

  test('initializes viewport size observer and cleans up properly', async () => {
    // Mock ResizeObserver
    const mockObserve = jest.fn();
    const mockDisconnect = jest.fn();
    const mockResizeObserver = jest.fn(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
    }));
    (global as any).ResizeObserver = mockResizeObserver;

    const treeService = new TreeService();
    const { fixture } = await render(TreeComponent, {
      providers: [
        { provide: TreeService, useValue: treeService },
        { provide: TreeDragDropService, useValue: undefined },
      ],
      imports: [
        SharedImportsModule,
        MatIconTestingModule,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
      ],
    });

    const component = fixture.componentInstance;
    const tree = getTree();
    const treeData = new BehaviorSubject<TreeModel[]>(tree);
    treeService.setDataSource(treeData.asObservable());

    // Allow Angular to initialize the component
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify ResizeObserver was created and observe was called
    expect(mockResizeObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalled();

    // Destroy component and verify cleanup
    fixture.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  test('only calls checkViewportSize when size actually changes', async () => {
    let resizeCallback: (entries: any[]) => void;
    const mockObserve = jest.fn();
    const mockDisconnect = jest.fn();
    const mockResizeObserver = jest.fn((callback) => {
      resizeCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    });
    (global as any).ResizeObserver = mockResizeObserver;

    const treeService = new TreeService();
    const { fixture } = await render(TreeComponent, {
      providers: [
        { provide: TreeService, useValue: treeService },
        { provide: TreeDragDropService, useValue: undefined },
      ],
      imports: [
        SharedImportsModule,
        MatIconTestingModule,
        CdkVirtualScrollViewport,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
      ],
    });

    const component = fixture.componentInstance;
    const tree = getTree();
    const treeData = new BehaviorSubject<TreeModel[]>(tree);
    treeService.setDataSource(treeData.asObservable());

    fixture.detectChanges();
    await fixture.whenStable();

    // Mock the treeElement and its checkViewportSize method
    const mockCheckViewportSize = jest.fn();
    const mockTreeElement = {
      checkViewportSize: mockCheckViewportSize,
      elementRef: { nativeElement: document.createElement('div') },
    };
    jest.spyOn(component, 'treeElement').mockReturnValue(mockTreeElement as any);

    // Simulate ResizeObserver callback with size change
    const mockEntry = {
      contentRect: { width: 100, height: 200 },
    };
    resizeCallback([mockEntry]);

    // Wait for debounce timeout
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockCheckViewportSize).toHaveBeenCalledTimes(1);

    // Simulate same size change - should not call checkViewportSize
    resizeCallback([mockEntry]);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockCheckViewportSize).toHaveBeenCalledTimes(1); // Still only 1 call

    // Simulate different size change - should call checkViewportSize
    const mockEntry2 = {
      contentRect: { width: 150, height: 250 },
    };
    resizeCallback([mockEntry2]);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockCheckViewportSize).toHaveBeenCalledTimes(2); // Now 2 calls
  });

});
