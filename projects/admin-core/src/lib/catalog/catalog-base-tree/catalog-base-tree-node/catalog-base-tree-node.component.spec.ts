import { render, screen } from '@testing-library/angular';
import { CatalogBaseTreeNodeComponent } from './catalog-base-tree-node.component';
import { getCatalogNode, getGeoService, getGeoServiceLayer, getGeoServiceSummary } from '@tailormap-admin/admin-api';
import { CatalogTreeHelper } from '../../helpers/catalog-tree.helper';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { ExtendedGeoServiceModel } from '../../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../models/extended-geo-service-layer.model';

const setup = async (node: CatalogTreeModel | null) => {
  await render(CatalogBaseTreeNodeComponent, {
    imports: [ MatIconModule, MatIconTestingModule ],
    componentProperties: { node },
  });
};

describe('CatalogTreeNodeComponent', () => {

  test('should render', async () => {
    await setup(CatalogTreeHelper.getTreeModelForCatalogNode({ parentId: '', ...getCatalogNode({ title: 'catalog-tree-node works!' }) }));
    expect(await screen.findByText('catalog-tree-node works!')).toBeInTheDocument();
    expect(await screen.findByLabelText('Catalog')).toBeInTheDocument();
  });

  test('should render service', async () => {
    const service: ExtendedGeoServiceModel = { ...getGeoServiceSummary({ id: 'this-one', title: 'my wonderful service' }), layerIds: [], catalogNodeId: '1' };
    const node = CatalogTreeHelper.getTreeModelForService([service], [], 'this-one');
    await setup(node);
    expect(await screen.findByText('my wonderful service')).toBeInTheDocument();
    expect(await screen.findByLabelText('Service')).toBeInTheDocument();
  });

  test('should render layer', async () => {
    const layer: ExtendedGeoServiceLayerModel = { ...getGeoServiceLayer({ name: 'my-layer', title: 'nice layer' }), originalId: 'my-layer', serviceId: 'test', catalogNodeId: '1' };
    const node = CatalogTreeHelper.getTreeModelForLayer(layer, [], {});
    await setup(node);
    expect(await screen.findByText('nice layer')).toBeInTheDocument();
    expect(await screen.findByLabelText('Layer')).toBeInTheDocument();
  });

});
