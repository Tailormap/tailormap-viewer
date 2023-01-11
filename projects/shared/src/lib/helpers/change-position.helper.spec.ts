import { ChangePositionHelper } from './change-position.helper';

describe('ChangePositionHelper', () => {

  test('should update order in list', () => {
    const list = [ 'a', 'b', 'c' ];
    const movedNode = 'd';
    const position = 'before';
    const sibling = 'b';
    const updatedList = ChangePositionHelper.updateOrderInList(list, movedNode, position, sibling);
    expect(updatedList).toEqual([ 'a', 'd', 'b', 'c' ]);
  });

  test('should update order in list - after node', () => {
    const list = [ 'a', 'b', 'c' ];
    const movedNode = 'd';
    const position = 'after';
    const sibling = 'b';
    const updatedList = ChangePositionHelper.updateOrderInList(list, movedNode, position, sibling);
    expect(updatedList).toEqual([ 'a', 'b', 'd', 'c' ]);
  });

  test('should update order in list - inside', () => {
    const list = [ 'a', 'b', 'c' ];
    const movedNode = 'd';
    const position = 'inside';
    const sibling = undefined;
    const updatedList = ChangePositionHelper.updateOrderInList(list, movedNode, position, sibling);
    expect(updatedList).toEqual([ 'a', 'b', 'c', 'd' ]);
  });

  test('should update order in list - existing node in list', () => {
    const list = [ 'a', 'b', 'c' ];
    const movedNode = 'c';
    const position = 'before';
    const sibling = 'a';
    const updatedList = ChangePositionHelper.updateOrderInList(list, movedNode, position, sibling);
    expect(updatedList).toEqual([ 'c', 'a', 'b' ]);
  });

});
