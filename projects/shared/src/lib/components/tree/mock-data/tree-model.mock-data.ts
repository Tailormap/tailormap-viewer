import { TreeModel } from '../models';

export const getTreeModelMock = (overrides?: Partial<TreeModel>): TreeModel => ({
  id: '1',
  label: 'Item 1',
  type: 'test',
  children: undefined,
  metadata: undefined,
  checked: false,
  expanded: false,
  ...overrides,
});
