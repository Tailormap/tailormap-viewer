import { render, screen } from '@testing-library/angular';
import { ApplicationDetailsComponent } from './application-details.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { getMockStore } from '@ngrx/store/testing';
import { ApplicationState, applicationStateKey, initialApplicationState } from '../state/application.state';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../services/application.service';
import { getApplication } from '@tailormap-admin/admin-api';
import { ConfirmDialogService } from '@tailormap-viewer/shared';

const setup = async (hasApplication: boolean) => {
  const appState: ApplicationState = {
    ...initialApplicationState,
    applications: hasApplication ? [getApplication({ id: '1', title: 'Test application' })] : [],
  };
  const store = getMockStore({
    initialState: { [applicationStateKey]: appState },
  });
  const appService = { updateApplication$: jest.fn() };
  await render(ApplicationDetailsComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
      { provide: Store, useValue: store },
      { provide: ApplicationService, useValue: appService },
      { provide: ConfirmDialogService, useValue: { openDialog$: jest.fn(() => of(true)) } },
    ],
  });
};

describe('ApplicationDetailsComponent', () => {

  test('should render empty', async () => {
    await setup(false);
    expect(await screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  test('should render application', async () => {
    await setup(true);
    expect(await screen.queryByText('Edit Test application')).toBeInTheDocument();
  });

});
