import { SliderFilterComponent } from './slider-filter.component';
import { render, screen } from '@testing-library/angular';
import { FilterToolEnum } from '@tailormap-viewer/api';
import { MatSliderModule } from '@angular/material/slider';
import { SliderComponent } from '@tailormap-viewer/shared';
import { ReactiveFormsModule } from '@angular/forms';

describe('SliderFilterComponent', () => {

  test('should render single slider', async () => {
    const sliderFilterConfiguration = {
      filterTool: FilterToolEnum.SLIDER,
      minimumValue: 0,
      maximumValue: 100,
      initialValue: 50,
    };

    await render(SliderFilterComponent, {
      imports: [ MatSliderModule, ReactiveFormsModule ],
      declarations: [SliderComponent],
      inputs: { sliderFilterConfiguration },
    });
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test('should render range slider', async () => {
    const sliderFilterConfiguration = {
      filterTool: FilterToolEnum.SLIDER,
      minimumValue: 0,
      maximumValue: 100,
      initialLowerValue: 20,
      initialUpperValue: 80,
    };

    await render(SliderFilterComponent, {
      imports: [ MatSliderModule, ReactiveFormsModule ],
      declarations: [SliderComponent],
      inputs: { sliderFilterConfiguration },
    });
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

});
