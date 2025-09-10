import { render, screen } from '@testing-library/angular';
import { DropdownListFilterComponent } from './dropdown-list-filter.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterToolEnum, FilterTypeEnum } from '@tailormap-viewer/api';

describe('DropdownListFilterComponent', () => {

  test('should render', async () => {
    const dropdownListFilter: AttributeFilterModel = {
      id: 'filter1',
      attributeType: AttributeType.BOOLEAN,
      attribute: 'attribute1',
      condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
      value: ['true'],
      invertCondition: false,
      caseSensitive: false,
      type: FilterTypeEnum.ATTRIBUTE,
      editConfiguration: {
        filterTool: FilterToolEnum.DROPDOWN_LIST,
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
    };
    await render(DropdownListFilterComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      inputs: { dropdownListFilter },
    });
    expect(screen.getByText('Alias1')).toBeInTheDocument();
  });

});
