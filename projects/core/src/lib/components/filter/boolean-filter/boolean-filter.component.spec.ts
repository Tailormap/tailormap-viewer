import { render, screen } from '@testing-library/angular';
import { BooleanFilterComponent } from './boolean-filter.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FilterToolEnum } from '@tailormap-viewer/api';

describe('BooleanFilterComponent', () => {

  test('should render with default values', async () => {
    await render(BooleanFilterComponent, {
      imports: [MatButtonToggleModule],
    });
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  test('should display aliases from booleanFilterConfiguration', async () => {
    await render(BooleanFilterComponent, {
      imports: [MatButtonToggleModule],
      inputs: { booleanFilterConfiguration: {
          filterTool: FilterToolEnum.BOOLEAN,
          alias1: 'Yes',
          alias2: 'No',
        },
      },
    });

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

});
