import { render, screen } from '@testing-library/angular';
import { DatePickerFilterComponent } from './date-picker-filter.component';
import { FilterToolEnum } from '@tailormap-viewer/api';
import { DateTime } from 'luxon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

describe('DatePickerFilterComponent', () => {

  test('should render single date picker', async () => {
    const datePickerFilterConfiguration = {
      filterTool: FilterToolEnum.DATE_PICKER,
      initialDate: DateTime.fromISO('1993-06-18'),
    };

    await render(DatePickerFilterComponent, {
      imports: [ ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule, MatInputModule, SharedImportsModule ],
      inputs: { datePickerFilterConfiguration },
    });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('should render between dates picker', async () => {
    const datePickerFilterConfiguration = {
      filterTool: FilterToolEnum.DATE_PICKER,
      initialLowerDate: DateTime.fromISO('1999-08-14'),
      initialUpperDate: DateTime.fromISO('2025-05-23'),
    };

    await render(DatePickerFilterComponent, {
      imports: [ ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule, MatInputModule, SharedImportsModule ],
      inputs: { datePickerFilterConfiguration },
    });
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

});
