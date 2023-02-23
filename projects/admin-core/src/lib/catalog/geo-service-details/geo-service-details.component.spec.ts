import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceDetailsComponent } from './geo-service-details.component';
import { of } from 'rxjs';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { getGeoService } from '@tailormap-admin/admin-api';
import { ActivatedRoute } from '@angular/router';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

const setup = async () => {
  const updateGeoServiceMock = jest.fn(() => of(true));
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const geoServiceService = {
    updateGeoService$: updateGeoServiceMock,
  };
  const geoServiceModel = getGeoService({ id: '1', title: 'The Service' });
  const store = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, geoServices: [{ ...geoServiceModel, catalogNodeId: 'node-1' }] } },
  });
  await render(GeoServiceDetailsComponent, {
    declarations: [GeoServiceFormComponent],
    imports: [SharedModule],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
    ],
  });
  return { updateGeoServiceMock, geoServiceModel };
};

describe('GeoServiceDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeDisabled();
  });

  test('should handle editing', async () => {
    const { updateGeoServiceMock, geoServiceModel } = await setup();
    expect(await screen.findByText('Edit The Service')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Title'), '___');
    // @ts-ignore
    await waitFor(async () => {
      expect(await screen.findByRole('button')).not.toBeDisabled();
    });
    await userEvent.click(await screen.findByRole('button'));
    expect(updateGeoServiceMock).toHaveBeenCalledWith({
      id: '1',
      title: geoServiceModel.title + '___',
      url: geoServiceModel.url,
      protocol: geoServiceModel.protocol,
    }, 'node-1');
  });

});
