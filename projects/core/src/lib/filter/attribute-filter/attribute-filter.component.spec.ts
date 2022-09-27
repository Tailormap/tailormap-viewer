import { AttributeFilterComponent } from './attribute-filter.component';
import { render, screen, waitFor } from '@testing-library/angular';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { FilterConditionEnum } from '../models/filter-condition.enum';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';

describe('AttributeFilterComponent', () => {

  test('should create a filter', async () => {
    const filterChangedFn = { emit: jest.fn(() => {}) };
    await render(AttributeFilterComponent, {
      imports: [ ReactiveFormsModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule ],
      componentProperties: {
        filter: {},
        attributeType: FeatureAttributeTypeEnum.STRING,
        filterChanged: filterChangedFn as any,
        showCaseSensitiveInput: (): boolean => false,
        showInvertConditionInput: (): boolean => false,
      },
    });
    await userEvent.click(screen.getByLabelText('Select condition'));
    await userEvent.click(await screen.findByText('Contains'));
    await userEvent.type(screen.getByRole('textbox'), 'test');
    await waitFor(() => {
      expect(filterChangedFn.emit).toHaveBeenCalledWith({
        condition: FilterConditionEnum.STRING_LIKE_KEY,
        value: ['test'],
        caseSensitive: false,
        invertCondition: false,
      });
    });
  });

});
