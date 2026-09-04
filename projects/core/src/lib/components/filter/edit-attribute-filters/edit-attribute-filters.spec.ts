import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { EditAttributeFiltersComponent } from './edit-attribute-filters.component';
import { FilterToolEnum, UniqueValuesService, UpdateSliderFilterModel } from '@tailormap-viewer/api';
import { provideMockStore } from '@ngrx/store/testing';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { getFilterGroup } from '@tailormap-viewer/shared';


const setup = async () => {

  const sliderFilterConfiguration: UpdateSliderFilterModel = {
    filterTool: FilterToolEnum.SLIDER,
    minimumValue: 0,
    maximumValue: 100,
    initialValue: 50,
  };

  const filterGroup = getFilterGroup();

  const attributeFilter = { ...filterGroup.filters[0], editConfiguration: sliderFilterConfiguration };
  const filterGroupId = filterGroup.id;

  const uniqueValuesService = {
    getUniqueValues$: vi.fn(() => of({ values: [] })),
  };

  await render(EditAttributeFiltersComponent, {
    providers: [
      provideMockStore(),
      { provide: UniqueValuesService, useValue: uniqueValuesService },
    ],
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
