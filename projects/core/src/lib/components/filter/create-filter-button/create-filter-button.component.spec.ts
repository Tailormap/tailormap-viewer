import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { CreateFilterButtonComponent } from './create-filter-button.component';
import { Store } from '@ngrx/store';
import userEvent from '@testing-library/user-event';
import { createFilter } from '../state/filter-component.actions';
import { FilterTypeEnum } from '@tailormap-viewer/api';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatIconModule } from '@angular/material/icon';

describe('CreateFilterButtonComponent', () => {

  test('should render', async () => {
    const dispatch = vi.fn();
    await render(CreateFilterButtonComponent, {
      imports: [ MatMenuModule, MatButtonModule, MatIconModule, MatIconTestingModule ],
      providers: [
        { provide: Store, useValue: { dispatch } },
      ],
    });
    expect(screen.getByText('Spatial filter')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Spatial filter'));
    expect(dispatch).toHaveBeenCalledWith(createFilter({ filterType: FilterTypeEnum.SPATIAL }));
  });

});
