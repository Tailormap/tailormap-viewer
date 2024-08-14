import { render, screen } from '@testing-library/angular';
import { CatalogBaseTreeNodeComponent } from './catalog-base-tree-node.component';
import { getCatalogNode, getGeoService, getGeoServiceLayer, getGeoServiceSummary } from '@tailormap-admin/admin-api';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { ExtendedGeoServiceModel } from '../../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../models/extended-geo-service-layer.model';
import { CatalogExtendedTypeEnum } from '../../models/catalog-extended.model';

const setup = async (node: CatalogTreeModel | null) => {
  await render(CatalogBaseTreeNodeComponent, {
    imports: [ MatIconModule, MatIconTestingModule ],
    inputs: { node },
  });
};

describe('CatalogBaseTreeNodeComponent', () => {

  test('should render', async () => {
    await setup(CatalogTreeHelper.getTreeModelForCatalogNode({
      type: CatalogExtendedTypeEnum.CATALOG_NODE_TYPE,
      parentId: '',
      ...getCatalogNode({ title: 'catalog-tree-node works!' }),
    }));
    expect(await screen.findByText('catalog-tree-node works!')).toBeInTheDocument();
    expect(await screen.findByLabelText('Catalog')).toBeInTheDocument();
  });

  test('should render service', async () => {
    const service: ExtendedGeoServiceModel = {
      ...getGeoService({ id: 'this-one', title: 'my wonderful service' }),
      type: CatalogExtendedTypeEnum.SERVICE_TYPE,
      layerIds: [],
      catalogNodeId: '1',
    };
    const node = CatalogTreeHelper.getTreeModelForService(new Map([[ service.id, service ]]), new Map(), new Set(), 'this-one', false);
    await setup(node);
    expect(await screen.findByText('my wonderful service')).toBeInTheDocument();
    expect(await screen.findByLabelText('Service')).toBeInTheDocument();
  });

  test('should render layer', async () => {
    const layer: ExtendedGeoServiceLayerModel = {
      ...getGeoServiceLayer({ id: 'my-layer', name: 'my-layer', title: 'nice layer' }),
      type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE,
      serviceId: 'test',
      catalogNodeId: '1',
      originalId: '1',
    };
    const node = CatalogTreeHelper.getTreeModelForLayer(layer, new Map(), new Set(), false);
    await setup(node);
    expect(await screen.findByText('nice layer')).toBeInTheDocument();
    expect(await screen.findByLabelText('Layer')).toBeInTheDocument();
  });

});
