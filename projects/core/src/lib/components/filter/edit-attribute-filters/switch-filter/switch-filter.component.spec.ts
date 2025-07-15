import { render, screen } from '@testing-library/angular';
import { SwitchFilterComponent } from './switch-filter.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FilterToolEnum } from '@tailormap-viewer/api';
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
    await render(SwitchFilterComponent, {
      imports: [MatButtonToggleModule],
      declarations: [TooltipDirective],
      inputs: { switchFilterConfiguration: {
          filterTool: FilterToolEnum.SWITCH,
          alias1: 'Yes',
          alias2: 'No',
        },
      },
    });

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

});
