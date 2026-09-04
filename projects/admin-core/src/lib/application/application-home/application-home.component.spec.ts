import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { ApplicationHomeComponent } from './application-home.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ApplicationHomeComponent', () => {

  test('should render', async () => {
    await render(ApplicationHomeComponent, {
      imports: [MatIconTestingModule],
    });
    expect(screen.getByText('Add application'));
  });

});
