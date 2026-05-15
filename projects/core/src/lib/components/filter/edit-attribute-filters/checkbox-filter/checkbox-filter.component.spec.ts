import { render, screen } from '@testing-library/angular';
import { CheckboxFilterComponent } from './checkbox-filter.component';
import { FilterConditionEnum, FilterToolEnum, AttributeType, FilterTypeEnum, AttributeFilterModel } from '@tailormap-viewer/api';
import { SharedImportsModule } from '@tailormap-viewer/shared';

describe('CheckboxFilterComponent', () => {

  test('should render', async () => {
    const checkboxFilter: AttributeFilterModel = {
      filter: {
        id: 'filter1',
        attributeType: AttributeType.STRING,
        condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
        attribute: 'attribute1',
        value: ['value1'],
        invertCondition: false,
        caseSensitive: false,
        type: FilterTypeEnum.ATTRIBUTE,
        editConfiguration: {
          filterTool: FilterToolEnum.CHECKBOX,
          attributeValuesSettings: [
            {
              value: 'value1',
              initiallySelected: true,
              selectable: true,
              alias: 'Alias1',
            },
            {
              value: 'value2',
              initiallySelected: false,
              selectable: true,
              alias: 'Alias2',
            },
          ],
        },
      },
      substringFilters: [],
    };
    await render(CheckboxFilterComponent, {
      imports: [SharedImportsModule],
      inputs: { checkboxFilter },
    });
    expect(screen.getByText('attribute1')).toBeInTheDocument();
    expect(screen.getByText('Alias1')).toBeInTheDocument();
    expect(screen.getByText('Alias2')).toBeInTheDocument();
  });

});
