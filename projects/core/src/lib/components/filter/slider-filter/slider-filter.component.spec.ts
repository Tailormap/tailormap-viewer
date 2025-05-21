import { render, screen } from '@testing-library/angular';
import { SliderFilterComponent } from './slider-filter.component';

describe('SliderFilterComponent', () => {

  test('should render', async () => {
    await render(SliderFilterComponent);
    expect(screen.getByText('slider-filter works!'));
  });

});
