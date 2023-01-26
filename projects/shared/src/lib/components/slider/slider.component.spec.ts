import { render, screen } from '@testing-library/angular';
import { SliderComponent } from './slider.component';
import { MatSliderModule } from '@angular/material/slider';

describe('SliderComponent', () => {

  test('should render', async () => {
    await render(SliderComponent, {
      imports: [MatSliderModule],
    });
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

});
