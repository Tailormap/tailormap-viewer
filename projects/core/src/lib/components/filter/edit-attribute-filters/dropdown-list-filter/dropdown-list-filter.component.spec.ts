import { render, screen } from '@testing-library/angular';
import { DropdownListFilterComponent } from './dropdown-list-filter.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('DropdownListFilterComponent', () => {

  test('should render', async () => {
    const dropdownListFilterConfiguration = {
      filterTool: 'DROPDOWN_LIST',
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
    };
    await render(DropdownListFilterComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      inputs: { dropdownListFilterConfiguration },
    });
    expect(screen.getByText('Alias1')).toBeInTheDocument();
  });

});
