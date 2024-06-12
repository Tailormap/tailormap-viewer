import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogNodeDetailsComponent } from './catalog-node-details.component';
import { of } from 'rxjs';
import { getCatalogNode } from '@tailormap-admin/admin-api';
import { createMockStore } from '@ngrx/store/testing';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';
import { SharedModule } from '@tailormap-viewer/shared';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { CatalogService } from '../services/catalog.service';
import { CatalogNodeFormComponent } from '../catalog-node-form/catalog-node-form.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { CatalogCreateButtonsComponent } from '../catalog-create-buttons/catalog-create-buttons.component';
import { SpinnerButtonComponent } from '../../shared/components/spinner-button/spinner-button.component';

const setup = async () => {
  const updateCatalogNodeMock = jest.fn(() => of(true));
  const activeRoute = {
    paramMap: of({ get: () => '1' }),
  };
  const catalogService = {
    updateCatalogNode$: updateCatalogNodeMock,
  };
  const catalogNodeModel = getCatalogNode({ id: '1', title: 'Random services folder' });
  const store = createMockStore({
    initialState: { [catalogStateKey]: { ...initialCatalogState, catalog: [{ ...catalogNodeModel, root: false, parentId: 'root' }] } },
  });
  await render(CatalogNodeDetailsComponent, {
    declarations: [
      CatalogNodeFormComponent,
      SaveButtonComponent,
      SpinnerButtonComponent,
      CatalogCreateButtonsComponent,
    ],
    imports: [ SharedModule, MatIconTestingModule ],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: CatalogService, useValue: catalogService },
      { provide: Store, useValue: store },
    ],
  });
  return { updateCatalogNodeMock };
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
      type: 'catalog-node',
      root: false,
      parentId: 'root',
      children: null,
      items: [],
    });
  });

});
