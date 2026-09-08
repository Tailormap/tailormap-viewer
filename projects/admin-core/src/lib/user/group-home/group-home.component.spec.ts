import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GroupHomeComponent } from './group-home.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('GroupHomeComponent', () => {

  test('should render', async () => {
    await render(GroupHomeComponent, { imports: [MatIconTestingModule] });
    expect(await screen.findByText('Add group')).toBeInTheDocument();
  });

});
