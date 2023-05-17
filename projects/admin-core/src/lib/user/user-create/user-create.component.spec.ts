import { render, screen } from '@testing-library/angular';
import { UserCreateComponent } from './user-create.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserDetailsService } from '../services/user-details.service';

describe('UserCreateComponent', () => {

  test('should render', async () => {
    await render(UserCreateComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: UserDetailsService, useValue: {} },
      ],
    });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
