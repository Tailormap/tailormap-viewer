import { render, screen } from '@testing-library/angular';
import { SwitchFilterComponent } from './switch-filter.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AttributeFilterModel, AttributeType, FilterConditionEnum, FilterToolEnum, FilterTypeEnum } from '@tailormap-viewer/api';
import { TooltipDirective } from '@tailormap-viewer/shared';

describe('SwitchFilterComponent', () => {

  test('should render with default values', async () => {
    await render(SwitchFilterComponent, {
      imports: [MatButtonToggleModule],
      declarations: [TooltipDirective],
    });
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  test('should display aliases from switchFilterConfiguration', async () => {
    const switchFilter: AttributeFilterModel = {
      id: 'filter1',
      attributeType: AttributeType.BOOLEAN,
      attribute: 'attribute1',
      condition: FilterConditionEnum.BOOLEAN_TRUE_KEY,
      value: ['true'],
      invertCondition: false,
      caseSensitive: false,
      type: FilterTypeEnum.ATTRIBUTE,
      editConfiguration: {
        filterTool: FilterToolEnum.SWITCH,
        alias1: 'Yes',
        alias2: 'No',
      },
    };
    await render(SwitchFilterComponent, {
      imports: [MatButtonToggleModule],
      declarations: [TooltipDirective],
      inputs: { switchFilter },
    });

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

});
