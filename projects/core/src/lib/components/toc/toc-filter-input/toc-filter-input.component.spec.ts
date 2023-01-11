import { render, screen } from '@testing-library/angular';
import { TocFilterInputComponent } from './toc-filter-input.component';

describe('TocFilterInputComponent', () => {

  test('should render', async () => {
    await render(TocFilterInputComponent);
    expect(screen.getByText('toc-filter-input works!'));
  });

});
