import { render, screen, waitFor } from '@testing-library/angular';
import { ApplicationEditSettingsComponent } from './application-edit-settings.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { getMockStore } from '@ngrx/store/testing';
import { ApplicationState, applicationStateKey, initialApplicationState } from '../state/application.state';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../services/application.service';
import { getApplication } from '@tailormap-admin/admin-api';
import { ConfirmDialogService, SharedImportsModule } from '@tailormap-viewer/shared';
import { ApplicationFormComponent } from '../application-form/application-form.component';
import { BoundsFieldComponent } from '../../shared/components/bounds-field/bounds-field.component';

const setup = async (hasApplication: boolean) => {
  const appState: ApplicationState = {
    ...initialApplicationState,
    applications: hasApplication ? [getApplication({ id: '1', title: 'Test application' })] : [],
    selectedApplication: hasApplication ? '1' : null,
  };
  const store = getMockStore({
    initialState: { [applicationStateKey]: appState },
  });
  const appService = { updateApplication$: jest.fn() };
  await render(ApplicationEditSettingsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [SharedImportsModule],
    declarations: [ ApplicationFormComponent, BoundsFieldComponent ],
    providers: [
      { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
      { provide: Store, useValue: store },
      { provide: ApplicationService, useValue: appService },
      { provide: ConfirmDialogService, useValue: { openDialog$: jest.fn(() => of(true)) } },
    ],
  });
};

describe('ApplicationEditSettingsComponent', () => {

  test('should render empty', async () => {
    await setup(false);
    expect(await screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  test('should render application form', async () => {
    await setup(true);
    expect(await screen.findByPlaceholderText('Name')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Title')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Title')).toHaveValue('Test application');
  });

});
