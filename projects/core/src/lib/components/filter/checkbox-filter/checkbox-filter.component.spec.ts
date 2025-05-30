import { render, screen } from '@testing-library/angular';
import { CheckboxFilterComponent } from './checkbox-filter.component';
import { CheckboxFilterModel, FilterToolEnum } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { SharedImportsModule } from '@tailormap-viewer/shared';

describe('CheckboxFilterComponent', () => {

  test('should render', async () => {
    const label = 'label1';
    const checkboxFilterConfiguration: CheckboxFilterModel = {
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
    };
    await render(CheckboxFilterComponent, {
      imports: [SharedImportsModule],
      inputs: { label, checkboxFilterConfiguration } });
    expect(screen.getByText('label1'));
    await userEvent.click(screen.getByText('label1'));
    expect(screen.getByText('Alias1')).toBeInTheDocument();
    expect(screen.getByText('Alias2')).toBeInTheDocument();
  });

});
