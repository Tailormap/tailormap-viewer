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
import { of } from 'rxjs';
import { ConfigService } from '../../config/services/config.service';
import userEvent from '@testing-library/user-event';

const setup = async (hasApplication: boolean, isDefaultApplication?: boolean) => {
  const appState: ApplicationState = {
    ...initialApplicationState,
    applications: hasApplication ? [getApplication({ id: '1', title: 'Test application' })] : [],
    draftApplication: hasApplication ? getApplication({ id: '1', title: 'Test application' }) : null,
  };
  const store = getMockStore({
    initialState: { [applicationStateKey]: appState },
  });
  const configService = {
    getConfigValue$: jest.fn(() => of(isDefaultApplication ? 'app1' : '')),
    saveConfig$: jest.fn(() => of(null)),
  };
  await render(ApplicationEditSettingsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [SharedImportsModule],
    declarations: [ ApplicationFormComponent, BoundsFieldComponent ],
    providers: [
      { provide: Store, useValue: store },
      { provide: ConfigService, useValue: configService },
    ],
  });
  return { configService };
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

  test('should render default app toggle', async () => {
    const { configService } = await setup(true);
    expect(await screen.findByText('Set default application')).toBeInTheDocument();
    expect(await screen.findByText('Setting this application as default will overwrite the current default application')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Set default application'));
    expect(configService.saveConfig$).toHaveBeenCalledTimes(1);
  });

  test('should render default app toggle - for default app', async () => {
    const { configService } = await setup(true, true);
    expect(await screen.queryByText('Setting this application as default will overwrite the current default application')).not.toBeInTheDocument();
  });

});
