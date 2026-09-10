import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { UserHomeComponent } from './user-home.component';
describe('UserHomeComponent', () => {

  test('should render', async () => {
    await render(UserHomeComponent, { imports: [] });
    expect(await screen.findByText('Add user')).toBeInTheDocument();
  });

});
