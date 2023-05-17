import { render, screen } from '@testing-library/angular';
import { GroupCreateComponent } from './group-create.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GroupDetailsService } from '../services/group-details.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('GroupCreateComponent', () => {

  test('should render', async () => {
    await render(GroupCreateComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [MatSnackBarModule],
      providers: [
        { provide: GroupDetailsService, useValue: {} },
      ],
    });
    expect(await screen.findByText('Add group')).toBeInTheDocument();
  });

});
