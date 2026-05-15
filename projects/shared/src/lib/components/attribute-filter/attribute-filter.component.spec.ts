import { AttributeFilterComponent } from './attribute-filter.component';
import { render, screen, waitFor } from '@testing-library/angular';
import { AttributeType } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { FilterConditionEnum } from '@tailormap-viewer/api';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { of } from 'rxjs';

describe('AttributeFilterComponent', () => {

  test('should create a filter', async () => {
    const filterChangedFn = jest.fn(() => {});
    await render(AttributeFilterComponent, {
      imports: [ ReactiveFormsModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule ],
      inputs: {
        filter: {},
        attributeType: AttributeType.STRING,
      },
      on: { filterChanged: filterChangedFn },
    });
    await userEvent.click(screen.getByLabelText('Select condition'));
    await userEvent.click(await screen.findByText('Contains'));
    await userEvent.type(screen.getByRole('textbox'), 'test');
    await waitFor(() => {
      expect(filterChangedFn).toHaveBeenCalledWith({
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['test'],
        caseSensitive: false,
        invertCondition: false,
      });
    });
  });

  test('should not render case sensitive for unique values', async () => {
    const filterChangedFn = jest.fn(() => {});
    const uniqueValuesLoader$ = of([ 'value1', 'value2' ]);
    await render(AttributeFilterComponent, {
      imports: [ ReactiveFormsModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule ],
      inputs: {
        filter: {},
        attributeType: AttributeType.STRING,
        uniqueValues$: uniqueValuesLoader$,
      },
      on: { filterChanged: filterChangedFn },
    });
    await userEvent.click(screen.getByLabelText('Select condition'));
    expect(screen.queryByText('Case sensitive')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Choose values'));
    await waitFor(() => {
      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.queryByText('Case sensitive')).not.toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('value1'));
    await userEvent.click(screen.getByText('value2'));
    await waitFor(() => {
      expect(filterChangedFn).toHaveBeenCalledWith({
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        value: [ 'value1', 'value2' ],
        caseSensitive: false,
        invertCondition: false,
      });
    });
  });

});
