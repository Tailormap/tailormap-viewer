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
      .subscribe(node => {
        treeData.next(treeData.value.map(n => expandNodes(n, node)));
      });
    treeService.setDataSource(treeData.asObservable());

    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.queryByText('Item 2 - 1')).toBeNull();

    await userEvent.click(await screen.findByRole('button', { name: 'toggle Item 2' }));
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 1')).toBeInTheDocument();
    expect(await screen.queryByText('Item 2 - 2 - 1')).toBeNull();

    await userEvent.click(await screen.findByRole('button', { name: 'toggle Item 2 - 2' }));
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 1')).toBeInTheDocument();
    expect(await screen.findByText('Item 2 - 2 - 1')).toBeInTheDocument();
  });

});
