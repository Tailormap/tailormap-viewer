import { render, screen } from '@testing-library/angular';
import { UserCreateComponent } from './user-create.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../services/user.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('UserCreateComponent', () => {

  test('should render', async () => {
    await render(UserCreateComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [MatSnackBarModule],
      providers: [
        { provide: UserService, useValue: {} },
      ],
    });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
