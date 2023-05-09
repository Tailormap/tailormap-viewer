import { render, screen } from '@testing-library/angular';
import { ApplicationEditSettingsComponent } from './application-edit-settings.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { getMockStore } from '@ngrx/store/testing';
import { ApplicationState, applicationStateKey, initialApplicationState } from '../state/application.state';
import { Store } from '@ngrx/store';
import { getApplication } from '@tailormap-admin/admin-api';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { ApplicationFormComponent } from '../application-form/application-form.component';
import { BoundsFieldComponent } from '../../shared/components/bounds-field/bounds-field.component';

const setup = async (hasApplication: boolean) => {
  const appState: ApplicationState = {
    ...initialApplicationState,
    applications: hasApplication ? [getApplication({ id: '1', title: 'Test application' })] : [],
    draftApplication: hasApplication ? getApplication({ id: '1', title: 'Test application' }) : null,
  };
  const store = getMockStore({
    initialState: { [applicationStateKey]: appState },
  });
  await render(ApplicationEditSettingsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [SharedImportsModule],
    declarations: [ ApplicationFormComponent, BoundsFieldComponent ],
    providers: [
      { provide: Store, useValue: store },
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
