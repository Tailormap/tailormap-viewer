import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogNodeDetailsComponent } from './catalog-node-details.component';
import { of } from 'rxjs';
import { getCatalogNode } from '@tailormap-admin/admin-api';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CatalogService } from '../services/catalog.service';
import { CatalogNodeFormComponent } from '../catalog-node-form/catalog-node-form.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { GeoServiceService } from '../services/geo-service.service';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';

const setup = async () => {
  const createCatalogNodeMock = jest.fn(() => of(true));
  const updateCatalogNodeMock = jest.fn(() => of(true));
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const catalogService = {
    createCatalogNode$: createCatalogNodeMock,
    updateCatalogNode$: updateCatalogNodeMock,
  };
  const { geoServiceService, createGeoService$ } = createGeoServiceMock();
  const catalogNodeModel = getCatalogNode({ id: '1', title: 'Random services folder' });
  const store = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, catalog: [{ ...catalogNodeModel, root: false, parentId: 'root' }] } },
  });
  await render(CatalogNodeDetailsComponent, {
    declarations: [
      CatalogNodeFormComponent,
      CatalogNodeFormDialogComponent,
      GeoServiceFormDialogComponent,
      GeoServiceFormComponent,
      SaveButtonComponent,
    ],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: CatalogService, useValue: catalogService },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
    ],
  });
  return { createCatalogNodeMock, updateCatalogNodeMock, createGeoService$ };
};

describe('CatalogNodeDetailsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('Edit Random services folder')).toBeInTheDocument();
  });

  test('should handle editing', async () => {
    const { updateCatalogNodeMock } = await setup();
    await userEvent.type(await screen.findByPlaceholderText('Title'), ' premium');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(updateCatalogNodeMock).toHaveBeenCalledWith({
      id: '1',
      title: 'Random services folder premium',
      root: false,
      parentId: 'root',
      children: null,
      items: [],
    });
  });

  test('should open add folder popup', async () => {
    const { createCatalogNodeMock } = await setup();
    await userEvent.click(await screen.findByText('Add folder'));
    expect(await screen.findByText('Create new folder')).toBeInTheDocument();
    await userEvent.type((await screen.findAllByPlaceholderText('Title'))[1], 'New Folder Inside');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', 1);
    expect(createCatalogNodeMock).toHaveBeenCalledWith({
      title: 'New Folder Inside',
      root: false,
      parentId: '1',
      children: null,
      items: null,
    });
  });

  test('should open add geo service', async () => {
    const { createGeoService$ } = await setup();
    await userEvent.click(await screen.findByText('Add service'));
    expect(await screen.findByText('Create new service')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://service.url');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', 1);
    expect(createGeoService$).toHaveBeenCalledWith({
      title: '',
      url: 'http://service.url',
      protocol: 'wms',
    }, '1');
  });

});
