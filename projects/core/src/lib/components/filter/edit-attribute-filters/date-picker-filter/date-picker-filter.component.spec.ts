import { render, screen } from '@testing-library/angular';
import { DatePickerFilterComponent } from './date-picker-filter.component';
import {
  AttributeFilterModel, AttributeType, EditFilterConfigurationModel, FilterConditionEnum, FilterToolEnum, FilterTypeEnum,
} from '@tailormap-viewer/api';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

const setup = async (type: 'single' | 'range') => {
  const datePickerFilterEditConfiguration: EditFilterConfigurationModel = type === 'single' ? {
    filterTool: FilterToolEnum.DATE_PICKER,
    initialDate: '1993-06-18',
  } : {
    filterTool: FilterToolEnum.DATE_PICKER,
    initialLowerDate: '1999-08-14',
    initialUpperDate: '2025-05-23',
  };
  const datePickerFilter: AttributeFilterModel = {
    id: 'filter1',
    attributeType: AttributeType.DATE,
    attribute: 'attribute1',
    condition: type === 'single' ? FilterConditionEnum.DATE_AFTER_KEY : FilterConditionEnum.DATE_BETWEEN_KEY,
    value: type === 'single' ? ['1993-06-18'] : [ '1999-08-14', '2025-05-23' ],
    invertCondition: false,
    caseSensitive: false,
    type: FilterTypeEnum.ATTRIBUTE,
    editConfiguration: datePickerFilterEditConfiguration,
  };
  await render(DatePickerFilterComponent, {
    imports: [ ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule, MatInputModule, SharedImportsModule ],
    inputs: { datePickerFilter },
  });
};

describe('DatePickerFilterComponent', () => {

  test('should render single date picker', async () => {
    await setup('single');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('should render between dates picker', async () => {
    await setup('range');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

});
