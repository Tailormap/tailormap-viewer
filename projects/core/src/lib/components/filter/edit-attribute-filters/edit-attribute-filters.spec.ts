import { render, screen } from '@testing-library/angular';
import { EditAttributeFiltersComponent } from './edit-attribute-filters.component';
import { SliderFilterComponent } from './slider-filter/slider-filter.component';
import { FilterToolEnum } from '@tailormap-viewer/api';
import { getFilterGroup } from '../../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';
import { SharedImportsModule, SliderComponent } from '@tailormap-viewer/shared';
import { provideMockStore } from '@ngrx/store/testing';
import userEvent from '@testing-library/user-event';


const setup = async () => {

  const sliderFilterConfiguration = {
    filterTool: FilterToolEnum.SLIDER,
    minimumValue: 0,
    maximumValue: 100,
    initialValue: 50,
  };

  const filterGroup = getFilterGroup();

  const attributeFilter = { ...filterGroup.filters[0], editConfiguration: sliderFilterConfiguration };
  const filterGroupId = filterGroup.id;

  await render(EditAttributeFiltersComponent, {
    imports: [SharedImportsModule],
    declarations: [ SliderFilterComponent, SliderComponent ],
    providers: [provideMockStore()],
    inputs: { editableFilters: [attributeFilter], filterGroupId },
  });
};

describe('EditAttributeFiltersComponent', () => {

  test('should render', async () => {
    await setup();
    expect(screen.getByText('Edit filters')).toBeInTheDocument();
  });

  test('should render slider filter', async () => {
    await setup();
    await userEvent.click(screen.getByText('Edit filters'));
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

});
