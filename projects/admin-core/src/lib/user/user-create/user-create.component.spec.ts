import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { UserCreateComponent } from './user-create.component';
import { UserService } from '../services/user.service';
import { UserFormComponent } from '../user-form/user-form.component';
import { Component } from '@angular/core';

@Component({
  selector: 'tm-admin-user-form',
  template: '<div>User Form</div>',
})
class MockUserFormComponent {}

describe('UserCreateComponent', () => {

  test('should render', async () => {
    await render(UserCreateComponent, {
      importOverrides: [
        { replace: UserFormComponent, with: MockUserFormComponent },
      ],
      providers: [
        { provide: UserService, useValue: {} },
      ],
    });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
