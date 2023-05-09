import { render, screen } from '@testing-library/angular';
import { CatalogCreateButtonsComponent } from './catalog-create-buttons.component';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { of } from 'rxjs';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { getCatalogNode } from '@tailormap-admin/admin-api';
import { getMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { CatalogNodeFormDialogComponent } from '../catalog-node-form-dialog/catalog-node-form-dialog.component';
import { GeoServiceFormDialogComponent } from '../geo-service-form-dialog/geo-service-form-dialog.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CatalogService } from '../services/catalog.service';
import { GeoServiceService } from '../services/geo-service.service';
import { Store } from '@ngrx/store';
import { CatalogNodeFormComponent } from '../catalog-node-form/catalog-node-form.component';
import { GeoServiceFormComponent } from '../geo-service-form/geo-service-form.component';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { Router } from '@angular/router';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';

const setup = async (hasNode = false) => {
  const createCatalogNodeMock = jest.fn(() => of(true));
  const updateCatalogNodeMock = jest.fn(() => of(true));
  const catalogService = {
    createCatalogNode$: createCatalogNodeMock,
    updateCatalogNode$: updateCatalogNodeMock,
  };
  const { geoServiceService, createGeoService$ } = createGeoServiceMock();
  const rootModel = getCatalogNode({ id: 'root', title: 'Root', root: true });
  const catalogNodeModel = { ...getCatalogNode({ id: '1', title: 'Random services folder', root: false }), parentId: 'root' };
  const store = getMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, catalog: [ rootModel, catalogNodeModel ] } },
  });
  await render(CatalogCreateButtonsComponent, {
    declarations: [
      CatalogNodeFormDialogComponent,
      GeoServiceFormDialogComponent,
      CatalogNodeFormComponent,
      GeoServiceFormComponent,
      SaveButtonComponent,
      PasswordFieldComponent,
    ],
    componentInputs: {
      node: hasNode ? catalogNodeModel : null,
    },
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: CatalogService, useValue: catalogService },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
      { provide: Router, useValue: { navigateToUrl: jest.fn() } },
    ],
  });
  return { createCatalogNodeMock, updateCatalogNodeMock, createGeoService$ };
};

describe('CatalogCreateButtonsComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('Add folder'));
  });

  test('should open add folder popup', async () => {
    const { createCatalogNodeMock } = await setup();
    await userEvent.click(await screen.findByText('Add folder'));
    expect(await screen.findByText('Create new folder')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'New Folder Inside');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', 0);
    expect(createCatalogNodeMock).toHaveBeenCalledWith({
      title: 'New Folder Inside',
      root: false,
      parentId: 'root',
      children: null,
      items: null,
    });
  });

  test('should open add geo service', async () => {
    const { createGeoService$ } = await setup(true);
    await userEvent.click(await screen.findByText('Add service'));
    expect(await screen.findByText('Create new service')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://service.url');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', 0);
    expect(createGeoService$).toHaveBeenCalledWith({
      title: '',
      url: 'http://service.url',
      protocol: 'wms',
      authentication: null,
      settings: {
        useProxy: false,
      },
    }, '1');
  });

});
