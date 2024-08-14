import { render, screen } from '@testing-library/angular';
import { CatalogCreateButtonsComponent } from './catalog-create-buttons.component';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper.spec';
import { of } from 'rxjs';
import { createGeoServiceMock } from '../helpers/mocks/geo-service.service.mock';
import { TailormapAdminApiV1Service, getCatalogNode, AUTHORIZATION_RULE_ANONYMOUS } from '@tailormap-admin/admin-api';
import { createMockStore } from '@ngrx/store/testing';
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
import { AuthorizationEditComponent } from '../../shared/components/authorization-edit/authorization-edit.component';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { SpinnerButtonComponent } from '@tailormap-viewer/shared';

const setup = async (hasNode = false) => {
  const createCatalogNodeMock = jest.fn(() => of({ node: { id: '3', title: 'New Folder Inside' } }));
  const updateCatalogNodeMock = jest.fn(() => of(true));
  const catalogService = {
    createCatalogNode$: createCatalogNodeMock,
    updateCatalogNode$: updateCatalogNodeMock,
  };
  const { geoServiceService, createGeoService$ } = createGeoServiceMock();
  const rootModel = getCatalogNode({ id: 'root', title: 'Root', root: true });
  const catalogNodeModel = { ...getCatalogNode({ id: '1', title: 'Random services folder', root: false }), parentId: 'root' };
  const store = createMockStore({
    initialState: {
      [catalogStateKey]: { ...initialCatalogState, catalog: [ rootModel, catalogNodeModel ] },
      [userStateKey]: initialUserState,
    },
  });
  await render(CatalogCreateButtonsComponent, {
    declarations: [
      CatalogNodeFormDialogComponent,
      GeoServiceFormDialogComponent,
      CatalogNodeFormComponent,
      GeoServiceFormComponent,
      SaveButtonComponent,
      SpinnerButtonComponent,
      PasswordFieldComponent,
      AuthorizationEditComponent,
    ],
    inputs: {
      node: hasNode ? catalogNodeModel : null,
    },
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: CatalogService, useValue: catalogService },
      { provide: GeoServiceService, useValue: geoServiceService },
      { provide: Store, useValue: store },
      { provide: Router, useValue: { navigateByUrl: jest.fn() } },
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: jest.fn(() => of(null)) } },
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
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
      type: 'catalog-node',
      root: false,
      parentId: 'root',
      children: null,
      items: null,
    });
  });

  test('should open add geo service', async () => {
    const { createGeoService$ } = await setup(true);
    await userEvent.click(await screen.findByText('Add map service'));
    expect(await screen.findByText('Create new service')).toBeInTheDocument();
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://service.url');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save', 0);
    expect(createGeoService$).toHaveBeenCalledWith({
      authorizationRules: [AUTHORIZATION_RULE_ANONYMOUS],
      title: '',
      url: 'http://service.url',
      protocol: 'wms',
      authentication: null,
      settings: {
        useProxy: false,
        xyzCrs: null,
      },
    }, '1');
  });

});
