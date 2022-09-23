import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AttributeListFilterComponent, FilterDialogData } from './attribute-list-filter.component';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { SharedModule } from '@tailormap-viewer/shared';
import { AttributeFilterComponent } from '../../../filter/attribute-filter/attribute-filter.component';
import userEvent from '@testing-library/user-event';

describe('AttributeListFilterComponent', () => {

  it('should create', async () => {
    const dialogRef = { close: jest.fn() };
    const dialogData: FilterDialogData = {
      columnName: 'col',
      filter: null,
      layerId: 1,
      columnType: FeatureAttributeTypeEnum.STRING,
    };
    const attributeFilterService = { setFilter: jest.fn(), removeFilter: jest.fn() };
    await render(AttributeListFilterComponent, {
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: SimpleAttributeFilterService, useValue: attributeFilterService },
      ],
      imports: [SharedModule],
      declarations: [AttributeFilterComponent],
    });

    expect(await screen.findByText('Filter on col')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Select condition'));
    await userEvent.click(screen.getByText('Equals'));
    await userEvent.type(await screen.findByRole('textbox'), 'test');
    await new Promise((resolve) => setTimeout(resolve, 300));
    await userEvent.click(await screen.findByRole('button', { name: 'Set' }));
    expect(attributeFilterService.setFilter).toHaveBeenCalledWith('ATTRIBUTE_LIST', 1, {
      attribute: 'col',
      attributeType: FeatureAttributeTypeEnum.STRING,
      caseSensitive: false,
      condition: 'EQUALS',
      invertCondition: false,
      value: ['test'],
    });
    expect(dialogRef.close).toHaveBeenCalled();
  });

});
