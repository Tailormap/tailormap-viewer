import { render, screen } from '@testing-library/angular';
import { CreateFilterButtonComponent } from './create-filter-button.component';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { createFilter } from '../state/filter-component.actions';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

describe('CreateFilterButtonComponent', () => {

  test('should render', async () => {
    const dispatch = jest.fn();
    await render(CreateFilterButtonComponent, {
      imports: [ MatMenuModule, MatButtonModule ],
      providers: [
        { provide: Store, useValue: { dispatch } },
      ],
    });
    expect(screen.getByText('Add filter'));
    await userEvent.click(screen.getByText('Add filter'));
    await userEvent.click(screen.getByText('Spatial'));
    expect(dispatch).toHaveBeenCalledWith(createFilter({ filterType: FilterTypeEnum.SPATIAL }));
  });

});
