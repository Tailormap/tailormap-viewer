import { render, screen, waitFor } from '@testing-library/angular';
import { CatalogNodeFormDialogComponent } from './catalog-node-form-dialog.component';
import { of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CatalogService } from '../services/catalog.service';
import { getCatalogNode } from '@tailormap-admin/admin-api';
import { CatalogNodeFormComponent } from '../catalog-node-form/catalog-node-form.component';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { SpinnerButtonComponent } from '../../shared/components/spinner-button/spinner-button.component';

const setup = async (editMode = false) => {
  const dialogRefMock = { close: jest.fn() };
  const catalogServiceMock = {
    createCatalogNode$: jest.fn(() => of(true)),
    updateCatalogNode$: jest.fn(() => of(true)),
  };
  await render(CatalogNodeFormDialogComponent, {
    imports: [SharedModule],
    declarations: [ CatalogNodeFormComponent, SaveButtonComponent, SpinnerButtonComponent ],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: CatalogService, useValue: catalogServiceMock },
      { provide: MAT_DIALOG_DATA, useValue: { node: editMode ? getCatalogNode({ id: '2', title: 'The editable folder', root: false }) : null, parentNode: '1' } },
    ],
  });
  return {
    catalogServiceMock,
    dialogRefMock,
  };
};

describe('CatalogNodeFormDialogComponent', () => {

  test('should render and handle cancel', async () => {
    const { dialogRefMock } = await setup();
    expect(screen.getByText('Create new folder')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should save new node', async () => {
    const { catalogServiceMock, dialogRefMock } = await setup();
    expect(screen.getByText('Create new folder')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Title'), 'The new folder');
    await waitFor(() => expect(screen.getByText('Save').closest('button')).not.toBeDisabled());
    await userEvent.click(screen.getByText('Save'));
    expect(catalogServiceMock.createCatalogNode$).toHaveBeenCalledWith({
      title: 'The new folder',
      type: 'catalog-node',
      root: false,
      parentId: '1',
      children: null,
      items: null,
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  test('should edit node', async () => {
    const { catalogServiceMock, dialogRefMock } = await setup(true);
    expect(screen.getByText('Edit The editable folder')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Title'), '_edited');
    await waitFor(() => expect(screen.getByText('Save').closest('button')).not.toBeDisabled());
    await userEvent.click(screen.getByText('Save'));
    expect(catalogServiceMock.updateCatalogNode$).toHaveBeenCalledWith({
      id: '2',
      title: 'The editable folder_edited',
      type: 'catalog-node',
      root: false,
      parentId: '1',
      children: null,
      items: [],
    });
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

});
