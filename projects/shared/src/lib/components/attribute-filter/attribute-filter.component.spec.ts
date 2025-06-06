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

});
