import { ReadableVisibilityBookmarkHandlerService } from './readable-visibility-bookmark-handler.service';
import { ExtendedAppLayerModel } from '../../../map/models';

const layers = [
  { id: '1', layerName: 'layer1', service: { title: 'service' } },
  { id: '2', layerName: 'layer2', service: { title: 'service' } },
  { id: '3', layerName: 'layer1', service: { title: 'service2' } },
] as ExtendedAppLayerModel[];

describe('ReadableVisibilityBookmarkHandler', () => {

  const tests: Array<[ string, null | Array<{ id: string; checked: boolean }>, string[] ]> = [
    // bookmark, result, background ids
    [ '', null, []],
    [ 'only=service/layer1', [{ id: '1', checked: true }, { id: '2', checked: false }, { id: '3', checked: false }], []],
    [ 'only=service1/layer1', [{ id: '1', checked: false }, { id: '2', checked: false }, { id: '3', checked: false }], []],
    [ 'only=service/layer1,layer2', [{ id: '1', checked: true }, { id: '2', checked: true }, { id: '3', checked: false }], []],
    [ 'only=service/layer1,layer2;service2/layer1', [{ id: '1', checked: true }, { id: '2', checked: true }, { id: '3', checked: true }], []],
    [ 'only=service/layer1', [{ id: '1', checked: true }, { id: '2', checked: false }], ['3']],
  ];

  test.each(tests)(
    "parses bookmark - %s",
    (bookmark, expectedResult, bgIds) => {
      const result = ReadableVisibilityBookmarkHandlerService.getExclusiveVisibilityChangesForBookmark(bookmark, layers, bgIds);
      if (expectedResult === null) {
        expect(result).toBeNull();
      } else {
        expect(result).toMatchObject(expectedResult);
      }
    },
  );

});
