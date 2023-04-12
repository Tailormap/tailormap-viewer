import { render, screen } from '@testing-library/angular';
import { ApplicationEditComponent } from './application-edit.component';
import { ApplicationState, applicationStateKey, initialApplicationState } from '../state/application.state';
import { getApplication } from '@tailormap-admin/admin-api';
import { provideMockStore } from '@ngrx/store/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

const setup = async (hasApp: boolean) => {
  const mockState: ApplicationState = {
    ...initialApplicationState,
    selectedApplication: '1',
    applications: !hasApp ? [] : [
      getApplication({ id: '1', title: 'my app' }),
    ],
  };
  await render(ApplicationEditComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      provideMockStore({ initialState: { [applicationStateKey]: mockState } }),
    ],
  });
};

describe('ApplicationEditComponent', () => {

  test('should render with selected app', async () => {
    await setup(true);
    expect(await screen.findByText('Edit my app')).toBeInTheDocument();
  });

  test('should render nothing without selected app', async () => {
    await setup(false);
    expect(await screen.queryByText('Edit my app')).not.toBeInTheDocument();
  });

});
