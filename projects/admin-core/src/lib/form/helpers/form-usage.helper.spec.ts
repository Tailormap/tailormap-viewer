import { describe, test, expect } from 'vitest';
import { AppTreeLayerNodeModel, AppTreeLevelNodeModel, getApplication } from '@tailormap-admin/admin-api';
import { FormUsageHelper } from './form-usage.helper';

const layerNode = (id: string, layerName: string): AppTreeLayerNodeModel => ({
  id, layerName, objectType: 'AppTreeLayerNode', serviceId: '1', visible: true,
});
const levelNode: AppTreeLevelNodeModel = { id: 'root', objectType: 'AppTreeLevelNode', title: 'Root', root: true, childrenIds: [ 'lyr1', 'lyr2' ] };

describe('FormUsageHelper', () => {

  test('returns the app layers using the form, with the layer title from the settings or the layer name', () => {
    const app1 = getApplication({
      id: '1',
      contentRoot: { layerNodes: [ levelNode, layerNode('lyr1', 'inspections'), layerNode('lyr2', 'roads') ], baseLayerNodes: [], terrainLayerNodes: [] },
      settings: { layerSettings: { lyr1: { formId: 3, title: 'Inspections' }, lyr2: { formId: 4 } } },
    });
    const app2 = getApplication({
      id: '2',
      contentRoot: { layerNodes: [layerNode('lyr1', 'inspections')], baseLayerNodes: [], terrainLayerNodes: [] },
      settings: { layerSettings: { lyr1: { formId: 3 } } },
    });
    const usages = FormUsageHelper.getAppLayersUsingForm([ app1, app2 ], 3);
    expect(usages.map(u => [ u.application.id, u.appLayerId, u.layerTitle ])).toEqual([
      [ '1', 'lyr1', 'Inspections' ],
      [ '2', 'lyr1', 'inspections' ],
    ]);
  });

  test('ignores settings of layers no longer in the layer tree and applications without settings', () => {
    const app = getApplication({
      contentRoot: { layerNodes: [layerNode('lyr1', 'inspections')], baseLayerNodes: [], terrainLayerNodes: [] },
      settings: { layerSettings: { removed: { formId: 3 } } },
    });
    expect(FormUsageHelper.getAppLayersUsingForm([ app, getApplication() ], 3)).toEqual([]);
  });

});
