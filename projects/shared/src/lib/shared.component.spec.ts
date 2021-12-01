import { SharedComponent } from './shared.component';
import { render, screen } from '@testing-library/angular';

describe('SharedComponent', () => {
  test('should create', async () => {
    await render(SharedComponent);
    expect(screen.getByText('Test'));
  });
});
