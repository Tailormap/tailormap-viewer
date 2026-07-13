import { render, screen } from '@testing-library/angular';
import { TextFilterComponent } from './text-filter.component';

describe('TextFilterComponent', () => {

  test('should render', async () => {
    await render(TextFilterComponent);
    expect(screen.getByText('text-filter works!'));
  });

});
