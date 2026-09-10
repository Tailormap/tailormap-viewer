import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GroupHomeComponent } from './group-home.component';
describe('GroupHomeComponent', () => {

  test('should render', async () => {
    await render(GroupHomeComponent, { imports: [] });
    expect(await screen.findByText('Add group')).toBeInTheDocument();
  });

});
