import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { UserHomeComponent } from './user-home.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('UserHomeComponent', () => {

  test('should render', async () => {
    await render(UserHomeComponent, { imports: [MatIconTestingModule] });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
