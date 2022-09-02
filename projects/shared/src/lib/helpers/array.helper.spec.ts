import { ArrayHelper } from './array.helper';

describe('ArrayHelper', () => {

  test('arrayEquals', () => {
    expect(ArrayHelper.arrayEquals([], [])).toEqual(true);
    expect(ArrayHelper.arrayEquals(['a'], ['a'])).toEqual(true);
    expect(ArrayHelper.arrayEquals(['a'], [ 'a', 'b' ])).toEqual(false);
    expect(ArrayHelper.arrayEquals(['a'], 'a' as any)).toEqual(false);
  });

  test('getArraySorter', () => {
    const source = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const order = [ 'b', 'c', 'a' ];
    const sorted = source.sort(ArrayHelper.getArraySorter('id', order));
    expect(sorted).toMatchObject([{ id: 'b' }, { id: 'c' }, { id: 'a' }]);
  });

});
