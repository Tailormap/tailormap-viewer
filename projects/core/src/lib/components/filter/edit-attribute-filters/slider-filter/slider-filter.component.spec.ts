import { SliderFilterComponent } from './slider-filter.component';
import { render, screen } from '@testing-library/angular';
import {
  AttributeFilterModel, AttributeType, EditFilterConfigurationModel, FilterConditionEnum, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { MatSliderModule } from '@angular/material/slider';
import { SliderComponent } from '@tailormap-viewer/shared';
import { ReactiveFormsModule } from '@angular/forms';

const setup = async (sliderType: 'single' | 'range') => {
  const sliderFilterEditConfiguration: EditFilterConfigurationModel = sliderType === 'single' ? {
    filterTool: FilterToolEnum.SLIDER,
    minimumValue: 0,
    maximumValue: 100,
    initialValue: 50,
  } : {
    filterTool: FilterToolEnum.SLIDER,
    minimumValue: 0,
    maximumValue: 100,
    initialLowerValue: 20,
    initialUpperValue: 80,
  };
  const sliderFilter: AttributeFilterModel = {
    id: 'filter1',
    attributeType: AttributeType.NUMBER,
    attribute: 'attribute1',
    condition: sliderType === 'single' ? FilterConditionEnum.NUMBER_LARGER_THAN_KEY : FilterConditionEnum.NUMBER_BETWEEN_KEY,
    value: sliderType === 'single' ? ['50'] : [ '20', '80' ],
    invertCondition: false,
    caseSensitive: false,
    type: FilterTypeEnum.ATTRIBUTE,
    editConfiguration: sliderFilterEditConfiguration,
  };
  await render(SliderFilterComponent, {
    imports: [ MatSliderModule, ReactiveFormsModule ],
    declarations: [SliderComponent],
    inputs: { sliderFilter },
  });
};

describe('SliderFilterComponent', () => {

  test('should render single slider', async () => {
    await setup('single');
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test('should render range slider', async () => {
    await setup('range');
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

});
