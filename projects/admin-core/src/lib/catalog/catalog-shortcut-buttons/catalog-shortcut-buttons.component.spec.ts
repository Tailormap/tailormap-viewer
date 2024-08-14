import { render, screen } from '@testing-library/angular';
import { CatalogShortcutButtonsComponent } from './catalog-shortcut-buttons.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { GeoServiceService } from '../services/geo-service.service';
import { FeatureSourceService } from '../services/feature-source.service';
import { provideMockStore } from '@ngrx/store/testing';
import {
  selectFeatureTypes, selectGeoServiceAndLayerByLayerId, selectGeoServiceById, selectGeoServiceLayers, selectGeoServices,
} from '../state/catalog.selectors';
import { ExtendedFeatureTypeModel } from '../models/extended-feature-type.model';
import { CatalogExtendedTypeEnum } from '../models/catalog-extended.model';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { getGeoService, getGeoServiceLayer } from '@tailormap-admin/admin-api';
import { ExtendedGeoServiceLayerModel } from '../models/extended-geo-service-layer.model';

const featureType: ExtendedFeatureTypeModel = {
  featureSourceId: '1',
  type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
  title: 'begroeidterreindeel',
  originalId: '1',
  name: 'abc',
  id: '1',
  hasAttributes: false,
  catalogNodeId: '',
};

const geoService: ExtendedGeoServiceModel = {
  ...getGeoService({ id: '1', title: 'my wonderful service' }),
  type: CatalogExtendedTypeEnum.SERVICE_TYPE,
  layerIds: ['1_1'],
  catalogNodeId: '',
};

const geoServiceLayer: ExtendedGeoServiceLayerModel = {
  ...getGeoServiceLayer({ id: '1_1', title: 'my wonderful layer', name: 'service:my-wonderful-layer' }),
  type: CatalogExtendedTypeEnum.SERVICE_LAYER_TYPE,
  serviceId: '1',
  originalId: '1',
  catalogNodeId: '',
};

const setup = async (geoServiceId?: string, geoServiceLayerId?: string, featureTypeId?: string) => {
  const getDraftGeoService$Mock = jest.fn();
  const getDraftFeatureType$Mock = jest.fn();
  const featureTypes = [featureType];
  const geoServices = [geoService];
  const geoServiceLayers = [geoServiceLayer];
  await render(CatalogShortcutButtonsComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    inputs: {
      featureTypeId: featureTypeId || null,
      geoServiceId: geoServiceId || null,
      geoServiceLayerId: geoServiceLayerId || null,
    },
    providers: [
      provideMockStore({
        initialState: { [catalogStateKey]: initialCatalogState },
        selectors: [
          { selector: selectGeoServices, value: geoServices },
          { selector: selectGeoServiceLayers, value: geoServiceLayers },
          { selector: selectFeatureTypes, value: featureTypes },
        ],
      }),
      { provide: GeoServiceService, useValue: { getDraftGeoService$: getDraftGeoService$Mock } },
      { provide: FeatureSourceService, useValue: { getDraftFeatureType$: getDraftFeatureType$Mock } },
    ],
  });
};

describe('CatalogShortcutButtonsComponent', () => {

  test('should render empty', async () => {
    await setup(undefined, undefined, undefined);
    expect(screen.queryByLabelText('catalog shortcuts')).not.toBeInTheDocument();
  });

  test('should render - with feature type', async () => {
    await setup(undefined, undefined, '1');
    expect(screen.queryByLabelText('catalog shortcuts')).toBeInTheDocument();
    expect(await screen.findByText('Feature type')).toBeInTheDocument();
    expect(await screen.findByText('begroeidterreindeel')).toBeInTheDocument();
    expect(screen.queryByText('Geo service')).not.toBeInTheDocument();
    expect(screen.queryByText('Layer name')).not.toBeInTheDocument();
  });

  test('should render - all', async () => {
    await setup('1', '1_1', '1');
    expect(screen.queryByLabelText('catalog shortcuts')).toBeInTheDocument();
    expect(await screen.findByText('Feature type')).toBeInTheDocument();
    expect(await screen.findByText('begroeidterreindeel')).toBeInTheDocument();
    expect(await screen.findByText('Geo service')).toBeInTheDocument();
    expect(await screen.findByText('my wonderful service')).toBeInTheDocument();
    expect(await screen.findByText('Layer name')).toBeInTheDocument();
    expect(await screen.findByText('my wonderful layer (service:my-wonderful-layer)')).toBeInTheDocument();
  });

});
