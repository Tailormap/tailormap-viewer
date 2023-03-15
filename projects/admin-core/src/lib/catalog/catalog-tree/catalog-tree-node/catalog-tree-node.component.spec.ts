import { render, screen } from '@testing-library/angular';
import { CatalogTreeNodeComponent } from './catalog-tree-node.component';
import { getCatalogNode, getGeoService, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import { CatalogHelper } from '../../helpers/catalog.helper';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';
import { CatalogTreeModel } from '../../models/catalog-tree.model';
import { ExtendedGeoServiceModel } from '../../models/extended-geo-service.model';
import { ExtendedGeoServiceLayerModel } from '../../models/extended-geo-service-layer.model';

const setup = async (node: CatalogTreeModel | null) => {
  await render(CatalogTreeNodeComponent, {
    imports: [ MatIconModule, MatIconTestingModule ],
    componentProperties: { node },
  });
};

describe('CatalogTreeNodeComponent', () => {

  test('should render', async () => {
    await setup(CatalogHelper.getTreeModelForCatalogNode({ parentId: '', ...getCatalogNode({ title: 'catalog-tree-node works!' }) }));
    expect(await screen.findByText('catalog-tree-node works!')).toBeInTheDocument();
    expect(await screen.findByLabelText('Catalog')).toBeInTheDocument();
  });

  test('should render service', async () => {
    const service: ExtendedGeoServiceModel = { ...getGeoService({ id: 'this-one', title: 'my wonderful service' }), layers: [], catalogNodeId: '1' };
    const node = CatalogHelper.getTreeModelForService([service], [], 'this-one');
    await setup(node);
    expect(await screen.findByText('my wonderful service')).toBeInTheDocument();
    expect(await screen.findByLabelText('Service')).toBeInTheDocument();
  });

  test('should render layer', async () => {
    const layer: ExtendedGeoServiceLayerModel = { id: 'my-layer', ...getGeoServiceLayer({ name: 'my-layer', title: 'nice layer' }), serviceId: 'test', catalogNodeId: '1' };
    const node = CatalogHelper.getTreeModelForLayer(layer, []);
    await setup(node);
    expect(await screen.findByText('nice layer')).toBeInTheDocument();
    expect(await screen.findByLabelText('Layer')).toBeInTheDocument();
  });

});
